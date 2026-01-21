import random
import string

import os
from twilio.rest import Client

def generate_otp(length=4):
    return ''.join(random.choices(string.digits, k=length))

def send_sms(phone_number: str, message: str):
    """
    Sends a real SMS using Twilio.
    Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in env.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    
    if not (account_sid and auth_token and from_number):
        print("[WARNING] Twilio credentials missing. SMS not sent (Simulated).")
        print(f"[SMS SIMULATION] To: {phone_number}, Msg: {message}")
        return False
        
    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number
        )
        print(f"SMS Sent! SID: {message.sid}")
        return True
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False
