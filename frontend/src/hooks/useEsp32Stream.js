import { useState, useEffect, useRef, useCallback } from 'react';

// Mock Generator for ESP32 Data
const generateMockPacket = () => {
    const now = Date.now();
    return {
        deviceId: "ESP32_MOCK_001",
        ts: now,
        timestamp: new Date(now).toISOString(),
        temperature: 24 + Math.random() * 2 - 1, // 23-25°C
        humidity: 45 + Math.random() * 5 - 2.5,  // 42-48%
        mq_raw: 300 + Math.random() * 50,
        mq_ppm: 15 + Math.random() * 5,
        battery: 85 + Math.sin(now / 10000) * 5,
        rssi: -60 + Math.random() * 10
    };
};

export const useEsp32Stream = () => {
    const [stream, setStream] = useState({
        connected: false,
        lastSeen: null,
        data: null,
        history: [], // For 15m charts
        alerts: []
    });

    const bufferRef = useRef([]);

    useEffect(() => {
        let isActive = true;
        // Initially set connected to true, assuming we'll try to connect
        setStream(s => ({ ...s, connected: true }));

        const fetchEsp32Data = async () => {
            if (!isActive) return;

            try {
                const response = await fetch('/api/esp32-data'); // Replace with your actual API endpoint
                const latestData = await response.json();

                if (!latestData || !latestData.timestamp) {
                    // Set to disconnected and CLEAR data
                    setStream(s => ({ ...s, connected: false, data: null }));
                    return;
                }

                const now = Date.now();
                const dataTime = new Date(latestData.timestamp).getTime();
                const latency = now - dataTime;

                // If data is too old (> 10 seconds), treat as disconnected/blank
                if (latency > 10000) {
                    setStream(s => ({ ...s, connected: false, data: null }));
                    return;
                }

                // Real Data Packet
                const packet = {
                    deviceId: "ESP32_MAIN",
                    ts: dataTime,
                    timestamp: latestData.timestamp,
                    temperature: latestData.temperature,
                    humidity: latestData.humidity,
                    mq_raw: latestData.mq_raw || 0,
                    mq_ppm: latestData.pm25 || 0,
                    battery: 98,
                    rssi: -50,
                    pressure: latestData.pressure || 1013
                };

                // Update History Buffer
                bufferRef.current = [...bufferRef.current, packet].slice(-50);

                // --- Real Smart Alerts ---
                const newAlerts = [];
                if (packet.temperature > 35) {
                    newAlerts.push({
                        metric: 'TEMP',
                        msg: 'Critical Thermal Spike',
                        reason: `Sensor reading exceeds 35°C`,
                        severity: 'high'
                    });
                }

                setStream({
                    connected: true,
                    lastSeen: now,
                    data: packet,
                    history: bufferRef.current,
                    alerts: newAlerts,
                    trustScore: latency < 5000 ? 100 : 50
                });

            } catch (err) {
                console.error("ESP32 Fetch Error:", err);
                if (isActive) setStream(s => ({ ...s, connected: false, data: null }));
            }
        };

        // Fetch data every second
        const interval = setInterval(fetchEsp32Data, 1000);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, []);

    return stream;
};
