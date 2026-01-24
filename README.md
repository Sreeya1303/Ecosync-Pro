<div align="center">
  <img src="https://img.shields.io/badge/EcoSync-S4-emerald?style=for-the-badge&logo=leaf" alt="EcoSync Logo" />
  
  # EcoSync S4: Intelligent Environmental Monitoring
  
  **Next-Gen IoT Dashboard for Real-Time & Predictive Climate Analysis**
  
  [![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](https://github.com/projectc943-prog/Ecosync)
  [![Live Demo](https://img.shields.io/badge/Live-Demo-orange?style=flat-square&logo=netlify)](https://ecosync-s4-demo.netlify.app)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
</div>

---

## 🚀 Live Demo
**Access the Dashboard Here:** [**https://ecosync-s4-demo.netlify.app**](https://ecosync-s4-demo.netlify.app)  
*(Note: Create a new account to experience the Bio-Auth Login flow)*

---

## 🌟 Project Overview
EcoSync S4 is a state-of-the-art environmental monitoring system designed for precision, scalability, and user engagement. It fuses a robust ESP32-based hardware layer with a "Living UI" frontend to provide actionable insights into air quality and climate conditions.

### Key Features
*   **🟢 Pro Mode (Cloud)**: Full historical analysis, global mapping, and AI-driven insights powered by **Supabase**.
*   **🟡 Light Mode (Offline)**: Zero-latency local monitoring via **Web Serial API** (USB).
*   **🔐 Bio-Authenticated**: A secure, themed login experience mimicking biometric scanning.
*   **📱 Responsive**: Seamless experience across Desktop, Tablet, and Mobile.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | High-performance SPA with TailwindCSS |
| **Backend** | Supabase | Auth, PostgreSQL Database, Realtime Subscriptions |
| **Hardware** | ESP32 | Dual-Core MCU for WiFi & Serial comms |
| **Sensors** | DHT22 / BMP180 | Precision Temperature, Humidity, Pressure |
| **Hosting** | Netlify | Edge-optimized delivery |

---

## 📂 Repository Structure

-   `frontend/`: The User Interface (React).
-   `hardware/`: Firmware for the Sensing Node.
-   `docs/`: Detailed Implementation Guides.
    -   [Deployment Guide](docs/deployment_guide.md)
    -   [Features Overview](docs/features.md)
    -   [Codebase Map](docs/code_map.md)

---

## ⚡ Quick Start

### 1. Hardware Setup
Flash the `hardware/src/main.cpp` via PlatformIO to your ESP32. Ensure you set your WiFi credentials or just plug it in via USB for Light Mode.

### 2. Frontend Setup
```bash
git clone https://github.com/projectc943-prog/Ecosync.git
cd frontend
npm install
npm run dev
```

### 3. Environment Variables
Create a `.env` file in `frontend/`:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

<div align="center">
  <sub>Developed by Capstone Team S4 • 2026</sub>
</div>
