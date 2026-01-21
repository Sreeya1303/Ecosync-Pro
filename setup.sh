#!/bin/bash

echo "=========================================="
echo "    IoT Capstone Project - Setup Script   "
echo "=========================================="

echo "\n[0/2] Checking System Dependencies..."

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 could not be found. Please install from https://www.python.org/"
    exit 1
else
    echo "✅ Python 3 found ($(python3 --version))"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js warning: command not found. Ensure it is installed."
else
    echo "✅ Node.js found ($(node --version))"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "⚠️ npm warning: command not found."
else
    echo "✅ npm found ($(npm --version))"
fi

# 1. Backend Setup
echo "\n[1/2] Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment exists."
fi

echo "Installing backend requirements..."
source venv/bin/activate
python3 -m pip install -r requirements.txt

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

# 2. Frontend Setup
echo "\n[2/2] Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies (npm install)..."
    npm install
else
    echo "node_modules exists. Skipping npm install (run manually if needed)."
fi
cd ..

echo "\n=========================================="
echo "          Setup Complete!                 "
echo "=========================================="
echo " To start the system:"
echo " → Run: npm start"
echo "=========================================="
