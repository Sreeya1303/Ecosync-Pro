import serial
import time
import requests
import json

# --- CONFIGURATION ---
SERIAL_PORT = '/dev/cu.usbmodem141201' # Your specific Arduino Port
BAUD_RATE = 115200

# Blynk Credentials from User
BLYNK_TEMPLATE_ID = "TMPL3yy0cs--q"
BLYNK_TEMPLATE_NAME = "SMART DEVICE"
BLYNK_AUTH_TOKEN = "MkSpbws2is9fJBmCSYiiBgCUSQLYAKGS"

# Blynk HTTP API URL
BLYNK_URL = f"https://blynk.cloud/external/api/update?token={BLYNK_AUTH_TOKEN}"

def main():
    print(f"--- EcoSync S4 Cloud Bridge ---")
    print(f"Target: {BLYNK_TEMPLATE_NAME} ({BLYNK_TEMPLATE_ID})")
    print(f"Connecting to Arduino on {SERIAL_PORT}...")
    
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2) # Wait for Arduino reset
        print("Connected! Listening for sensor data...")
        
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                
                # Check if line is valid JSON (Arduino sends {"soil_moisture": X, ...})
                if line.startswith("{") and line.endswith("}"):
                    try:
                        data = json.loads(line)
                        wave_count = data.get("soil_moisture", 0) # We mapped count to this field
                        
                        # Send to Blynk (Virtual Pin V1)
                        # We only convert to Int to send cleaner numbers
                        payload = f"&v1={int(wave_count)}"
                        
                        try:
                            response = requests.get(BLYNK_URL + payload)
                            if response.status_code == 200:
                                print(f"☁️  Sent to Blynk: Waves={int(wave_count)} (V1)")
                            else:
                                print(f"⚠️  Blynk Error: {response.status_code}")
                        except Exception as e:
                            print(f"⚠️  Network Error: {e}")
                            
                    except json.JSONDecodeError:
                        print(f"Received raw text: {line}")
                else:
                    # Just print debug messages (like "LCD Initialized")
                    print(f"Device: {line}")
                    
    except KeyboardInterrupt:
        print("\nStopping Bridge...")
    except serial.SerialException as e:
        print(f"Error connecting to serial port: {e}")

if __name__ == "__main__":
    main()
