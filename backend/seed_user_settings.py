from app import database, models

def seed_alerts():
    db = database.SessionLocal()
    try:
        user_email = 'skunthal@gitam.in'
        exists = db.query(models.AlertSettings).filter(models.AlertSettings.user_email == user_email).first()
        
        if not exists:
            new_settings = models.AlertSettings(
                user_email=user_email,
                temp_threshold=35.0, # Lower for easier testing
                humidity_min=20.0,
                humidity_max=80.0,
                pm25_threshold=80.0,
                wind_threshold=20.0, # 20 km/h
                is_active=True
            )
            db.add(new_settings)
            db.commit()
            print(f"✅ Created personalized alert settings for {user_email}")
        else:
            print(f"ℹ️ Alert settings already exist for {user_email}")
            
    except Exception as e:
        print(f"❌ Error seeding alerts: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_alerts()
