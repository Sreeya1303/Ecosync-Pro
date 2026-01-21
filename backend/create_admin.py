from app import database, models, schemas
from app.core import security
from sqlalchemy.orm import Session

def create_admin_user():
    db = database.SessionLocal()
    try:
        email = "gitams4@gmail.com"
        password = "123456789"
        
        # Check if exists
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f"User {email} already exists. Updating role to Admin...")
            existing.role = "admin"
            existing.hashed_password = security.get_password_hash(password) # Ensure password matches
            db.commit()
        else:
            print(f"Creating new Admin user: {email}")
            hashed_pw = security.get_password_hash(password)
            new_user = models.User(
                email=email,
                phone_number="0000000000",
                hashed_password=hashed_pw,
                role="admin",
                is_active=True
            )
            db.add(new_user)
            db.commit()
            
        print("Admin user setup complete. You can now login via the gateway.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
