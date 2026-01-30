from app import database
from sqlalchemy import text
import sys

def migrate():
    print("--- Starting Incremental Database Repair ---")
    with database.engine.connect() as conn:
        def run_sql(sql):
            try:
                print(f"Executing: {sql}")
                conn.execute(text(sql))
                conn.commit()
                print("✅ Success")
            except Exception as e:
                print(f"❌ Failed: {e}")

        # Individual Alter commands
        run_sql("ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS wind_threshold FLOAT DEFAULT 30.0")
        run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name TEXT")
        run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat FLOAT")
        run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lon FLOAT")

    print("DONE.")

if __name__ == "__main__":
    migrate()
