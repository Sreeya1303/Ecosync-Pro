import React from 'react';
import { Sprout, Microscope, Leaf } from 'lucide-react';

const ModeToggle = ({ isProMode, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            className={`
        relative w-48 h-10 rounded-full cursor-pointer transition-all duration-500 shadow-lg border
        ${isProMode
                    ? 'bg-[#022c22] border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/50 border-white/10'}
      `}
        >
            {/* Sliding Pill */}
            <div
                className={`
                absolute top-1 bottom-1 w-24 rounded-full transition-all duration-500 flex items-center justify-center gap-2 text-xs font-black tracking-wider
                ${isProMode
                        ? 'left-[calc(100%-6.25rem)] bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                        : 'left-1 bg-slate-700 text-slate-200'}
            `}
            >
                {isProMode ? <Microscope size={14} /> : <Leaf size={14} />}
                {isProMode ? 'PRO MODE' : 'LITE MODE'}
            </div>

            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-6 text-[10px] font-bold text-slate-500 pointer-events-none font-mono tracking-widest">
                <span className={`${!isProMode ? 'opacity-0' : 'opacity-100'} transition-opacity`}>ECO</span>
                <span className={`${isProMode ? 'opacity-0' : 'opacity-100'} transition-opacity`}>BIO-LAB</span>
            </div>
        </div>
    );
};

export default ModeToggle;
