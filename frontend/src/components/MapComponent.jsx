import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Bot } from 'lucide-react';

// Custom Icons
const createIcon = (color) => new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid white;"></div>`,
    iconSize: [12, 12]
});

// Robot Icon SVG as Leaflet Icon
const robotIcon = new L.DivIcon({
    className: 'robot-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16] // Center
});

const LocateButton = ({ onLocate }) => {
    return (
        <button
            onClick={onLocate}
            className="absolute bottom-4 right-4 z-[400] bg-[#022c22] border border-emerald-500/50 p-3 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
            title="Locate Me"
        >
            <Navigation size={24} />
        </button>
    );
};

// Component to handle map view updates
const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

const MapComponent = ({ isPro = false }) => {
    const [position, setPosition] = useState([17.3850, 78.4867]); // Default: Hyderabad
    const [robotPos, setRobotPos] = useState([17.3860, 78.4877]); // Slightly offset

    // Simulate Robot Movement (Patrol)
    useEffect(() => {
        const interval = setInterval(() => {
            setRobotPos(prev => [
                prev[0] + (Math.random() - 0.5) * 0.001,
                prev[1] + (Math.random() - 0.5) * 0.001
            ]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleLocate = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => alert("Location access denied or unavailable.")
            );
        } else {
            alert("Geolocation not supported by this browser.");
        }
    };

    return (
        <div className="relative h-full w-full">
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                zoomControl={false}
            >
                {/* Dark Mode Map Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapController center={position} />

                {/* User Location */}
                <CircleMarker
                    center={position}
                    radius={8}
                    fillColor="#10b981"
                    color="#fff"
                    weight={2}
                    fillOpacity={0.8}
                >
                    <Popup className="custom-popup bio-popup">
                        <div className="p-2 min-w-[150px]">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <Navigation size={16} className="text-emerald-600" />
                                Operative Location
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 font-mono">
                                Lat: {position[0].toFixed(4)} <br />
                                Lon: {position[1].toFixed(4)}
                            </p>
                        </div>
                    </Popup>
                </CircleMarker>

                {/* AI Agent (Robot) */}
                <Marker position={robotPos} icon={robotIcon}>
                    <Popup>
                        <div className="p-2 min-w-[150px]">
                            <h3 className="text-emerald-700 font-bold flex items-center gap-2">
                                <Bot size={16} /> S4 AGENT
                            </h3>
                            <div className="text-xs text-slate-600">Patrolling Sector</div>
                            <div className="text-xs font-mono text-emerald-600 mt-1">Temp: 24.5°C</div>
                        </div>
                    </Popup>
                </Marker>

                {/* Sensor Nodes (Hardcoded Demo Nodes) */}
                <CircleMarker center={[17.3950, 78.4967]} radius={6} fillColor="#f59e0b" color="transparent" fillOpacity={0.6}>
                    <Popup>Node A - Hyd North</Popup>
                </CircleMarker>

            </MapContainer>

            <LocateButton onLocate={handleLocate} />

            {/* Quick Stats Overlay (Map) */}
            <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs text-white w-48 font-mono shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">AMB_TEMP</span>
                    <span className="text-emerald-400 font-bold">24.2 °C</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">GRID_STATUS</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default MapComponent;
