import subprocess
import os
import signal
import sys
import time
import platform

def run_all():
    print("="*50)
    print("   IoT Capstone - System Launcher 🚀")
    print("   Starting Backend (8000) and Frontend (5173)...")
    print("="*50)

    # Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')

    # Commands
    if platform.system() == "Windows":
        backend_cmd = "python -m uvicorn app.main:app --reload"
        frontend_cmd = "npm run dev"
        shell_flag = True
    else:
        backend_cmd = "python3 -m uvicorn app.main:app --reload"
        frontend_cmd = "npm run dev"
        shell_flag = True

    processes = []

    try:
        # Start Backend
        print("Starting Backend...")
        p_back = subprocess.Popen(backend_cmd, cwd=backend_dir, shell=shell_flag)
        processes.append(p_back)

        # Wait a sec for port binding
        time.sleep(2)

        # Start Frontend
        print("Starting Frontend...")
        p_front = subprocess.Popen(frontend_cmd, cwd=frontend_dir, shell=shell_flag)
        processes.append(p_front)

        print("\n[INFO] System is live!")
        print("Backend: http://localhost:8000")
        print("Frontend: http://localhost:5173")
        print("Press Ctrl+C to stop all servers.\n")

        # Keep alive
        p_back.wait()
        p_front.wait()

    except KeyboardInterrupt:
        print("\nStopping servers...")
        for p in processes:
            if platform.system() == "Windows":
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)])
            else:
                p.terminate()
        print("Done.")

if __name__ == "__main__":
    run_all()
