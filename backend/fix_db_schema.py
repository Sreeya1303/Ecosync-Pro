import psycopg2
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Direct connection to Supabase (bypassing SQLAlchemy)
DATABASE_URL = os.getenv("DATABASE_URL")

def run_migration():
    print("=" * 60)
    print("ECOSYNC DATABASE MIGRATION - ROBUST VERSION")
    print("=" * 60)
    
    # Parse connection string
    conn = None
    try:
        print("\n1. Connecting to Supabase...")
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        conn.autocommit = True  # Each statement commits immediately
        cursor = conn.cursor()
        print("✅ Connected successfully")
        
        migrations = [
            ("Add location_name to users", 
             "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name TEXT"),
            
            ("Add location_lat to users", 
             "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat FLOAT"),
            
            ("Add location_lon to users", 
             "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lon FLOAT"),
            
            ("Add wind_threshold to alert_settings", 
             "ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS wind_threshold FLOAT DEFAULT 30.0"),
        ]
        
        print(f"\n2. Running {len(migrations)} migrations...")
        for i, (description, sql) in enumerate(migrations, 1):
            print(f"\n   [{i}/{len(migrations)}] {description}...")
            try:
                cursor.execute(sql)
                print(f"   ✅ Success")
                time.sleep(0.5)  # Small delay between operations
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"   ⚠️  Column already exists (skipping)")
                else:
                    print(f"   ❌ Error: {e}")
                    raise
        
        # Verify
        print("\n3. Verifying changes...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('location_name', 'location_lat', 'location_lon')
            ORDER BY column_name
        """)
        user_cols = [row[0] for row in cursor.fetchall()]
        print(f"   Users table columns: {user_cols}")
        
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'alert_settings' 
            AND column_name = 'wind_threshold'
        """)
        alert_cols = [row[0] for row in cursor.fetchall()]
        print(f"   Alert settings columns: {alert_cols}")
        
        if len(user_cols) == 3 and len(alert_cols) == 1:
            print("\n" + "=" * 60)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print("\nYour alert system is now ready to use.")
            print("Temperature alerts will now work correctly.")
        else:
            print("\n⚠️  Some columns may be missing. Please check manually.")
        
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        print("\nPlease check your DATABASE_URL in .env file")
        return False
    finally:
        if conn:
            conn.close()
            print("\n4. Database connection closed.")
    
    return True

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
