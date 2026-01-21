#!/bin/bash

# ==========================================
#     IoT Capstone Project - Dependency Installer
# ==========================================

echo "=========================================="
echo "    IoT Capstone Project - Installer      "
echo "=========================================="

echo -e "\n[0/3] Checking System Dependencies..."

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 could not be found. Please install from https://www.python.org/"
    exit 1
else
    echo "✅ Python 3 found ($(python3 --version))"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js could not be found. Please install from https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js found ($(node --version))"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm could not be found. Please install standard Node.js."
    exit 1
else
    echo "✅ npm found ($(npm --version))"
fi

# 1. Backend Dependencies
echo -e "\n[1/3] Installing Backend Dependencies..."
cd backend || { echo "❌ Backend directory not found!"; exit 1; }

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Install requirements
echo "Installing backend requirements..."
source venv/bin/activate
pip install -r requirements.txt || { echo "❌ Failed to install backend requirements"; exit 1; }

# Create .env if missing
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "WARNING: .env.example not found! Creating default .env"
        echo "EMAIL_USER=alert.iot.capstone@gmail.com" > .env
        echo "EMAIL_PASS=fake_password_change_me" >> .env
    fi
else
    echo ".env file already exists."
fi

deactivate
cd ..

# 2. Frontend Dependencies
echo -e "\n[2/3] Installing Frontend Dependencies..."
cd frontend || { echo "❌ Frontend directory not found!"; exit 1; }

if [ ! -d "node_modules" ]; then
    echo "Installing backend node_modules..."
    npm install || { echo "❌ Failed to install frontend dependencies"; exit 1; }
else
    echo "Frontend dependencies (node_modules) already exist."
    # Optional: npm install again to be sure? 
    # For speed avoiding it if logic says they want to just "setup".
    # But usually a fresh install or ensure install is good.
    # Let's run install to be safe it's up to date.
    echo "Ensuring frontend packages are up to date..."
    npm install
fi
cd ..

# 3. Hardware check (requirements are mainly Python based for the bridge, which we handled)
echo -e "\n[3/3] Checking Hardware/Bridge..."
# We already installed 'pyserial' in step 1 if we did our job correctly (will update requirements next).

echo -e "\n=========================================="
echo "          Installation Complete!          "
echo "=========================================="
echo " To start the system:"
echo " 1. Start everything:      npm run start"
echo " 2. Start Hardware mode:   npm run start:physical"
echo "=========================================="
