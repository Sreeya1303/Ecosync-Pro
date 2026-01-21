import React from 'react';
import { Zap, LayoutDashboard } from 'lucide-react';
import { THEME } from './shared/Common';

const SidebarModeSwitch = ({ mode, setMode }) => {
    return (
        <div className="flex justify-center mb-8">
            <div className={`p-1 rounded-xl border ${THEME.colors.border} flex relative backdrop-blur-md shadow-lg bg-[#0b0e11]/80`}>
                <button
                    onClick={() => setMode('lite')}
                    className={`
                        px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300 relative z-10 w-32 justify-center
                        ${mode === 'lite' ? 'text-[#0b0e11]' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <Zap size={16} className={mode === 'lite' ? 'text-[#0b0e11]' : 'text-cyan-400'} />
                    Lite
                </button>
                <button
                    onClick={() => setMode('pro')}
                    className={`
                        px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300 relative z-10 w-32 justify-center
                        ${mode === 'pro' ? 'text-[#0b0e11]' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <LayoutDashboard size={16} className={mode === 'pro' ? 'text-[#0b0e11]' : 'text-purple-400'} />
                    Pro
                </button>

                {/* Sliding Pill */}
                <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-out border border-white/5 shadow-md`}
                    style={{
                        transform: mode === 'lite' ? 'translateX(0)' : 'translateX(100%)',
                        background: mode === 'lite'
                            ? '#FCD535' // Binance Yellow for Lite
                            : '#8b5cf6' // Purple for Pro
                    }}
                />
            </div>
        </div>
    );
};

export default SidebarModeSwitch;
