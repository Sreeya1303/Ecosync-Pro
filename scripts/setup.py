import os
import subprocess
import sys
import platform

def run_command(command, cwd=None):
    print(f"[SETUP] Running: {command} in {cwd or '.'}")
    try:
        if platform.system() == "Windows":
            subprocess.check_call(command, shell=True, cwd=cwd)
        else:
            subprocess.check_call(command, shell=True, cwd=cwd, executable='/bin/bash')
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Command failed: {e}")
        sys.exit(1)

def main():
    print("="*50)
    print("   IoT Capstone Project - Automated Setup")
    print("="*50)

    # 1. Backend Setup
    print("\n[1/3] Setting up Backend...")
    backend_dir = os.path.join(os.getcwd(), 'backend')
    
    if not os.path.exists(backend_dir):
        print("Error: 'backend' directory not found.")
        return

    # Check for virtual environment logic or simply install global if user prefers
    # For simplicity scripts, we assume user is okay installing to current python environment
    # OR we create one.
    
    # Simple mode: Install to current environment (User likely uses global python or knows venv)
    print("Installing Python dependencies from requirements.txt...")
    run_command(f"{sys.executable} -m pip install -r requirements.txt", cwd=backend_dir)

    # 2. Frontend Setup
    print("\n[2/3] Setting up Frontend...")
    frontend_dir = os.path.join(os.getcwd(), 'frontend')
    
    if not os.path.exists(frontend_dir):
        print("Error: 'frontend' directory not found.")
        return

    print("Installing Node.js dependencies (npm install)...")
    try:
        run_command("npm install", cwd=frontend_dir)
    except:
        print("Warning: 'npm' not found. Please install Node.js from https://nodejs.org")

    # 3. Environment Check
    print("\n[3/3] Checking Configuration...")
    if not os.path.exists(os.path.join(backend_dir, '.env')):
        print("Notice: backend/.env not found. Creating from example...")
        try:
            with open(os.path.join(backend_dir, '.env.example'), 'r') as src:
                with open(os.path.join(backend_dir, '.env'), 'w') as dst:
                    dst.write(src.read())
            print("Created .env. Please edit it with your real API Keys if needed.")
        except:
            print("Could not verify .env files.")

    print("\n" + "="*50)
    print("   SETUP COMPLETED SUCCESSFULLY!")
    print("   Run 'python3 scripts/start.py' to launch the system.")
    print("="*50)

if __name__ == "__main__":
    main()
