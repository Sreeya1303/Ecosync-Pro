#!/bin/bash

echo "========================================="
echo "   IoT Dashboard - Auto Setup Script"
echo "========================================="

# 1. Backend Setup
echo ">>> Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python Virtual Environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Python Dependencies..."
pip install -r requirements.txt
# Start Backend in Background
echo "Starting Backend Server..."
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID)"

# 2. Frontend Setup
echo ">>> Setting up Frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing Node Modules..."
    npm install
fi
echo "Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo "========================================="
echo "   System is LIVE!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "========================================="
echo "Press CTRL+C to stop servers."

wait $FRONTEND_PID $BACKEND_PID
