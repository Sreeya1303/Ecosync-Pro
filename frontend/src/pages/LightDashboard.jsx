import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import {
    Activity, Droplets, Thermometer, Wind, AlertTriangle, Wifi, Zap,
    ShieldCheck, Eye, Activity as MotionIcon, HeartPulse, TrendingUp,
    History, ChevronUp, ChevronDown, Download, Filter, Search, MoreHorizontal,
    Leaf, Newspaper, ExternalLink, Menu, X, Cpu, Shield, Waves, CloudRain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEsp32Stream } from '../hooks/useEsp32Stream';
import NewsComponent from '../components/NewsComponent';
import API_BASE_URL from '../config';

// --- Sub-components ---

const Sparkline = ({ data, dataKey, color }) => (
    <div className="h-10 w-24">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    fill={`${color}33`}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

const StatCard = ({ title, value, unit, icon: Icon, color, trendData, dataKey }) => {
    const isRising = trendData && trendData.length > 1 && trendData[trendData.length - 1][dataKey] > trendData[trendData.length - 2][dataKey];

    return (
        <div className="glass-panel p-3 relative overflow-hidden group border-l-4" style={{ borderColor: color }}>
            <div className="flex justify-between items-start relative z-10 transition-transform group-hover:scale-[1.02] duration-300">
                <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-black text-white font-mono tracking-tighter">
                            {value}
                        </h3>
                        <span className="text-xs text-slate-500 font-bold uppercase">{unit}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={`p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-white shadow-xl group-hover:shadow-${color}/20`}>
                        <Icon size={18} style={{ color }} />
                    </div>
                    <div className={`flex items-center gap-0.5 text-[10px] font-black ${isRising ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isRising ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isRising ? 'RISING' : 'STABLE'}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between">
                <Sparkline data={trendData || []} dataKey={dataKey} color={color} />
                <div className="text-[9px] font-mono text-slate-600 uppercase">Live Pulse Log</div>
            </div>

            <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: color }} />
        </div>
    );
};

const IndustrialPanel = ({ title, children, icon: Icon, color = "#10b981", badge }) => (
    <div className="glass-panel p-3 border-slate-800/50 flex flex-col hover:border-slate-700/50 transition-colors">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-black text-slate-300 flex items-center gap-2 uppercase tracking-widest">
                <Icon size={16} style={{ color }} /> {title}
            </h3>
            {badge && (
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-900 border border-slate-800 text-slate-500 tracking-tighter uppercase">
                    {badge}
                </span>
            )}
        </div>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

// --- Main Page Component ---

const LightDashboard = ({ onToggle }) => {
    const { logout, userProfile, currentUser } = useAuth();
    const { data: latestReading, history: sensorData, connected: connectionStatus, connectSerial } = useEsp32Stream('light');

    const [activeView, setActiveView] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState('temperature');

    const [industrialData, setIndustrialData] = useState({
        safetyIndex: { risk_level: 'SAFE', color: 'emerald', reason: 'Analyzing...', details: {} },
        historyComp: { current: {}, normal: {} },
        motion: { daily_count: 0, unusual_activity: false, working_hours: '09:00 - 18:00' },
        health: { temperature: 'OK', humidity: 'OK', gas: 'OK' },
        predictions: { predicted_temp_10m: 0, predicted_gas_10m: 0, temperature_trend: 'stable' },
        explainableAlerts: []
    });

    const fetchIndustrialData = async () => {
        try {
            const endpoints = [
                '/api/industrial/safety-index',
                '/api/industrial/historical-comparison',
                '/api/industrial/motion-stats',
                '/api/industrial/sensor-health',
                '/api/industrial/predictions',
                '/api/industrial/alerts/explainable'
            ];
            const responses = await Promise.all(endpoints.map(e => fetch(`${API_BASE_URL}${e}`)));
            const [safetyIndex, historyComp, motion, health, predictions, explainableAlerts] = await Promise.all(responses.map(r => r.json()));

            setIndustrialData({ safetyIndex, historyComp, motion, health, predictions, explainableAlerts });
        } catch (e) {
            console.error("Industrial Data Fetch Error:", e);
        }
    };

    useEffect(() => {
        fetchIndustrialData();
        const interval = setInterval(fetchIndustrialData, 5000);
        return () => clearInterval(interval);
    }, []);

    const latestData = useMemo(() => {
        return (sensorData && sensorData.length > 0) ? sensorData[sensorData.length - 1] : (latestReading || {});
    }, [sensorData, latestReading]);

    // CSV Export Utility
    const exportToCSV = () => {
        const { explainableAlerts } = industrialData;
        if (explainableAlerts.length === 0) return;

        const headers = ["Timestamp", "Message", "Reason", "Normal Temp", "Normal Gas"];
        const rows = explainableAlerts.map(a => [
            new Date(a.timestamp).toLocaleString(),
            a.message,
            a.reason,
            a.current_context.normal_temp,
            a.current_context.normal_gas
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `firecracker_safety_audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const { safetyIndex, historyComp, motion, health, predictions, explainableAlerts } = industrialData;

    const renderOverview = () => (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Main Risk Status Row */}
            <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center gap-8 transition-all duration-700 shadow-2xl relative overflow-hidden bg-slate-950/50
                            ${safetyIndex.color === 'red' ? 'border-red-500/40 bg-red-950/5' :
                    safetyIndex.color === 'orange' ? 'border-orange-500/40 bg-orange-950/5' :
                        'border-emerald-500/40 bg-emerald-950/5'}`}>

                <div className="text-6xl animate-bounce duration-[3000ms]">
                    {safetyIndex.risk_level === 'SAFE' ? '🟢' : safetyIndex.risk_level === 'MEDIUM RISK' ? '🟠' : '🔴'}
                </div>
                <div className="relative z-10 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                        Industrial Safety Engine Status
                        <span className="text-slate-600 font-mono">LATENCY: 42ms</span>
                    </p>
                    <h2 className={`text-5xl font-black font-mono tracking-tighter leading-none mb-2
                                  ${safetyIndex.color === 'red' ? 'text-red-400' :
                            safetyIndex.color === 'orange' ? 'text-orange-400' :
                                'text-emerald-400'}`}>
                        {safetyIndex.risk_level}
                    </h2>
                    <p className="text-sm text-slate-300 font-medium italic opacity-90">{safetyIndex.reason}</p>
                </div>

                {/* Hardware Status Node */}
                <div className="hidden lg:flex flex-col items-end gap-3 border-l border-slate-800 pl-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Hardware Link</span>
                    </div>
                    {!connectionStatus && (
                        <button onClick={connectSerial} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-black rounded-lg transition-all active:scale-95 uppercase tracking-widest">
                            Initialize Pairing
                        </button>
                    )}
                </div>

                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            </div>

            {/* Explainable Alert Alert */}
            {explainableAlerts.length > 0 && safetyIndex.risk_level !== 'SAFE' && (
                <div className="group relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5 p-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-red-500/20 rounded-2xl shadow-inner border border-red-500/20">
                                <AlertTriangle className="text-red-500 animate-pulse" size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-100 uppercase tracking-tight">System Integrity Threat</h3>
                                <p className="text-sm text-red-300/80 font-medium">XAI Reasoning: {explainableAlerts[0].reason}</p>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                            {[
                                { label: 'Live Temp', val: `${latestData.temperature?.toFixed(1)}°C`, limit: '30°C' },
                                { label: 'Baseline', val: `${explainableAlerts[0].current_context.normal_temp}°C` },
                                { label: 'Live Gas', val: `${latestData.pm25 || latestData.mq_ppm || 0} PM`, limit: '120 PM' },
                                { label: 'Normal Avg', val: `${explainableAlerts[0].current_context.normal_gas} PM` }
                            ].map((s, idx) => (
                                <div key={idx} className="bg-black/40 p-3 rounded-xl border border-red-500/10">
                                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">{s.label}</p>
                                    <p className="text-sm font-mono text-red-200">{s.val}</p>
                                    {s.limit && <p className="text-[8px] text-red-500/60 mt-1 font-bold">LMT: {s.limit}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Temperature"
                    value={latestData.temperature?.toFixed(1)}
                    unit="deg C"
                    icon={Thermometer}
                    color="#06b6d4"
                    trendData={sensorData}
                    dataKey="temperature"
                />
                <StatCard
                    title="Humidity"
                    value={latestData.humidity?.toFixed(1)}
                    unit="RH %"
                    icon={Droplets}
                    color="#3b82f6"
                    trendData={sensorData}
                    dataKey="humidity"
                />
                <StatCard
                    title="Water pH"
                    value={latestData.ph?.toFixed(1)}
                    unit="pH"
                    icon={Waves}
                    color="#10b981"
                    trendData={sensorData}
                    dataKey="ph"
                />
                <StatCard
                    title="Motion Sensor"
                    value={latestData.motion_detected ? "DETECTED" : "SECURE"}
                    unit=""
                    icon={Eye}
                    color={latestData.motion_detected ? "#f59e0b" : "#64748b"}
                    trendData={sensorData}
                    dataKey="motion_detected"
                />
                <StatCard
                    title="Gas Sensor"
                    value={latestData.gas_level?.toFixed(1)}
                    unit="ppm"
                    icon={Activity}
                    color="#f87171"
                    trendData={sensorData}
                    dataKey="gas_level"
                />
                <StatCard
                    title="Rain Sensor"
                    value={latestData.rain_level > 5 ? "RAINING" : "DRY"}
                    unit={latestData.rain_level > 5 ? `${latestData.rain_level.toFixed(0)}%` : ""}
                    icon={CloudRain}
                    color={latestData.rain_level > 5 ? "#06b6d4" : "#64748b"}
                    trendData={sensorData}
                    dataKey="rain_level"
                />
            </div>

            {/* Middle Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <IndustrialPanel title="Advanced Signal Processing" icon={TrendingUp} badge="Kalman L2 Filter">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-slate-500 font-medium italic">Monitoring raw vs processed signal for telemetry integrity.</p>
                            <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} className="bg-slate-900 border border-slate-800 text-xs text-slate-300 p-2 rounded-lg outline-none cursor-pointer">
                                <option value="temperature">Temperature Delta</option>
                                <option value="gas_level">Gas Concentration</option>
                                <option value="humidity">Relative Humidity</option>
                                <option value="ph">Hydraulic pH</option>
                            </select>
                        </div>
                        <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sensorData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="timestamp" stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                                    <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey={selectedMetric} name="Live Sensor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" dot={false} />
                                    <Line type="monotone" dataKey={`${selectedMetric}_kalman`} name="Kalman Filter" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </IndustrialPanel>

                    <IndustrialPanel title="Historical Normal Comparison" icon={History} badge="7-Day Baseline">
                        <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sensorData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="timestamp" stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                                    <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                    <Legend verticalAlign="top" align="right" />
                                    <Line type="stepAfter" dataKey="temperature" name="Live (Today)" stroke="#10b981" strokeWidth={2} dot={false} />
                                    <Line type="monotone" data={[...Array(sensorData.length)].map(() => ({ val: historyComp.normal?.temp || 25 }))} dataKey="val" name="Historical Avg" stroke="#94a3b8" strokeDasharray="10 10" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </IndustrialPanel>
                </div>

                <div className="space-y-8">
                    <IndustrialPanel title="Restricted Area Activity" icon={Eye} color="#f59e0b" badge="Zone C-4">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner">
                                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Events Today</p>
                                    <p className="text-3xl font-mono text-amber-500 font-black">{motion.daily_count}</p>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner">
                                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Active State</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-xs font-bold text-white uppercase tracking-tighter">Armed</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl border border-dashed transition-all duration-500 ${(motion.unusual_activity || latestData.motion_detected) ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
                                <p className={`text-[10px] font-black uppercase flex items-center gap-2 ${(motion.unusual_activity || latestData.motion_detected) ? 'text-red-400' : 'text-slate-500'}`}>
                                    <Shield size={12} /> {(motion.unusual_activity || latestData.motion_detected) ? 'SECURITY BREACH (LIVE DETECTION)' : 'Authorized Access Window'}
                                </p>
                                <p className="text-[10px] text-slate-600 mt-1 font-mono">Last motion: {latestData.motion_detected ? "JUST NOW" : (motion.last_motion_time ? new Date(motion.last_motion_time).toLocaleTimeString() : 'None')}</p>
                            </div>
                        </div>
                    </IndustrialPanel>

                    <IndustrialPanel title="Hardware Diagnostic" icon={HeartPulse} color="#14b8a6">
                        <div className="space-y-3">
                            {['temp', 'hum', 'gas', 'ph', 'motion', 'rain'].map((node) => (
                                <div key={node} className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{node} Node</span>
                                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400`}>
                                        OK
                                    </span>
                                </div>
                            ))}
                        </div>
                    </IndustrialPanel>

                    <IndustrialPanel title="Safety Forecasting" icon={Zap} color="#3b82f6" badge="10M Predictive">
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">10m Temp Forecast</span>
                                <span className={`font-black uppercase flex items-center gap-1 ${predictions.temperature_trend === 'rising' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {predictions.predicted_temp_10m?.toFixed(1)}°C
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">10m Gas Forecast</span>
                                <span className={`font-black uppercase flex items-center gap-1 ${predictions.gas_trend === 'rising' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {predictions.predicted_gas_10m?.toFixed(0)} ppm
                                </span>
                            </div>
                        </div>
                    </IndustrialPanel>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="glass-panel overflow-hidden border-slate-800">
                <div className="p-6 bg-slate-900/40 flex justify-between items-center border-b border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                        <History size={18} className="text-emerald-500" /> Unit Security Audit Log
                    </h3>
                    <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                        <Download size={14} /> EXPORT CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10px]">
                        <thead className="bg-slate-900 text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">AI Reasoning</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {explainableAlerts.map(alert => (
                                <tr key={alert.id} className="hover:bg-slate-900/50">
                                    <td className="px-6 py-4 text-slate-400">{new Date(alert.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-slate-200">{alert.message}</td>
                                    <td className="px-6 py-4 text-slate-500 italic">{alert.reason}</td>
                                    <td className="px-6 py-4 text-right uppercase text-slate-600">Archived</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-[#030712] overflow-hidden font-outfit">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#030712] border-r border-slate-800 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:w-20 lg:hover:w-64 group flex flex-col items-center py-8 shadow-2xl`}>
                <div className="mb-12"><ShieldCheck className="text-emerald-500" size={28} /></div>
                <div className="flex-1 w-full space-y-4 px-4">
                    {[
                        { id: 'overview', icon: Activity, label: 'Safety Hub' },
                        { id: 'news', icon: Newspaper, label: 'Industry Intel' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeView === item.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600 hover:text-slate-300'}`}>
                            <item.icon size={24} className="min-w-[24px]" />
                            <span className="lg:opacity-0 lg:group-hover:opacity-100 font-bold whitespace-nowrap transition-opacity">{item.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onToggle} className="mt-auto mb-8 p-3 text-emerald-500 border border-emerald-500/30 rounded-xl w-[calc(100%-32px)] flex items-center gap-4 justify-center lg:justify-start px-4 hover:bg-emerald-500/10 active:scale-95 transition-all">
                    <ExternalLink size={24} className="min-w-[24px]" />
                    <span className="lg:opacity-0 lg:group-hover:opacity-100 font-bold whitespace-nowrap transition-opacity">PRO MODE</span>
                </button>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#030712]/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></button>
                        <div>
                            <h1 className="text-xl font-black text-white italic tracking-tighter">S4 <span className="text-emerald-500">INDUSTRIAL</span></h1>
                            <p className="text-[10px] text-slate-500 font-bold font-mono tracking-widest uppercase">Direct Node Link // V2.9</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {activeView === 'overview' && renderOverview()}
                    {activeView === 'news' && <div className="h-full"><NewsComponent /></div>}
                </main>
            </div>
        </div>
    );
};

export default LightDashboard;
