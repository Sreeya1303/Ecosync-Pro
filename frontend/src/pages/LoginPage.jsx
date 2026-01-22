import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, MapPin, Mail, ArrowRight, ShieldCheck, Navigation, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';

const LoginPage = () => {
    const navigate = useNavigate();
    const { loginCustom } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Login State
    const [email, setEmail] = useState('gitams4@gmail.com');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Drone State
    const [droneState, setDroneState] = useState('idle'); // idle, watching, privacy, scanning, success, error
    const droneRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Registration State
    const [isRegistering, setIsRegistering] = useState(false);

    // Location State
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [manualLocation, setManualLocation] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);

    const API_URL = API_BASE_URL;
    const [plan, setPlan] = useState('lite');

    // Mouse Tracking for Drone Eye
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (droneRef.current && droneState !== 'privacy') {
                const rect = droneRef.current.getBoundingClientRect();
                // Calculate eye movement within the socket (limit to +/- 10px)
                const x = Math.max(-10, Math.min(10, (e.clientX - rect.left - rect.width / 2) / 10));
                const y = Math.max(-10, Math.min(10, (e.clientY - rect.top - rect.height / 2) / 10));
                setMousePos({ x, y });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [droneState]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDroneState('scanning'); // Trigger scan animation
        setErrorMessage('');

        try {
            if (isRegistering) {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        plan: plan
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.detail || 'Registration failed');
                }

                setIsRegistering(false);
                setLoading(false);
                setDroneState('idle');
                alert("Registration Successful! Please Login.");
                return;
            }

            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${API_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();
            const finalData = { ...data, plan: data.plan || plan };
            localStorage.setItem('plan', finalData.plan);
            loginCustom(finalData);

            setLoading(false);
            setDroneState('success');
            setTimeout(() => {
                setShowLocationPrompt(true);
            }, 800);
        } catch (err) {
            console.error("Login Error:", err);
            setErrorMessage(err.message);
            setLoading(false);
            setDroneState('error');
            setTimeout(() => setDroneState('idle'), 2000);
        }
    };

    const registerLocation = async (lat, lon, name) => {
        try {
            setLocationLoading(true);
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    deviceName: name,
                    connectorType: "public_api",
                    location: { lat, lon }
                })
            });
            navigate('/dashboard');
        } catch (e) {
            console.error("Failed to register location", e);
            alert("Could not save location preference. Proceeding anyway.");
            navigate('/dashboard');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleAutoLocate = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                registerLocation(pos.coords.latitude, pos.coords.longitude, "My Location");
            },
            (err) => {
                console.error(err);
                alert("Location access denied or unavailable.");
                setLocationLoading(false);
            }
        );
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualLocation) return;
        setLocationLoading(true);
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${manualLocation}&count=1&language=en&format=json`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const { latitude, longitude, name, country } = data.results[0];
                await registerLocation(latitude, longitude, `${name}, ${country}`);
            } else {
                alert("City not found. Please try again.");
                setLocationLoading(false);
            }
        } catch (e) {
            alert("Geocoding failed. Check connection.");
            setLocationLoading(false);
        }
    };

    // --- Interactive Components ---

    const SecurityDrone = () => (
        <div ref={droneRef} className={`relative w-40 h-40 mx-auto mb-6 transition-all duration-500`}>
            <div className={`absolute inset-0 bg-cyan-500/10 rounded-full blur-[40px] transition-all duration-300 ${droneState === 'privacy' ? 'opacity-0 scale-50' : 'opacity-100 scale-110'}`}></div>

            {/* Drone SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                {/* Outer Chassis */}
                <circle cx="50" cy="50" r="45" fill="#020617" stroke="#0f172a" strokeWidth="2" />
                <circle cx="50" cy="50" r="45" fill="url(#grad1)" opacity="0.5" />

                {/* Rotating Ring (Scanning) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="10,20" className={droneState === 'scanning' ? 'animate-[spin_1s_linear_infinite]' : 'opacity-20'} />

                {/* Mechanical Details */}
                <path d="M 50 5 L 50 15 M 50 85 L 50 95 M 5 50 L 15 50 M 85 50 L 95 50" stroke="#1e293b" strokeWidth="2" />

                {/* The Eye / Lens Group */}
                <g style={{
                    transform: droneState === 'privacy' ? 'translate(0, 0)' : `translate(${mousePos.x}px, ${mousePos.y}px)`,
                    transition: 'transform 0.1s ease-out'
                }}>
                    {/* Sclera */}
                    <circle cx="50" cy="50" r="25" fill="#0f172a" stroke="#334155" strokeWidth="1" />

                    {/* Iris */}
                    <circle cx="50" cy="50" r={droneState === 'privacy' ? 0 : 15}
                        fill={droneState === 'error' ? '#ef4444' : (droneState === 'success' ? '#10b981' : '#06b6d4')}
                        className="transition-all duration-300"
                    />

                    {/* Pupil/Glint */}
                    <circle cx="54" cy="46" r="3" fill="white" opacity={droneState === 'privacy' ? 0 : 0.8} />

                    {/* Eyelids (Privacy Mode) */}
                    <path d="M 20 50 Q 50 20 80 50" fill="#020617" stroke="#06b6d4" strokeWidth="1" className={`transition-all duration-300 ${droneState === 'privacy' ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`} />
                    <path d="M 20 50 Q 50 80 80 50" fill="#020617" stroke="#06b6d4" strokeWidth="1" className={`transition-all duration-300 ${droneState === 'privacy' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} />
                </g>

                <defs>
                    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: 'rgb(15,23,42)', stopOpacity: 0 }} />
                        <stop offset="100%" style={{ stopColor: 'rgb(2,6,23)', stopOpacity: 1 }} />
                    </radialGradient>
                </defs>
            </svg>

            {/* Status Text (Holographic) */}
            <div className="absolute -bottom-4 left-0 right-0 text-center">
                <span className={`text-[9px] font-bold tracking-[0.2em] px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm border ${droneState === 'error' ? 'text-red-400 border-red-500/30' :
                        (droneState === 'success' ? 'text-green-400 border-green-500/30' :
                            (droneState === 'scanning' ? 'text-yellow-400 border-yellow-500/30 animate-pulse' :
                                (droneState === 'privacy' ? 'text-slate-500 border-slate-700' : 'text-cyan-400 border-cyan-500/30')))
                    }`}>
                    {droneState === 'idle' && 'SYSTEM READY'}
                    {droneState === 'watching' && 'TRACKING TARGET'}
                    {droneState === 'privacy' && 'INPUT MASKED'}
                    {droneState === 'scanning' && 'VERIFYING...'}
                    {droneState === 'success' && 'ACCESS GRANTED'}
                    {droneState === 'error' && 'ACCESS DENIED'}
                </span>
            </div>
        </div>
    );

    if (showLocationPrompt) {
        return (
            <div className="h-screen w-full flex items-center justify-center relative overflow-hidden font-outfit text-slate-200 cursor-crosshair">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[5px]"></div>

                {/* Global Cursor Glow (Targeting System) */}
                <div
                    className="fixed w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out z-0 mix-blend-screen"
                    style={{ left: mousePos.x * 10 + window.innerWidth / 2, top: mousePos.y * 10 + window.innerHeight / 2 }}
                ></div>

                <div className="relative z-10 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
                    <div className="glass-depth p-10 border border-white/10 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden group">

                        <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-cyan-500/30">
                            <Navigation className="text-cyan-400 w-10 h-10 animate-[bounce_3s_infinite]" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">INITIALIZE DOMAIN</h2>
                        <p className="text-slate-400 text-sm mb-10 font-light leading-relaxed">Establish your operational monitoring coordinates.</p>

                        <div className="space-y-6 relative z-10">
                            <button
                                onClick={handleAutoLocate}
                                disabled={locationLoading}
                                className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1"
                            >
                                {locationLoading ? 'CALIBRATING...' : (
                                    <>
                                        <MapPin size={20} />
                                        AUTO-DETECT LOCATION
                                    </>
                                )}
                            </button>

                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-6 text-slate-500 text-[10px] font-bold tracking-widest uppercase">Manual Override</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <form onSubmit={handleManualSubmit} className="flex gap-3">
                                <input
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-cyan-500 focus:bg-white/10 transition-all font-light placeholder-slate-600 focus:placeholder-cyan-500/50"
                                    placeholder="City Name"
                                    value={manualLocation}
                                    onChange={(e) => setManualLocation(e.target.value)}
                                    disabled={locationLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={locationLoading || !manualLocation}
                                    className="bg-white/10 hover:bg-white/20 text-white px-6 rounded-2xl font-black transition-all border border-white/10 hover:text-cyan-400 hover:border-cyan-500/50"
                                >
                                    GO
                                </button>
                            </form>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-[10px] font-bold tracking-widest text-slate-500 hover:text-cyan-400 mt-6 uppercase transition-colors"
                            >
                                Skip Environment Config -&gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden font-outfit text-slate-200">
            {/* Global Cursor Glow (Simulated) */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>

            <div className="relative z-10 w-full max-w-md p-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
                <div className="glass-depth p-10 border border-white/10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">

                    {/* The Security Drone */}
                    <SecurityDrone />

                    <div className="text-center mb-6 relative z-10">
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">
                            {isRegistering ? 'NEW NODE' : 'S4 AUTH'}
                        </h1>
                        <p className="text-cyan-400/70 text-[10px] font-bold tracking-[0.3em] uppercase text-glow">
                            {isRegistering ? 'INITIALIZE CORE' : 'SECURE COMMAND PROTOCOL'}
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center font-medium animate-pulse">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-5">
                            <div className="group">
                                <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1 tracking-widest uppercase group-focus-within:text-cyan-400 transition-colors">
                                    Identity Hash (Email)
                                </label>
                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        className="block w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] focus:ring-0 focus:border-cyan-500 placeholder-slate-600 text-white transition-all outline-none font-light shadow-inner"
                                        placeholder="operator@system.io"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setDroneState('watching')}
                                        onBlur={() => setDroneState('idle')}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1 tracking-widest uppercase group-focus-within:text-cyan-400 transition-colors">
                                    Access Key (Passcode)
                                </label>
                                <div className="relative transition-transform duration-300 group-focus-within:scale-[1.02]">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type={(showPassword || droneState === 'privacy') ? "password" : "password"}
                                        className="block w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] focus:ring-0 focus:border-cyan-500 placeholder-slate-600 text-white transition-all outline-none font-light shadow-inner"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setDroneState('privacy')}
                                        onBlur={() => setDroneState('idle')}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Plan Selection UI */}
                        <div className="pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div onClick={() => setPlan('lite')} className={`cursor-pointer p-4 rounded-[1.25rem] border transition-all duration-300 ${plan === 'lite' ? 'bg-emerald-500/10 border-emerald-500 shadow-md' : 'bg-white/5 border-white/10 opacity-50 hover:opacity-100'}`}>
                                    <div className="text-[10px] font-black text-center text-emerald-400">LITE</div>
                                </div>
                                <div onClick={() => setPlan('pro')} className={`cursor-pointer p-4 rounded-[1.25rem] border transition-all duration-300 ${plan === 'pro' ? 'bg-cyan-500/10 border-cyan-500 shadow-md' : 'bg-white/5 border-white/10 opacity-50 hover:opacity-100'}`}>
                                    <div className="text-[10px] font-black text-center text-cyan-400">PRO</div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-5 px-6 rounded-[1.5rem] transition-all duration-500 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_15px_30px_rgba(6,182,212,0.3)] border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1"
                        >
                            <div className="flex items-center justify-center gap-3">
                                {loading ? 'SCANNING BIOMETRICS...' : (isRegistering ? 'ESTABLISH LINK' : 'INITIALIZE SESSION')}
                                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="text-[10px] font-bold tracking-widest text-slate-500 hover:text-cyan-400 uppercase transition-colors"
                            >
                                {isRegistering ? 'Back to Identity Verification' : "New node? Create Link"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
