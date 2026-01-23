# IoT Environmental Monitor - Installation Guide

## 1. Prerequisites (Software to Install)
Before running the project, ensure you have the following installed on your laptop:

*   **Visual Studio Code** (Code Editor): [Download](https://code.visualstudio.com/)
*   **Git** (Version Control): [Download](https://git-scm.com/downloads)
*   **Node.js (LTS Version)** (For Frontend): [Download](https://nodejs.org/) (v18 or v20 recommended)
*   **Python 3.9+** (For Backend): [Download](https://www.python.org/downloads/)
*   **Firebase CLI**: Run `npm install -g firebase-tools` in your terminal.

---

## 2. Public APIs Used
You will need API keys for these services to fully enable Pro Mode and AI features:

1.  **OpenWeatherMap** (Weather Data):
    *   Sign up: [https://openweathermap.org/api](https://openweathermap.org/api)
    *   Required Key: `OPENWEATHER_API_KEY`
2.  **OpenAQ** (Air Quality Data):
    *   Sign up: [https://openaq.org/](https://openaq.org/) (Optional, often public access is free)
    *   Required Key: `OPENAQ_API_KEY` (if hitting rate limits)
3.  **Google Gemini AI** (Smart Assistant):
    *   Get Key: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
    *   Required Key: `GEMINI_API_KEY`
4.  **Google OAuth** (For Gmail Login):
    *   Console: [https://console.cloud.google.com/](https://console.cloud.google.com/)
    *   Required: `GOOGLE_CLIENT_ID` (Frontend)

---

## 3. Local Installation Steps (Automated)

We have created helper scripts to make setup instantaneous.

### Step A: Clone Repository
```bash
git clone https://github.com/projectc943-prog/capstone-iot.git
cd capstone-iot
```

### Step B: One-Click Setup
Run this script to automatically install all dependencies for both Backend (Python) and Frontend (Node.js).
```bash
python3 scripts/setup.py
```

### Step C: Run Everything
Run this script to launch both the Backend Server and Frontend Dashboard simultaneously.
```bash
python3 scripts/start.py
```
*   **Backend** will start at: `http://localhost:8000`
*   **Frontend** will start at: `http://localhost:5173`

---

## 4. Manual Installation (Alternative)
If the scripts don't work for you, use these standard commands:

### Backend
1.  `cd backend`
2.  `python3 -m pip install -r requirements.txt`
3.  `uvicorn app.main:app --reload`

### Frontend
1.  `cd frontend`
2.  `npm install`
3.  `npm run dev`

---

## 4. Deployment Guide (No Credit Card)

### Backend (Hugging Face Spaces)
The backend is Dockerized.
1.  Create a Space on [Hugging Face](https://huggingface.co/spaces).
2.  Select **Docker** SDK.
3.  Push the files (Hugging Face provides git commands).
4.  Add your API Keys in the Space **Settings > Variables**.

### Frontend (Firebase Hosting)
1.  Run `firebase login`.
2.  Run `npm run build` inside `frontend/`.
3.  Run `firebase deploy`.
4.  Your site is live!
