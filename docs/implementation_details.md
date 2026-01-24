# Implementation and Technical Details

## 1. System Architecture

EcoSync S4 has been modernized to use a **React + Supabase + IoT** architecture, moving away from the legacy Python/SQLite backend to ensure scalability, real-time access, and better user experience.

### A. Frontend (Client)
*   **Framework**: React (Vite)
*   **Styling**: TailwindCSS with a custom "Bio-Tech" theme (Emerald/Dark Green palette).
*   **Hosting**: Netlify.
*   **Key Components**:
    *   **Pro Dashboard**: Connects to Supabase to fetch historical sensor data.
    *   **Light Mode**: Connects directly to ESP32 via Web Serial API for offline/local use.
    *   **Auth System**: Custom "Bio-Scanner" login UI integrated with Supabase Auth.

### B. Backend (Cloud)
*   **Platform**: Supabase (BaaS).
*   **Database**: PostgreSQL.
*   **Authentication**: Supabase Auth (Email/Password) with JWT.
*   **Realtime**: Postgres Changes (Listening for sensor updates).
*   **Security**: Row Level Security (RLS) policies enforce data privacy.

### C. Hardware (Edge)
*   **Microcontroller**: ESP32 / ESP8266.
*   **Sensors**: DHT11/22, BMP180, MQ-135.
*   **Connectivity**: 
    1.  **WiFi Mode**: Sends JSON payloads to Supabase REST API.
    2.  **Serial Mode**: Streams JSON payloads via USB (115200 baud) for Light Mode.

---

## 2. Core Features

### A. Dual-Mode Dashboard
EcoSync offers two primary ways to view data:
1.  **Pro Mode (Cloud)**:
    -   Best for: Remote monitoring, historical analysis, multi-device access.
    -   Tech: `recharts`, `supabase-js`.
    -   Features: 24h history charts, min/max stats, reliable cloud storage.
2.  **Light Mode (Local)**:
    -   Best for: Field work, no internet, debugging.
    -   Tech: `navigator.serial`.
    -   Features: Instant live values, direct hardware connection, zero-latency.

### B. "Bio-Auth" Security
The login system is more than just a form; it's a themed experience:
-   Visual feedback imitating a biometric scan.
-   Secure token handling via Supabase client.
-   Auto-redirects based on session state.

---

## 3. Data Flow

1.  **Sensor Reading**: ESP32 reads physical sensors every 2-5 seconds.
2.  **Preprocessing**: Basic outlier filtration on the edge device.
3.  **Transmission**:
    -   If WiFi Connected: HTTP POST to Supabase Table `sensor_data`.
    -   If USB Connected: `Serial.println(json_string)`.
4.  **visualization**:
    -   Frontend polls Supabase (or subscribes) to update Pro Dashboard.
    -   Frontend parses Serial stream to update Light Dashboard cards.

---

## 4. Setup Guide

### Environment Variables (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Deployment
The frontend is optimized for Netlify/Vercel.
Build command: `npm run build`
Output directory: `dist`
