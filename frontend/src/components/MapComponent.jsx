import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import L from 'leaflet';
import { Navigation, Bot, Activity, Search } from 'lucide-react';
import { Geocoder } from 'leaflet-control-geocoder';

// Custom Icons
const createIcon = (color) => new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${color}; border: 2px solid white;"></div>`,
    iconSize: [12, 12]
});

// Robot Icon SVG as Leaflet Icon
// Advanced AI Drone Icon
const robotIcon = new L.DivIcon({
    className: 'ai-drone-icon',
    html: `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; background: rgba(16, 185, 129, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
        <div style="background: #064e3b; border: 2px solid #34d399; border-radius: 50%; padding: 6px; box-shadow: 0 0 15px rgba(52, 211, 153, 0.6); position: relative; z-index: 10;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 8h20"/><path d="M12 2v6"/><path d="M12 16v6"/><rect width="20" height="8" x="2" y="8" rx="2" fill="rgba(16, 185, 129, 0.4)"/>
            </svg>
        </div>
    </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
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

const SearchField = ({ onLocationFound }) => {
    const map = useMap();

    useEffect(() => {
        const geocoder = L.Control.Geocoder.nominatim();

        // Custom search control behavior could be added here
        // But leaflet-control-geocoder usually attaches a control to the map
        // Let's implement a custom search Input if we want better UI control
        // OR use the library's control.

        const control = L.Control.geocoder({
            defaultMarkGeocode: false,
            geocoder: geocoder,
            placeholder: "Search sector...",
            errorMessage: "Sector not found.",
            collapsed: false, // Make it always visible
            showResultIcons: true
        })
            .on('markgeocode', function (e) {
                const bbox = e.geocode.bbox;
                const poly = L.polygon([
                    bbox.getSouthEast(),
                    bbox.getNorthEast(),
                    bbox.getNorthWest(),
                    bbox.getSouthWest()
                ]);
                map.fitBounds(poly.getBounds());
                onLocationFound([e.geocode.center.lat, e.geocode.center.lng]);
            })
            .addTo(map);

        return () => map.removeControl(control);
    }, [map, onLocationFound]);

    return null;
};

const MapComponent = ({ isPro = false, sensorData = {}, position, onPositionChange }) => {
    // Local state for Robot only
    const [robotPos, setRobotPos] = useState([17.3860, 78.4877]);

    // Safe extraction of values
    const temp = sensorData.temperature?.toFixed(1) || '--';
    const hum = sensorData.humidity?.toFixed(1) || '--';
    const aqi = sensorData.mq_ppm?.toFixed(0) || '--';

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
                    onPositionChange([latitude, longitude]);
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
                style={{ height: '100%', minHeight: '400px', width: '100%', background: '#0f172a' }}
                zoomControl={false}
            >
                {/* Dark Mode Map Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapController center={position} />

                {isPro && <SearchField onLocationFound={onPositionChange} />}

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
                        <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-2 border-b border-emerald-200 pb-1">
                                <Navigation size={16} className="text-emerald-600" />
                                OPERATIVE STATUS
                            </h3>
                            <div className="space-y-1.5 text-xs text-slate-700">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 text-[10px] uppercase">Temp</span>
                                        <span className="font-mono font-bold text-emerald-800 text-sm">{temp}°C</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 text-[10px] uppercase">Humidity</span>
                                        <span className="font-mono font-bold text-emerald-800 text-sm">{hum}%</span>
                                    </div>
                                    <div className="flex flex-col col-span-2 border-t border-emerald-100 pt-1 mt-1">
                                        <span className="text-slate-500 text-[10px] uppercase">Air Quality (PM2.5)</span>
                                        <span className="font-mono font-bold text-emerald-800 text-sm">{aqi} PPM</span>
                                    </div>
                                </div>

                                <div className="bg-emerald-100 p-1.5 rounded border border-emerald-200 font-mono mt-2 text-[10px]">
                                    Lat: {position[0].toFixed(5)}<br />
                                    Lon: {position[1].toFixed(5)}
                                </div>
                            </div>
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
                            <div className="text-xs text-slate-600 mb-1">Patrolling Sector 7G</div>
                            <div className="bg-emerald-50 text-emerald-700 text-[10px] p-1 rounded font-mono border border-emerald-100">
                                BATTERY: 85%<br />
                                SIGNAL: STRONG
                            </div>
                        </div>
                    </Popup>
                </Marker>

                {/* Sensor Nodes (Hardcoded Demo Nodes) */}
                <CircleMarker center={[17.3950, 78.4967]} radius={6} fillColor="#f59e0b" color="transparent" fillOpacity={0.8}>
                    <Popup>
                        <div className="p-2 min-w-[160px]">
                            <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                                <Activity size={14} className="text-amber-600" /> NODE A - HYD NORTH
                            </h3>
                            <div className="text-xs space-y-1 text-slate-700">
                                <p className="flex justify-between"><span>Temp:</span> <span>32.5°C</span></p>
                                <p className="flex justify-between"><span>Humidity:</span> <span>45%</span></p>
                                <p className="flex justify-between"><span>AQI:</span> <span className="text-amber-400 font-bold">112 (Mod)</span></p>
                                <div className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-200">
                                    Last Update: 2m ago
                                </div>
                            </div>
                        </div>
                    </Popup>
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
