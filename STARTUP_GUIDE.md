# 🚀 Quick Start Guide

## Prerequisites Check ✅
- ✅ Python 3.9.6 installed
- ✅ Backend virtual environment exists
- ✅ Frontend node_modules installed
- ✅ Old database removed (fresh start)

## Start the Application

### Option 1: One Command (Recommended)
```bash
npm start
```

This will start both backend and frontend simultaneously.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## First Time Setup

1. **Register a new account:**
   - Go to http://localhost:5173
   - Click "NEW USER? REGISTER ACCOUNT"
   - Enter email and password
   - Click "COMPLETE REGISTRATION"

2. **Login:**
   - Enter your email and password
   - You'll be prompted to set your location
   - Either allow auto-location or enter a city manually

3. **Explore:**
   - Dashboard: View sensor data and analytics
   - Live Map: Interactive environmental map
   - Devices: Manage connected devices
   - Settings: Configure thresholds

## 🔑 API Keys Configured

Your `.env` file has these API keys ready:

- **OpenWeatherMap**: `a9c05852882fc594d535b4896f848f9e`
- **OpenAQ**: `fee89ee2805b064836a07e1e1738850479fe9eea`
- **NASA**: JWT token (configured)

All external data sources are ready to use!

## Troubleshooting

### Backend won't start?
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start?
```bash
cd frontend
npm install
```

### Database errors?
```bash
rm backend/iot_system.db
# Restart the backend - it will recreate the database
```

## Features Ready to Use

✅ Email/Password Authentication
✅ Real-time Environmental Data
✅ AI-Powered Predictions
✅ Interactive Maps
✅ Voice Assistant
✅ Data Analytics
✅ Premium Glassmorphic UI

---

**You're all set! Just run `npm start` and enjoy! 🎉**
