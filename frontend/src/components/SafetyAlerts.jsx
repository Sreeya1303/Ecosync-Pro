import React from 'react';
import { ShieldAlert, MapPin, ExternalLink, Calendar, ChevronRight, Wind, Thermometer, CloudLightning, Sun } from 'lucide-react';

const SafetyAlerts = () => {
    const alertsData = [
        {
            id: 1,
            location: "North Delhi Urban Zone",
            hazard: "Severe Heat & Smog",
            level: "CRITICAL",
            color: "rose",
            recommendation: "Stay indoors, set AC to recirculate mode, hydrate frequently.",
            time: "Active: 06:00 AM - 08:00 PM"
        },
        {
            id: 2,
            location: "Bengaluru East Tech Corridor",
            hazard: "UV Exposure Peak",
            level: "HIGH",
            color: "orange",
            recommendation: "Avoid outdoors between 12-3 PM. Use SPF 50+ protection.",
            time: "Scheduled: 11:30 AM - 03:30 PM"
        },
        {
            id: 3,
            location: "Greater Noida Industrial Area",
            hazard: "Chemical Particulate Surge",
            level: "EXTREME",
            color: "purple",
            recommendation: "N95/N99 respiratory protection required if venturing outside.",
            time: "Continuous Monitor Active"
        },
        {
            id: 4,
            location: "Chennai Coastal Zone",
            hazard: "High Humidity & Ozone",
            level: "MODERATE",
            color: "blue",
            recommendation: "Limit strenuous activities. Risk of heat exhaustion.",
            time: "Ongoing: Seasonal Trend"
        }
    ];

    return (
        <main className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-rose-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-rose-200">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Safety Protocol Center</h2>
                        <p className="text-slate-500 font-medium">Environmental risk monitoring and action plans</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Health Monitor */}
                <section className="lg:col-span-2 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                        Live Incident Feed
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                        {alertsData.map((alert) => (
                            <div key={alert.id} className="glass-depth group overflow-hidden flex flex-col md:flex-row !rounded-[32px]">
                                <div className={`md:w-3 w-full bg-${alert.color}-500 transition-all group-hover:md:w-4`}></div>
                                <div className="p-8 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-4 py-1.5 bg-${alert.color}-50 rounded-full text-${alert.color}-600 text-[10px] font-black uppercase tracking-widest border border-${alert.color}-100`}>
                                                {alert.level} RISK
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {alert.time}
                                            </span>
                                        </div>
                                        <button className="text-slate-400 hover:text-blue-500 transition-colors">
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{alert.location}</h4>
                                            <p className="text-rose-600 font-bold uppercase text-sm tracking-widest mt-1">{alert.hazard}</p>
                                        </div>
                                    </div>

                                    <p className="text-slate-500 bg-slate-50 p-6 rounded-3xl text-sm font-medium leading-relaxed border border-slate-100">
                                        <strong className="text-slate-900 block mb-1">Recommended Action:</strong>
                                        {alert.recommendation}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Safety Sidebar */}
                <aside className="space-y-8">
                    <div className="panel-frame p-8 !rounded-[40px] bg-slate-900 text-white border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8 px-1">Safety Conditions</h4>
                        <div className="space-y-6">
                            {[
                                { label: "Air Quality", icon: <Wind size={20} />, level: "Dangerous", color: "text-rose-400" },
                                { label: "Solar Radiation", icon: <Sun size={20} />, level: "Extreme", color: "text-orange-400" },
                                { label: "Surface Temp", icon: <Thermometer size={20} />, level: "High", color: "text-amber-400" },
                                { label: "Storm Risk", icon: <CloudLightning size={20} />, level: "Zero", color: "text-emerald-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-4 -m-4 rounded-3xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-2xl text-white/60">
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.level}</span>
                                        <ChevronRight size={14} className="text-white/20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel-frame p-8 !rounded-[40px] bg-white border border-slate-100 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Health Impact Matrix</h4>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                <div className="w-1 h-3 bg-blue-500/30 rounded-full"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className={`h-8 rounded-lg transition-all duration-700 ${i % 5 === 0 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' :
                                    i % 3 === 0 ? 'bg-orange-400' : 'bg-slate-100'
                                    }`}></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>RESPIRATORY STRESS</span>
                                <span className="text-rose-500">CRITICAL</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>UV RADIANCE</span>
                                <span className="text-orange-500">ELEVATED</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 p-10 rounded-[40px] text-white flex flex-col items-center text-center shadow-2xl shadow-blue-200">
                        <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mb-6">
                            <ShieldAlert size={40} />
                        </div>
                        <h4 className="text-2xl font-bold mb-4">AI Safety Engine</h4>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed mb-8">
                            Your personalized safety radius is set to 15km. Alerts are generated based on dynamic sensor correlation.
                        </p>
                        <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                            Configure Radius
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default SafetyAlerts;
