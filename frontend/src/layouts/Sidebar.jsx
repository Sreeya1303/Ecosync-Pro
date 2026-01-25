import React from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Map, Server, Zap, LogOut, TrendingUp, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || localStorage.getItem('dashboardMode') || 'lite';
    const isPro = mode === 'pro';

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Activity, label: 'Analysis', path: '/analysis' },
        { icon: Map, label: 'Global Map', path: '/global' }, // [NEW]
        { icon: BarChart3, label: 'Analytics', path: '/analytics' }, // [NEW]
    ];

    if (isPro) {
        navItems.splice(1, 0, { icon: TrendingUp, label: 'Analytics', path: '/analytics' });
    }

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="fixed left-4 top-4 bottom-4 w-20 flex flex-col items-center py-8 glass-panel rounded-[2.5rem] border border-white/10 z-50 transition-all hover:w-24 group-hover:duration-300">
            {/* Brand Icon */}
            <div className="mb-12 p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center transform hover:scale-110 transition-transform cursor-pointer" onClick={() => navigate('/')}>
                <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            {/* Vertical Text Brand - Hidden on small, shown on hover/large maybe? Simplified to just Icon for floating look */}

            {/* Navigation */}
            <nav className="flex-1 w-full flex flex-col items-center gap-8">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              p-3 rounded-2xl transition-all duration-300 relative group/icon
              ${isActive
                                ? 'bg-white/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 hover:scale-105'}
            `}
                    >
                        <item.icon className="w-6 h-6" strokeWidth={1.5} />

                        {/* Floating Tooltip */}
                        <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900/90 backdrop-blur text-white text-xs font-bold rounded-xl opacity-0 group-hover/icon:opacity-100 transition-all whitespace-nowrap border border-white/10 pointer-events-none translate-x-2 group-hover/icon:translate-x-0 shadow-xl">
                            {item.label}
                        </div>
                    </NavLink>
                ))}
            </nav>

            {/* Logout / Status */}
            <div className="mt-auto flex flex-col items-center gap-6">
                <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 transition-colors p-3 hover:bg-red-500/10 rounded-xl relative group/logout"
                >
                    <LogOut size={20} />
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-2 bg-red-900/90 text-red-200 text-xs font-bold rounded-xl opacity-0 group-hover/logout:opacity-100 transition-all whitespace-nowrap border border-red-500/20 pointer-events-none translate-x-2 group-hover/logout:translate-x-0">
                        Disconnect
                    </div>
                </button>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
            </div>
        </div>
    );
};

export default Sidebar;
