import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { Activity, Droplets, Thermometer, Zap, Shield, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEsp32Stream } from '../hooks/useEsp32Stream';
import MapComponent from '../components/MapComponent';
import Analytics from './Analytics';

const ProDashboard = ({ onToggle }) => {
    const { userProfile } = useAuth();
    // Pro Mode relies on Supabase
    const { history: sensorData } = useEsp32Stream('pro');

    const [activeView, setActiveView] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Derived Data
    const latestData = useMemo(() => (sensorData && sensorData.length > 0) ? sensorData[sensorData.length - 1] : {}, [sensorData]);
    const temp = useMemo(() => latestData.temperature?.toFixed(1) || '--', [latestData]);
    const hum = useMemo(() => latestData.humidity?.toFixed(1) || '--', [latestData]);

    const StatCard = ({ title, value, unit, icon: Icon }) => (
        <div className="glass-panel p-6 border-l-4 border-l-amber-500 relative overflow-hidden group bg-slate-900/40">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={64} className="text-amber-500" /></div>
            <p className="text-amber-500/80 text-xs font-bold uppercase mb-2">{title}</p>
            <h3 className="text-4xl font-black text-white">{value}<span className="text-lg text-slate-500 ml-1">{unit}</span></h3>
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Core Temp" value={temp} unit="°C" icon={Thermometer} />
                <StatCard title="Humidity" value={hum} unit="%" icon={Droplets} />
                <StatCard title="AI Confidence" value="98.2" unit="%" icon={Shield} />
                <StatCard title="System Status" value="ONLINE" unit="" icon={Activity} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                <div className="glass-panel p-6 border-t-2 border-amber-500/50 flex flex-col bg-slate-900/40">
                    <h3 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                        <Zap size={18} /> Kalman Filter Analysis
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#451a03" />
                                <XAxis dataKey="timestamp" stroke="#d97706" tick={false} />
                                <YAxis stroke="#d97706" />
                                <Tooltip contentStyle={{ backgroundColor: '#2a1a08', borderColor: '#d97706' }} />
                                <Legend />
                                <Line type="monotone" dataKey="temperature" stroke="#78350f" strokeOpacity={0.5} name="Raw Sensor" dot={false} />
                                <Line type="monotone" dataKey="temperature" stroke="#fbbf24" strokeWidth={2} name="Kalman Filter" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-[#050302] overflow-hidden font-outfit">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 border-r border-amber-500/20 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:w-20 lg:hover:w-64 group flex flex-col items-center py-8`}>
                <div className="mb-12"><Shield className="text-amber-500" size={32} /></div>
                <div className="flex-1 w-full space-y-4 px-4">
                    {['overview', 'analytics', 'map', 'profile'].map(id => (
                        <button key={id} onClick={() => setActiveView(id)} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeView === id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-amber-200'}`}>
                            <Activity size={24} />
                            <span className="lg:opacity-0 lg:group-hover:opacity-100 font-bold uppercase transition-opacity">{id}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onToggle} className="mt-auto mb-8 mx-4 p-3 border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center">
                    <User size={18} /> <span className="lg:opacity-0 lg:group-hover:opacity-100 font-bold">SWITCH LITE</span>
                </button>
            </aside>

            <div className="flex-1 flex flex-col h-full relative">
                <header className="flex justify-between items-center p-6 border-b border-amber-500/20 bg-black/80 backdrop-blur-md">
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">S4 PRO // AI CORE</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-1 bg-amber-500/10 border border-amber-500/40 rounded-full text-amber-400 text-xs font-bold">
                            <CheckCircle size={14} /> SYSTEM OPTIMAL
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-[#050302] to-[#050302]">
                    {activeView === 'overview' && renderOverview()}
                    {activeView === 'analytics' && <Analytics sensorData={sensorData} isProMode={true} predictions={[]} />}
                    {activeView === 'map' && <div className="h-full rounded-xl border border-amber-500/30 overflow-hidden"><MapComponent isPro={true} /></div>}
                </main>
            </div>
        </div>
    );
};

export default ProDashboard;
