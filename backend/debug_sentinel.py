import os
from app import database, models
from app.main import check_alerts
from datetime import datetime

def debug_alerts():
    db = database.SessionLocal()
    try:
        user_email = 'mgogula@gitam.in'
        print(f"--- Debugging for {user_email} ---")
        
        # 1. Verify DB Connection & Tables
        engine = database.engine
        from sqlalchemy import inspect
        inspector = inspect(engine)
        cols = [c['name'] for c in inspector.get_columns('users')]
        print(f"User columns in DB: {cols}")
        
        if 'location_lat' not in cols:
            print("!!! CRITICAL: location_lat is MISSING from the 'users' table.")
            # return # Don't return, let's see what happens

        # 2. Check Settings
        settings = db.query(models.AlertSettings).filter(models.AlertSettings.user_email == user_email).first()
        if settings:
            print(f"Settings found: Temp Thresh={settings.temp_threshold}, Active={settings.is_active}")
        else:
            print(f"No custom settings for {user_email}.")
            settings = db.query(models.AlertSettings).first()
            if settings:
                print(f"Default Settings (fallback): {settings.user_email} | Thresh={settings.temp_threshold}")

        # 3. Trigger Logic
        device = db.query(models.Device).first()
        measurement = models.SensorData(
            device_id=device.id if device else "DUMMY",
            temperature=20.0, # CURRENT
            humidity=50.0,
            pm2_5=30.0,
            timestamp=datetime.utcnow()
        )
        db.add(measurement)
        db.commit()
        
        print("\nTriggering Alert Core...")
        # Note: We pass session, device, measurement and email
        check_alerts(db, device, measurement, user_email)
        print("Success: check_alerts execution finished.")

    except Exception as e:
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_alerts()
