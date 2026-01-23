# Project Feature List

## 1. Dashboard & Visualization
*   **Real-time Sensor Monitoring**: Displays Temperature, Humidity, Pressure, PM2.5, and Gas levels.
*   **Dynamic Graphs**: Area charts and Line charts showing trends over time.
*   **Leaflet Map Integration**: Shows device location on an interactive OpenStreetMap.
*   **Radar Chart**: "Environmental Pulse" visualization for quick status checks.

## 2. Advanced Analytics ("Pro Mode")
*   **Sensor Fusion (Kalman Filter)**: Merges local sensor data with external API data (OpenWeather) to provide a "Trusted" reading, eliminating sensor noise.
*   **Predictive Modeling**: Uses linear projection/Kalman prediction to forecast temperature trends 10 steps into the future.
*   **Anomaly Detection**: Automatically flags readings that deviate from safe norms (e.g., Sudden temperature spike).

## 3. Operations Mode ("Lite Mode")
*   **Low Bandwidth UI**: A simplified, text-heavy dashboard for slow connections.
*   **Direct Device Connection**: Ability to input IP/SSID to connect directly to an ESP32 unit on the LAN.
*   **Trust Score**: Calculates a "reliability percentage" for the sensor data based on stability.

## 4. Authentication & Security
*   **Multi-Step Sign Up**: Email -> OTP Verification -> Password Setup.
*   **Gmail Integration**: "Sign in with Google" flow (Token verification).
*   **Role-Based Access**: Simple user/admin separation logic.

## 5. AI & Integration
*   **AI Safety Officer**: Google Gemini AI analyzes air quality data to give human-readable health advice (e.g., "Air Quality is poor, avoid outdoor exercise").
*   **Public API Connectors**: Integrated with ThingSpeak, OpenAQ, and OpenWeatherMap for comparative data.
