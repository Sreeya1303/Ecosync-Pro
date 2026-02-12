import sqlite3
import os

DB_PATH = "/Users/sreekar/Ecosync-Pro/backend/iot_system.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if motion column exists
        cursor.execute("PRAGMA table_info(sensor_data)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "motion" not in columns:
            print("Adding 'motion' column to 'sensor_data' table...")
            cursor.execute("ALTER TABLE sensor_data ADD COLUMN motion BOOLEAN DEFAULT 0")
            print("✅ 'motion' column added successfully.")
        else:
            print("⚠️ 'motion' column already exists.")

        # Check alert_settings table
        cursor.execute("PRAGMA table_info(alert_settings)")
        alert_columns = [row[1] for row in cursor.fetchall()]
        if "wind_threshold" not in alert_columns:
            print("Adding 'wind_threshold' column to 'alert_settings' table...")
            cursor.execute("ALTER TABLE alert_settings ADD COLUMN wind_threshold FLOAT DEFAULT 30.0")
            print("✅ 'wind_threshold' column added successfully.")
        else:
            print("⚠️ 'wind_threshold' column already exists.")

        conn.commit()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
