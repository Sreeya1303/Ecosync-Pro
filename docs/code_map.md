# IoT System Code & Concept Map

This document links the theoretical concepts of the project to the actual source code files. Use this for your report references.

## 1. Core Algorithms (The "Brain")
*   **Concept**: Adaptive Kalman Filter (Sensor Fusion)
    *   **File**: [`backend/app/services/fusion_engine.py`](../backend/app/services/fusion_engine.py)
    *   **Logic**: Implements the `KalmanFilter` class (line 4) and fusion logic (line 30).
*   **Concept**: Anomaly Detection (AI Logic)
    *   **File**: [`backend/app/services/ai_service.py`](../backend/app/services/ai_service.py)
    *   **Logic**: Calls Google Gemini to analyze sensor data patterns.

## 2. Backend Infrastructure (API)
*   **Concept**: Main API Entry Point
    *   **File**: [`backend/app/main.py`](../backend/app/main.py)
    *   **Logic**: Setup, Database init, WebSocket endpoints.
*   **Concept**: Authentication (JWT & Signup)
    *   **File**: [`backend/app/routers/auth.py`](../backend/app/routers/auth.py)
    *   **Logic**: Handles Login, Signup-Init, and OTP verification.
*   **Concept**: Data Models (Database Schema)
    *   **File**: [`backend/app/models.py`](../backend/app/models.py)
    *   **Logic**: Defines `User`, `SensorData`, and `Alert` tables.

## 3. Frontend Architecture (React)
*   **Concept**: Routing & Navigation
    *   **File**: [`frontend/src/App.jsx`](../frontend/src/App.jsx)
    *   **Logic**: Defines paths for `/dashboard`, `/map`, `/analytics`.
*   **Concept**: Dashboard Layout
    *   **File**: [`frontend/src/layouts/DashboardLayout.jsx`](../frontend/src/layouts/DashboardLayout.jsx)
    *   **Logic**: Structure of the main view.
*   **Concept**: Real-time Data View
    *   **File**: [`frontend/src/pages/Dashboard.jsx`](../frontend/src/pages/Dashboard.jsx)
    *   **Logic**: Fetches data from API and renders charts.

## 4. Automation & Tools
*   **Concept**: One-Click Installation
    *   **File**: [`scripts/setup.py`](../scripts/setup.py)
*   **Concept**: System Launcher
    *   **File**: [`scripts/start.py`](../scripts/start.py)
