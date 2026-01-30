from app import database
from sqlalchemy import text

def migrate():
    print("Starting migration: Adding wind_threshold to alert_settings...")
    try:
        with database.engine.connect() as conn:
            # PostgreSQL syntax (handled by Supabase)
            conn.execute(text("ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS wind_threshold FLOAT DEFAULT 30.0"))
            conn.commit()
            print("✅ Successfully updated alert_settings table.")
            
            # Also add to User table for persistent coordinates if not there
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat FLOAT"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lon FLOAT"))
            conn.commit()
            print("✅ Successfully updated users table with coordinates.")
            
    except Exception as e:
        print(f"❌ Migration Error: {e}")

if __name__ == "__main__":
    migrate()
