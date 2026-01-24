import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';

export const useEsp32Stream = (mode = 'light') => { // 'light' | 'pro'
    // State
    const [stream, setStream] = useState({
        connected: false,
        lastSeen: null,
        data: null,
        history: [],
        alerts: []
    });

    const [health, setHealth] = useState({
        packetsPerMin: 0,
        lastPacketTime: null,
        status: 'DISCONNECTED',
        confidence: 0
    });

    // Refs
    const bufferRef = useRef([]);
    const packetTimestamps = useRef([]);
    const readerRef = useRef(null);
    const portRef = useRef(null);
    const isActiveRef = useRef(true);

    // --- SHARED DATA PROCESSOR ---
    const processPacket = (rawData) => {
        if (!isActiveRef.current) return;

        const now = Date.now();
        // Normalize data structure
        // Handles both Serial JSON and Supabase DB structure
        const packet = {
            ts: now,
            timestamp: rawData.timestamp || new Date().toISOString(),
            temperature: rawData.temperature ?? 0,
            humidity: rawData.humidity ?? 0,
            pressure: rawData.pressure ?? 1013,
            pm25: rawData.pm25 ?? rawData.pm2_5 ?? 0,
            pm10: rawData.pm10 ?? 0,
            isAnomaly: rawData.isAnomaly ?? rawData.is_anomaly ?? false,
            anomalyScore: rawData.anomalyScore ?? rawData.anomaly_score ?? 0
        };

        // Update History Buffer (Max 50)
        bufferRef.current = [...bufferRef.current, packet].slice(-50);

        // Update Health
        packetTimestamps.current = [...packetTimestamps.current, now].filter(t => now - t < 60000);

        // Alerts
        const newAlerts = [];
        if (packet.isAnomaly) {
            newAlerts.push({
                metric: 'AI',
                msg: 'Anomaly Detected',
                reason: `Score: ${packet.anomalyScore.toFixed(1)}`,
                severity: 'high'
            });
        }
        if (packet.temperature > 40) {
            newAlerts.push({ metric: 'TEMP', msg: 'High Temp', reason: '> 40°C', severity: 'medium' });
        }

        // Update State
        setStream({
            connected: true,
            lastSeen: now,
            data: packet,
            history: bufferRef.current,
            alerts: newAlerts
        });

        setHealth({
            packetsPerMin: packetTimestamps.current.length,
            lastPacketTime: new Date(),
            status: 'CONNECTED',
            confidence: 100
        });
    };

    // --- PRO MODE: Supabase Realtime ---
    useEffect(() => {
        isActiveRef.current = true;
        if (mode !== 'pro') return;

        console.log("Starting PRO Mode (Supabase Stream)...");

        // 1. Fetch Latest
        const fetchLatest = async () => {
            const { data } = await supabase
                .from('sensor_data')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();
            if (data) processPacket(data);
        };
        fetchLatest();

        // 2. Subscribe
        const channel = supabase
            .channel('sensor-updates')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'sensor_data' },
                (payload) => processPacket(payload.new)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mode]);

    // --- LIGHT MODE: Web Serial Handling ---
    // (Managed via external connect function, but cleanup handled here)
    useEffect(() => {
        return () => {
            // Cleanup Serial on unmount or mode switch
            if (readerRef.current) readerRef.current.cancel();
            if (portRef.current) portRef.current.close();
        };
    }, [mode]);

    // Serial Connect Function (Exposed to UI)
    const connectSerial = async () => {
        if (mode !== 'light') return;

        try {
            if (!navigator.serial) {
                alert("Web Serial API not supported in this browser. Use Chrome/Edge.");
                return;
            }

            // Request Port
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 }); // Standard ESP32 baud rate
            portRef.current = port;

            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            console.log("Serial Connected!");
            setHealth(h => ({ ...h, status: 'CONNECTED' }));

            // Read Loop
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) {
                        // Attempt to parse JSON lines
                        // Note: This is a simple implementation; usually requires buffering lines
                        try {
                            const lines = value.split('\n');
                            for (const line of lines) {
                                if (line.trim().startsWith('{')) {
                                    const json = JSON.parse(line);
                                    processPacket(json);
                                }
                            }
                        } catch (e) {
                            console.log("Serial Parse Error (Non-JSON data):", value);
                        }
                    }
                }
            } catch (error) {
                console.error("Serial Read Error:", error);
            } finally {
                reader.releaseLock();
            }

        } catch (err) {
            console.error("Serial Connection Failed:", err);
            alert("Failed to connect to ESP32: " + err.message);
        }
    };

    return {
        ...stream,
        health,
        connectSerial: mode === 'light' ? connectSerial : undefined
    };
};
