import os
import requests
import time
from app import database, models
from dotenv import load_dotenv

load_dotenv()

# 1. Check User in DB
db = database.SessionLocal()
email = "skunthal@gitam.in"
user = db.query(models.User).filter(models.User.email == email).first()
print(f"User in DB: {'Yes' if user else 'No'}")
db.close()

# 2. Test Login Timing
url = "http://localhost:8005/token"
payload = {
    "username": email,
    "password": "sreekar@123" # I'll assume this or whatever password was used
}

print(f"POSTing to {url}...")
start = time.time()
try:
    response = requests.post(url, data=payload, timeout=10)
    end = time.time()
    print(f"Status Code: {response.status_code}")
    print(f"Time Taken: {end - start:.2f}s")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
