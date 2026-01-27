import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("EMAIL_USER")
password = os.getenv("EMAIL_PASS").replace(" ", "")

print(f"Testing SMTP for: {user}")

try:
    print("Connecting to smtp.gmail.com:587...")
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(user, password)
    print("LOGIN SUCCESS! Credentials are valid.")
    server.quit()
except Exception as e:
    print(f"LOGIN FAILED: {e}")
