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

## 3. Local Installation Steps

### Step A: Clone Repository
```bash
git clone https://github.com/projectc943-prog/capstone-iot.git
cd capstone-iot
```

### Step B: Backend Setup
1.  Navigate to folder: `cd backend`
2.  Create Virtual Environment: `python3 -m venv venv`
3.  Activate it:
    *   Mac/Linux: `source venv/bin/activate`
    *   Windows: `venv\Scripts\activate`
4.  Install Requirements: `pip install -r requirements.txt`
5.  Setup Environment:
    *   Create `.env` file from `.env.example`
    *   Paste your API Keys.
6.  Run Server: `uvicorn app.main:app --reload`
    *   Running at: `http://localhost:8000`

### Step C: Frontend Setup
1.  Open new terminal.
2.  Navigate to folder: `cd frontend`
3.  Install Dependencies: `npm install`
4.  Run App: `npm run dev`
    *   Running at: `http://localhost:5173`

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
