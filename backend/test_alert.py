import requests
import json

API_BASE = "http://localhost:8009"

print("=" * 60)
print("TESTING ALERT SYSTEM")
print("=" * 60)

# Simulate sensor data that should trigger an alert
# Temperature 20°C > Threshold 10°C = ALERT!
test_data = {
    "temperature": 20.0,  # Current temp
    "humidity": 50.0,
    "pm25": 30.0,
    "pressure": 1013.0,
    "mq_raw": 100.0,
    "wind_speed": 5.0,
    "user_email": "mgogula@gitam.in",  # Your email
    "lat": 17.3850,
    "lon": 78.4867
}

print("\n1. Sending sensor data to trigger alert...")
print(f"   Temperature: {test_data['temperature']}°C")
print(f"   User: {test_data['user_email']}")

try:
    response = requests.post(
        f"{API_BASE}/iot/data",
        json=test_data,
        timeout=10
    )
    
    if response.status_code == 200:
        print("\n✅ Data sent successfully!")
        print(f"   Response: {response.json()}")
        print("\n📧 Check your email inbox for the alert!")
        print(f"   Email should be sent to: {test_data['user_email']}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(f"   {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n❌ Cannot connect to backend on port 8009")
    print("   Make sure the server is running")
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 60)
