import sys
import glob

try:
    import serial
    import requests
except ImportError as e:
    print("\nXXX Critical Error: Missing Dependencies XXX")
    print(f"Error: {e}")
    print("------------------------------------------------")
    print("Please run this script using the backend virtual environment:")
    print("  source ../backend/venv/bin/activate")
    print("  python serial_bridge.py")
    print("------------------------------------------------")
    sys.exit(1)

import time
import json

# --- Configuration ---
API_URL = "http://localhost:8000/ingest"
BAUD_RATE = 115200

def get_serial_ports():
    """ Lists serial port names on Mac """
    if sys.platform.startswith('darwin'):
        ports = glob.glob('/dev/tty.usbmodem*') + glob.glob('/dev/tty.usbserial*')
    else:
        ports = []
    return ports

def main():
    print("--- IoT Serial Bridge ---")
    ports = get_serial_ports()
    
    if not ports:
        print("No Serial Ports found! Connect your Arduino.")
        print("Using Simulation Mode (Fallback) instead? (Run 'npm run start:simulator' for software only)")
        return

    # Pick the first one or ask user (for automation we pick first)
    serial_port = ports[0]
    print(f"Connecting to {serial_port}...")

    try:
        ser = serial.Serial(serial_port, BAUD_RATE, timeout=1)
        time.sleep(2) # Wait for Arduino reset
        print(f"Connected! Bridging {serial_port} -> {API_URL}")

        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                if not line:
                    continue
                
                print(f"Raw: {line}")
                
                try:
                    # Parse JSON from Arduino
                    data = json.loads(line)
                    
                    # POST to Backend
                    try:
                        resp = requests.post(API_URL, json=data)
                        print(f"Sent: {data} | Status: {resp.status_code}")
                        
                        # Check for alerts in response (optional, if API returned them)
                         
                    except requests.exceptions.ConnectionError:
                        print("Backend unreachable! Is 'npm run start:backend' running?")

                except json.JSONDecodeError:
                    print("Invalid JSON received (Serial noise?)")
                    
    except serial.SerialException as e:
        print(f"Serial Error: {e}")
    except KeyboardInterrupt:
        print("\nStopping Bridge.")

if __name__ == "__main__":
    main()
