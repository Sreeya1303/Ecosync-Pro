import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

EMAIL_USER = os.getenv("EMAIL_USER", "alert.iot.capstone@gmail.com") 
EMAIL_PASS = os.getenv("EMAIL_PASS", "fake_password_change_me")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_alert_email(to_email: str, subject: str, message: str):
    try:
        if "fake_password" in EMAIL_PASS:
            print(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}, Body: {message}")
            return

        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(message, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        text = msg.as_string()
        server.sendmail(EMAIL_USER, to_email, text)
        server.quit()
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
