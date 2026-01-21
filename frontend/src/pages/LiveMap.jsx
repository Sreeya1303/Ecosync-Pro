import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import { Loader2, Wind, Thermometer, Activity, Save, X, Search, Crosshair, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import API_BASE_URL from '../config';

// --- CONSTANTS ---
const MAX_MARKERS = 200;
const POLL_INTERVAL = 5000; // 5 seconds

const MapEvents = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
};

// Locate Button Component
const LocateButton = ({ onLocationFound }) => {
    const [locating, setLocating] = useState(false);
    const map = useMap();

    const handleLocate = useCallback(() => {
        setLocating(true);
        map.locate().on("locationfound", function (e) {
            setLocating(false);
            map.flyTo(e.latlng, 10);
            onLocationFound(e.latlng);
        }).on("locationerror", function () {
            setLocating(false);
            alert("Could not access your location.");
        });
    }, [map, onLocationFound]);

    return (
        <button
            onClick={handleLocate}
            disabled={locating}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center w-10 h-10"
            title="Locate Me"
        >
            {locating ? <Loader2 className="animate-spin" size={20} /> : <Crosshair size={20} />}
        </button>
    );
};

// --- OPTIMIZED MARKER LAYER ---
const RealtimeMarkers = ({ markers }) => {
    // Memoize markers to prevent unnecessary re-renders
    const renderedMarkers = useMemo(() => {
        return markers.slice(0, MAX_MARKERS).map((marker) => (
            <CircleMarker
                key={marker.id}
                center={[marker.lat, marker.lon]}
                radius={12}
                pathOptions={{
                    fillColor: marker.color,
                    color: marker.color,
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }}
            >
                <Popup>
                    <div className="text-sm">
                        <h3 className="font-bold text-lg">{marker.name}</h3>
                        <p>🌡️ Temp: {marker.temp}°C</p>
                        <p>💧 Humidity: {marker.humidity}%</p>
                        <p>🌫️ AQI: {marker.aqi} ({marker.status})</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Updated: {new Date(marker.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </Popup>
            </CircleMarker>
        ));
    }, [markers]);

    return <>{renderedMarkers}</>;
};

const LiveMap = () => {
    const [selectedPos, setSelectedPos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pointData, setPointData] = useState(null);
    const [searchCity, setSearchCity] = useState('');
    const [realtimeMarkers, setRealtimeMarkers] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);

    // useRef to track if component is mounted (for cleanup)
    const isMounted = useRef(true);

    // --- REAL-TIME POLLING ---
    useEffect(() => {
        isMounted.current = true;

        const fetchRealtimeData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/realtime/map`);
                if (res.ok && isMounted.current) {
                    const data = await res.json();
                    setRealtimeMarkers(data.markers || []);
                    setLastUpdate(new Date());
                }
            } catch (e) {
                console.error("Realtime fetch error:", e);
            }
        };

        // Initial fetch
        fetchRealtimeData();

        // Poll every 5 seconds
        const interval = setInterval(fetchRealtimeData, POLL_INTERVAL);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    const handleMapClick = useCallback(async (latlng) => {
        setSelectedPos(latlng);
        setLoading(true);
        setPointData(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/map/point?lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = await res.json();
            setPointData(data);
        } catch (e) {
            console.error("Map Fetch Error", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveSource = useCallback(async () => {
        if (!pointData) return;
        const name = prompt("Enter a name for this location:", `Location ${pointData.location.lat.toFixed(2)}, ${pointData.location.lon.toFixed(2)}`);
        if (!name) return;

        try {
            await fetch(`${API_BASE_URL}/api/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceName: name,
                    connectorType: "public_api",
                    location: { lat: pointData.location.lat, lon: pointData.location.lon }
                })
            });
            alert("Location saved to Sources!");
        } catch {
            alert("Failed to save.");
        }
    }, [pointData]);

    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchCity}&count=1&language=en&format=json`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const { latitude, longitude } = data.results[0];
                handleMapClick({ lat: latitude, lng: longitude });
            } else {
                alert("City not found");
            }
        } catch {
            alert("Search failed");
        }
    }, [searchCity, handleMapClick]);

    return (
        <div className="flex h-full w-full relative">
            {/* Sidebar Panel for Data */}
            <div className={`absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-r border-cyan-500/30 z-[1000] p-6 transition-transform transform ${pointData || loading ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Location Data</h2>
                    <button onClick={() => { setPointData(null); setLoading(false); }}><X className="text-slate-400" /></button>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                        <p className="text-slate-400 text-sm">Querying Public APIs...</p>
                    </div>
                )}

                {pointData && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-slate-800 p-3 rounded border border-slate-700">
                            <p className="text-xs text-slate-500 font-mono">LAT: {pointData.location.lat.toFixed(4)}</p>
                            <p className="text-xs text-slate-500 font-mono">LON: {pointData.location.lon.toFixed(4)}</p>
                        </div>

                        {/* Weather */}
                        <div>
                            <h3 className="text-sm font-bold text-cyan-400 uppercase mb-2 flex items-center gap-2">
                                <Thermometer size={14} /> Weather
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-cyan-900/20 p-2 rounded">
                                    <p className="text-xs text-slate-400">Temp</p>
                                    <p className="text-lg font-mono text-white">{pointData.weather?.metrics?.temperatureC || '--'}°C</p>
                                </div>
                                <div className="bg-cyan-900/20 p-2 rounded">
                                    <p className="text-xs text-slate-400">Humidity</p>
                                    <p className="text-lg font-mono text-white">{pointData.weather?.metrics?.humidityPct || '--'}%</p>
                                </div>
                            </div>
                        </div>

                        {/* AQI */}
                        <div>
                            <h3 className="text-sm font-bold text-emerald-400 uppercase mb-2 flex items-center gap-2">
                                <Wind size={14} /> Air Quality
                            </h3>
                            <div className="bg-emerald-900/20 p-3 rounded border border-emerald-500/20">
                                <p className="text-3xl font-black text-white">{pointData.aqi?.metrics?.aqi || '--'}</p>
                                <p className="text-xs text-emerald-400">AQI Score</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSource}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        >
                            <Save size={18} /> SAVE SOURCE
                        </button>
                    </div>
                )}
            </div>

            {/* Map Area */}
            <div className="flex-1 relative h-full">
                {/* Search Overlay */}
                <div className="absolute top-4 left-20 z-[900] bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 flex p-2">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            className="bg-transparent text-white outline-none text-sm w-48"
                            placeholder="Search City..."
                            value={searchCity}
                            onChange={e => setSearchCity(e.target.value)}
                        />
                        <button type="submit" className="text-cyan-400 hover:text-white"><Search size={18} /></button>
                    </form>
                </div>

                {/* Real-time Status Badge */}
                <div className="absolute top-4 right-4 z-[900] bg-black/60 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-2 text-xs text-white border border-white/10">
                    <RefreshCw size={14} className={realtimeMarkers.length > 0 ? 'text-emerald-400' : 'text-slate-500'} />
                    <span>{realtimeMarkers.length} Stations</span>
                    {lastUpdate && <span className="text-slate-500">| {lastUpdate.toLocaleTimeString()}</span>}
                </div>

                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: '100%', width: '100%', background: '#0f172a' }}
                    preferCanvas={true} // Performance boost
                >
                    <LayersControl position="topleft">
                        <LayersControl.BaseLayer checked name="Sci-Fi Dark">
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Light Mode">
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    <MapEvents onMapClick={handleMapClick} />

                    {/* Optimized Real-time Markers */}
                    <RealtimeMarkers markers={realtimeMarkers} />

                    {/* Selected Position Marker */}
                    {selectedPos && (
                        <CircleMarker
                            center={selectedPos}
                            radius={8}
                            pathOptions={{ fillColor: '#06b6d4', color: '#fff', weight: 2, fillOpacity: 1 }}
                        />
                    )}

                    {/* Controls Overlay */}
                    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none' }}>
                        <div className="leaflet-control flex flex-col gap-2 items-end mt-16 mr-4" style={{ pointerEvents: 'auto' }}>
                            <LocateButton onLocationFound={(latlng) => {
                                setSelectedPos(latlng);
                                handleMapClick(latlng);
                            }} />
                        </div>
                    </div>
                </MapContainer>
            </div>
        </div>
    );
};

export default LiveMap;
