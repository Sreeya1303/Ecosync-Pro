import uvicorn
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

print("DEBUG: Attempting to import app.main")
try:
    from app.main import app
    print("DEBUG: Import success")
    
    print("DEBUG: Starting uvicorn on port 8002...")
    # Using a different port to avoid conflicts
    # Using log_level="trace" for extreme verbosity
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="trace")
except SystemExit as se:
    print(f"DEBUG: SystemExit caught: {se.code}")
except Exception as e:
    print(f"DEBUG: FATAL CRASH: {e}")
    import traceback
    traceback.print_exc()
