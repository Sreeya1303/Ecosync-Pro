# EcoSync S4 - User Manual

## 1. Accessing the Platform
Visit the live dashboard (check README for link) or run locally.

## 2. Authentication (Bio-ID)
*   The login screen features a biometric scanning animation.
*   **New Users**: Click "Enroll Bio-ID" (Sign Up) to create an account.
*   **Returning Users**: Use "Verify Bio-ID" (Login).
*   *Note: This mimics biometric auth but uses standard secure email/password under the hood.*

## 3. Dashboard Modes
Once logged in, the dashboard adapts to your connection:

### Pro Mode (Cloud)
*   Selected by default when internet is available.
*   **Live Metrics**: View real-time cards for Temp, Humidity, Air Quality.
*   **Map**: See the geolocation of the sensor node.
*   **Analytics**: toggle the "Historical" tab to see line charts.

### Light Mode (Direct Link)
*   Click the "⚡" icon to switch to Light Mode.
*   Connect your ESP32 via USB.
*   Select the COM Port in the browser pop-up.
*   Data will stream directly from the device to the browser (No internet needed).

## 4. Settings
*   Click the gear icon to configure alert thresholds or update your profile.
