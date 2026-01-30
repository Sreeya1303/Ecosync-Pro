import uvicorn
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

print("DEBUG: Attempting to import app.main")
try:
    from app.main import app
    print("DEBUG: Import success")
    
    print("DEBUG: Starting uvicorn")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="debug")
except Exception as e:
    print(f"DEBUG: FATAL CRASH: {e}")
    import traceback
    traceback.print_exc()
