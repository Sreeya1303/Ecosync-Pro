import { useState, useEffect, useRef } from 'react';

// MODE: 'light' now fetches from our Proxy API (Blynk Bridge)
export const useEsp32Stream = (mode = 'light') => {
    // State
    const [stream, setStream] = useState({
        connected: false,
        lastSeen: null,
        data: null,
        history: [],
        alerts: []
    });

    const [health, setHealth] = useState({
        status: 'DISCONNECTED',
        lastPacketTime: null
    });

    const bufferRef = useRef([]);

    useEffect(() => {
        let intervalId;

        const fetchData = async () => {
            try {
                // FETCH FROM OUR NEW SERVERLESS API
                const res = await fetch('/api/data');
                const data = await res.json();

                if (data.error) throw new Error(data.error);

                const now = Date.now();
                const packet = {
                    ts: now,
                    timestamp: new Date().toISOString(),
                    // Map Blynk API response to our UI format
                    temperature: data.temperature || 0,
                    humidity: data.humidity || 0,
                    mq_ppm: data.aqi || 0, // Gas
                    mq_raw: 999, // Placeholder
                    trustScore: 95, // Mock
                    deviceId: "ESP32-S4-BLYNK"
                };

                // Update Buffer
                bufferRef.current = [...bufferRef.current, packet].slice(-50);

                setStream({
                    connected: true,
                    lastSeen: now,
                    data: packet,
                    history: bufferRef.current,
                    alerts: []
                });

                setHealth({
                    status: 'ONLINE',
                    lastPacketTime: new Date()
                });

            } catch (err) {
                console.error("API Fetch Error:", err);
                // Keep old data but mark disconnected if too many fails
            }
        };

        // Poll every 3 seconds
        fetchData();
        intervalId = setInterval(fetchData, 3000);

        return () => clearInterval(intervalId);
    }, []);

    return {
        ...stream,
        health,
        connectSerial: () => console.log("Using Cloud API Mode")
    };
};
