from app import admin_setup, database, models, core
import os
import sys

# Ensure we are in the backend directory
if not os.path.exists("app"):
    print("Error: Run this script from the backend directory.")
    sys.exit(1)

def force_update_admin():
    db = database.SessionLocal()
    try:
        email = "gitams4@gmail.com"
        
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            # Force update password
            existing.hashed_password = core.security.get_password_hash("Admin123@#$")
            db.commit()
            print(f"✅ Admin password updated to: Admin123@#$")
        else:
            hashed_pw = core.security.get_password_hash("Admin123@#$")
            new_user = models.User(
                email=email,
                hashed_password=hashed_pw,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print(f"✅ Admin user created: {email} / Admin123@#$")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Running admin fix...")
    force_update_admin()
    print("Finished.")
