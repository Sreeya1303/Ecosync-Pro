from . import models, schemas, database
from .core import security
from sqlalchemy.orm import Session

def create_admin_user():
    db = database.SessionLocal()
    try:
        email = "gitams4@gmail.com"
        password = "admin123@#$"  # Updated secure password
        
        # Check if exists
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f"Admin user {email} already exists.")
        else:
            print(f"Creating new Admin user: {email}")
            hashed_pw = security.get_password_hash(password)
            new_user = models.User(
                email=email,
                hashed_password=hashed_pw,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print(f"✅ Admin user created: {email} / {password}")
            
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()
