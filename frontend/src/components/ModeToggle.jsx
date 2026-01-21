import React from 'react';
import { Zap, Cpu } from 'lucide-react';

const ModeToggle = ({ isProMode, onToggle }) => {
    return (
        <div
            onClick={onToggle}
            className={`
        relative w-48 h-10 rounded-full cursor-pointer transition-all duration-500 shadow-lg border
        ${isProMode
                    ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : 'bg-emerald-900/20 border-emerald-500/30'}
      `}
        >
            {/* Sliding Pill */}
            <div
                className={`
                absolute top-1 bottom-1 w-24 rounded-full transition-all duration-500 flex items-center justify-center gap-2 text-xs font-black tracking-wider
                ${isProMode
                        ? 'left-[calc(100%-6.25rem)] bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                        : 'left-1 bg-emerald-500 text-emerald-950'}
            `}
            >
                {isProMode ? <Cpu size={14} /> : <Zap size={14} />}
                {isProMode ? 'PRO MODE' : 'LITE MODE'}
            </div>

            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-6 text-[10px] font-bold text-slate-500 pointer-events-none">
                <span className={`${!isProMode ? 'opacity-0' : 'opacity-100'} transition-opacity`}>LITE</span>
                <span className={`${isProMode ? 'opacity-0' : 'opacity-100'} transition-opacity`}>PRO</span>
            </div>
        </div>
    );
};

export default ModeToggle;
