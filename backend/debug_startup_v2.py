import asyncio
import os
import sys
import traceback

# Add current directory to path
sys.path.append(os.getcwd())

print("DEBUG: Importing app.main...")
try:
    from app.main import app, startup_event
    print("DEBUG: Import success")
    
    print("DEBUG: Manually running startup_event...")
    asyncio.run(startup_event())
    print("DEBUG: startup_event finished SUCCESS")
    
except SystemExit as se:
    print(f"DEBUG: SystemExit caught at startup: {se.code}")
except Exception as e:
    print(f"DEBUG: Startup CRASH: {e}")
    traceback.print_exc()
