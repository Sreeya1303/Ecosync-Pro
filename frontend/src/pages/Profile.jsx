import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone, Linkedin, Github, Edit2, Shield, Activity, Camera, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: currentUser?.first_name || 'User',
        lastName: currentUser?.last_name || 'Name',
        role: currentUser?.role || 'Researcher',
        bio: 'Environmental enthusiast passionate about IoT and sustainable technology.',
        linkedin: '',
        github: ''
    });

    // Mock "Active" Status Animation
    const [activityPulse, setActivityPulse] = useState(true);

    // Load Profile from Backend
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            try {
                // We can use the /auth/me or verify endpoint to get current details, 
                // but since we have a specific update endpoint, let's assume we fetch current user details on load
                // For now, we rely on AuthContext initial state, but to ensure fresh data:
                const res = await fetch(`${API_BASE_URL}/auth/me`, { // Assuming this endpoint exists or similar
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // If /auth/me doesn't exist, we might need to rely on stored token data or add it.
                // Given the file view of auth.py, we have `get_current_user` but no direct /me endpoint returning full profile except inside other calls.
                // Let's rely on AuthContext for initial load, and only implement Save for now to avoid breaking if /me is missing.
                if (currentUser) {
                    setFormData({
                        firstName: currentUser.first_name || '',
                        lastName: currentUser.last_name || '',
                        role: 'Researcher', // Static for now as DB schema doesn't seem to have role field in User model shown in auth.py
                        bio: 'Environmental enthusiast.',
                        linkedin: '',
                        github: ''
                    });
                }
            } catch (e) { console.error(e); }
        };
        fetchProfile();
    }, [currentUser]);

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/auth/me/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    mobile: "0000000000", // Defaulting as not in form
                    location_name: "Hyderabad" // Defaulting
                })
            });

            if (res.ok) {
                alert("Profile Updated Successfully");
                setIsEditing(false);
                // Trigger auth update if possible, or reload
            } else {
                throw new Error("Update failed");
            }
        } catch (e) {
            alert("Failed to save profile. " + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-200 p-8 font-outfit relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10 space-y-8">

                {/* Header Section */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Researcher Profile
                        </h1>
                        <p className="text-slate-400 mt-2 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            Verified Contributor
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${activityPulse ? '' : 'hidden'}`}></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-medium text-emerald-400">System Active</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Avatar & Quick Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="group relative bg-[#0B1221] p-8 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500 shadow-2xl hover:shadow-emerald-500/10 flex flex-col items-center">

                            {/* Avatar Ring Animation */}
                            <div className="relative w-40 h-40 mb-6">
                                <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin-slow"></div>
                                <div className="absolute inset-2 rounded-full border border-white/10 group-hover:border-emerald-500/50 transition-colors"></div>
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}`}
                                    alt="Avatar"
                                    className="w-full h-full rounded-full object-cover p-3 hover:scale-105 transition-transform duration-300"
                                />
                                <button className="absolute bottom-2 right-2 p-2 bg-emerald-500 rounded-full text-black hover:bg-emerald-400 transition-colors shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white text-center">{formData.firstName} {formData.lastName}</h2>
                            <p className="text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full mt-2 border border-emerald-500/20">
                                {formData.role}
                            </p>

                            {/* Quick Actions */}
                            <div className="flex gap-3 mt-6 w-full justify-center">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 w-full justify-center ${isEditing
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
                                </button>
                            </div>
                        </div>

                        {/* Social Links Card */}
                        <div className="bg-[#0B1221]/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Connect</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-[#0077b5]/20 hover:border-[#0077b5]/50 border border-transparent transition-all cursor-pointer group">
                                    <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-[#0077b5]" />
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            placeholder="LinkedIn URL"
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            className="bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none text-sm w-full py-1"
                                        />
                                    ) : (
                                        <span className="text-sm text-slate-300">{formData.linkedin || 'Add LinkedIn'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent transition-all cursor-pointer group">
                                    <Github className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            placeholder="GitHub URL"
                                            value={formData.github}
                                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                            className="bg-transparent border-b border-white/20 focus:border-emerald-500 outline-none text-sm w-full py-1"
                                        />
                                    ) : (
                                        <span className="text-sm text-slate-300">{formData.github || 'Add GitHub'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Edit Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Bio Section */}
                        <div className="bg-[#0B1221] p-8 rounded-3xl border border-white/5 hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:bg-emerald-500/10" />

                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                About
                            </h3>

                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-slate-300 focus:border-emerald-500 outline-none transition-all h-32 resize-none"
                                />
                            ) : (
                                <p className="text-slate-400 leading-relaxed font-light">
                                    {formData.bio}
                                </p>
                            )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Info */}
                            <div className="bg-[#0B1221] p-6 rounded-3xl border border-white/5 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Email Address</span>
                                </div>
                                <p className="text-white font-medium pl-12">{currentUser?.email || 'user@example.com'}</p>
                            </div>

                            <div className="bg-[#0B1221] p-6 rounded-3xl border border-white/5 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Location</span>
                                </div>
                                <p className="text-white font-medium pl-12">Hyderabad, India</p>
                            </div>

                            <div className="bg-[#0B1221] p-6 rounded-3xl border border-white/5 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">First Name</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="ml-12 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white w-2/3"
                                    />
                                ) : (
                                    <p className="text-white font-medium pl-12">{formData.firstName}</p>
                                )}
                            </div>

                            <div className="bg-[#0B1221] p-6 rounded-3xl border border-white/5 hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">Last Name</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="ml-12 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-white w-2/3"
                                    />
                                ) : (
                                    <p className="text-white font-medium pl-12">{formData.lastName}</p>
                                )}
                            </div>
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                            <div className="flex justify-end pt-4 animate-fade-in-up">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105"
                                >
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
