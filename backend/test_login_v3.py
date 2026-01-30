import requests
import time

url = "http://localhost:8007/token"
payload = {
    'username': 'skunthal@gitam.in',
    'password': 'Password123@#$'
}

print(f"Testing login at {url}...")
try:
    start = time.time()
    r = requests.post(url, data=payload, timeout=20)
    end = time.time()
    print(f"Status: {r.status_code}")
    print(f"Time: {end - start:.2f}s")
    print(f"Body: {r.text[:200]}...")
except Exception as e:
    print(f"Error: {e}")
