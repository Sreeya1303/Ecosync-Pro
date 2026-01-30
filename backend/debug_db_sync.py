import os
import sys
import traceback
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"Syncing with: {db_url}")

try:
    from app import models, database
    print("Imported models and database")
    
    print("Starting metadata.create_all...")
    models.Base.metadata.create_all(bind=database.engine)
    print("Metadata sync SUCCESS")
    
except Exception as e:
    print(f"Metadata sync FAILED: {e}")
    traceback.print_exc()
