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
API_URL = "https://capstone-backend-djdd.onrender.com/iot/data"
BAUD_RATE = 115200

def get_serial_ports():
    """ Lists serial port names on Mac """
    if sys.platform.startswith('darwin'):
        # On Mac, Arduinos often appear as cu.usbmodem
        ports = glob.glob('/dev/cu.usbmodem*') + glob.glob('/dev/cu.usbserial*') + \
                glob.glob('/dev/tty.usbmodem*') + glob.glob('/dev/tty.usbserial*')
    else:
        ports = []
    # Deduplicate while preserving order
    return list(dict.fromkeys(ports))

def main():
    print("--- IoT Serial Bridge ---")
    
    while True:
        ports = get_serial_ports()
        
        if not ports:
            print("No Serial Ports found! Connect your Arduino. Retrying in 5s...")
            time.sleep(5)
            continue

        serial_port = ports[0]
        print(f"Connecting to {serial_port}...")

        try:
            with serial.Serial(serial_port, BAUD_RATE, timeout=1) as ser:
                time.sleep(2) # Wait for Arduino reset
                print(f"Connected! Bridging {serial_port} -> {API_URL}")

                while True:
                    try:
                        if ser.in_waiting > 0:
                            line = ser.readline().decode('utf-8', errors='ignore').strip()
                            if not line:
                                continue
                            
                            print(f"Raw: {line}")
                            
                            try:
                                # Parse JSON from Arduino
                                raw_json = json.loads(line)
                                
                                # Map keys to match Backend Pydantic Model (IoTSensorData)
                                mapped_data = {
                                    "temperature": raw_json.get("temperature", 0.0),
                                    "humidity": raw_json.get("humidity", 0.0),
                                    "pm25": raw_json.get("pm2_5", 0.0),
                                    "pressure": raw_json.get("pressure", 1013.0),
                                    "mq_raw": raw_json.get("vibration", 0.0) # Using vibration as a proxy for MQ for testing
                                }
                                
                                # POST to Backend
                                try:
                                    resp = requests.post(API_URL, json=mapped_data, timeout=5)
                                    print(f"Sent: {mapped_data} | Status: {resp.status_code}")
                                except requests.exceptions.RequestException as e:
                                    print(f"Backend error: {e}")

                            except json.JSONDecodeError:
                                print(f"Invalid JSON: {line}")
                        
                        time.sleep(0.1) # Prevent CPU hogging
                    except serial.SerialException as e:
                        print(f"Serial read error: {e}")
                        break # Break inner loop to trigger reconnect
                        
        except (serial.SerialException, OSError) as e:
            print(f"Connection lost or error: {e}. Retrying in 5s...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nStopping Bridge.")
            break

if __name__ == "__main__":
    main()
