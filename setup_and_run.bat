@echo off
echo =========================================
echo    IoT Dashboard - Auto Setup Script
echo =========================================

:: 1. Backend Setup
echo.
echo ^>^>^> Setting up Backend...
cd backend
if not exist venv (
    echo Creating Python Virtual Environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Python Dependencies...
pip install -r requirements.txt
echo Starting Backend Server...
start "IoT Backend" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: 2. Frontend Setup
echo.
echo ^>^>^> Setting up Frontend...
cd ..\frontend
if not exist node_modules (
    echo Installing Node Modules...
    call npm install
)
echo Starting Frontend...
start "IoT Frontend" cmd /k "npm run dev"

echo.
echo =========================================
echo    System is LIVE!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo =========================================
echo.
pause
