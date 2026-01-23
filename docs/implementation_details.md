# Implementation Technical Details

## 1. System Architecture
The system follows a modern **Microservice-lite Architecture**:

*   **Frontend**: React (Vite) Single Page Application (SPA).
    *   State Management: React Context (Auth) + Custom Hooks (`useEsp32Stream`).
    *   Styling: TailwindCSS + Lucide Icons.
    *   Charts: Recharts (D3-based).
*   **Backend**: Python FastAPI.
    *   Async I/O for high-performance API handling.
    *   **Dockerized** for consistent deployment.
*   **Database**: SQLite (`iot_system.db`).
    *   Relational schema using **SQLAlchemy** ORM.
    *   Stores Users, Devices, Sensor History, and Diary Entries.

---

## 2. Core Features Implementation

### A. Sensor Data Fusion (The "Brain")
Located in `backend/app/services/fusion_engine.py` and `ml_engine.py`.
*   **Problem**: Low-cost sensors (like DHT11) are noisy.
*   **Solution**: We implement an **Adaptive Kalman Filter**.
    *   It takes the raw noisy signal and an "External Reference" (OpenWeather API).
    *   It recursively estimates the true state of the environment.
    *   **Result**: Smooth graphs and accurate readings even if the sensor glitches.

### B. Secure Authentication
Located in `backend/app/routers/auth.py`.
*   **Multi-Factor-Like Flow**:
    1.  User enters Email -> Backend sends 6-digit OTP.
    2.  User enters OTP -> Account is Verified.
    3.  User sets Password.
*   **Session Management**:
    *   Uses **JWT (JSON Web Tokens)**.
    *   Stateless authentication (Scalable).

### C. AI Assistant (Gemini)
Located in `backend/app/services/ai_service.py`.
*   The system sends current sensor headers (Temp, Humidity, AQI) to Google Gemini Pro.
*   **Prompt**: "Act as an environmental scientist... analyze this data... give precautions."
*   **Output**: Real-time safety advice displayed on the Dashboard (e.g., "Wear a mask," "Hydrate").

### D. Lite Mode (Direct Connection)
Located in `frontend/src/components/dashboard/LiteView.jsx`.
*   A simplified interface designed for low-bandwidth scenarios.
*   Allows direct IP configuration to connect to local ESP32 units without complex cloud routing if needed.

---

## 3. Data Flow
1.  **Ingestion**: ESP32 sends JSON to `/iot/data`.
2.  **Processing**: Backend runs Kalman Filter & Anomaly Detection.
3.  **Storage**: Cleaned data saved to SQLite.
4.  **Broadcast**: Real-time updates sent to Frontend via **WebSockets** (`/ws/stream`).
5.  **Visualization**: React Frontend updates charts instantly.
