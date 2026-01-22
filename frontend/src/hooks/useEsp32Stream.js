import { useState, useEffect, useRef } from 'react';

export const useEsp32Stream = () => {
    const [stream, setStream] = useState({
        connected: false,
        lastSeen: null,
        data: null,
        history: [], // For 15m charts
        alerts: []
    });

    const [health, setHealth] = useState({
        packetsPerMin: 0,
        lastPacketTime: null,
        status: 'DISCONNECTED',
        confidence: 0
    });

    const bufferRef = useRef([]);
    const packetTimestamps = useRef([]);

    useEffect(() => {
        let isActive = true;

        const fetchEsp32Data = async () => {
            if (!isActive) return;

            try {
                const response = await fetch('http://localhost:8000/iot/latest');
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

                // Calculate MQ Index (0-100 normalized from 200-800 raw range)
                const mq_index = Math.min(100, Math.max(0, ((latestData.mq_raw || 0) - 200) / 6));

                // Real Data Packet
                const packet = {
                    deviceId: "ESP32_MAIN",
                    ts: dataTime,
                    timestamp: latestData.timestamp,
                    temperature: latestData.temperature,
                    humidity: latestData.humidity,
                    mq_raw: latestData.mq_raw || 0,
                    mq_index: mq_index,
                    battery: 98,
                    rssi: -50,
                    pressure: latestData.pressure || 1013
                };

                // Update History Buffer
                bufferRef.current = [...bufferRef.current, packet].slice(-50);

                // Update packet timestamps for health tracking
                const currentTime = Date.now();
                packetTimestamps.current = [...packetTimestamps.current, currentTime].filter(
                    t => currentTime - t < 60000 // Keep last 60 seconds
                );

                // Calculate health metrics
                const packetsPerMin = packetTimestamps.current.length;
                let status = 'CONNECTED';
                let confidence = 100;

                if (latency > 5000) {
                    status = 'STALE';
                    confidence = 50;
                } else if (latency > 2000) {
                    confidence = 75;
                }

                setHealth({
                    packetsPerMin,
                    lastPacketTime: new Date(dataTime),
                    status,
                    confidence: Math.round(confidence * (packetsPerMin / 60))
                });

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
                if (isActive) {
                    setStream(s => ({ ...s, connected: false, data: null }));
                    setHealth(h => ({ ...h, status: 'DISCONNECTED', confidence: 0 }));
                }
            }
        };

        // Fetch data every second
        const interval = setInterval(fetchEsp32Data, 1000);

        // Initial fetch
        fetchEsp32Data();

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, []);

    return { ...stream, health };
};
