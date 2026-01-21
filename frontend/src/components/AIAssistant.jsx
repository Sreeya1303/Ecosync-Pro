import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';

const AIAssistant = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Systems Online. I am capable of analyzing device data, weather patterns, and global events. How can I assist?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false); // If true, speaks responses
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(null, transcript); // Auto-send on voice
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const speak = (text) => {
        if (!voiceMode) return;
        if (synthesisRef.current.speaking) synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.9;
        utterance.rate = 1.1;

        const voices = synthesisRef.current.getVoices();
        const roboticVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (roboticVoice) utterance.voice = roboticVoice;

        synthesisRef.current.speak(utterance);
    };

    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setVoiceMode(true); // Enable voice response if they use mic
            recognitionRef.current?.start();
        }
    };

    const handleSend = async (e, overrideInput) => {
        if (e) e.preventDefault();
        const userMsg = overrideInput || input;
        if (!userMsg.trim() || loading) return;

        // Navigation Command Check
        const lowerMsg = userMsg.toLowerCase();
        if (lowerMsg.includes('navigate to') || lowerMsg.includes('go to')) {
            if (lowerMsg.includes('dashboard')) navigate('/dashboard');
            else if (lowerMsg.includes('map')) navigate('/map');
            else if (lowerMsg.includes('settings')) navigate('/settings');

            setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: `Navigating...` }]);
            speak("Executing navigation protocol.");
            setInput('');
            return;
        }

        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            speak(data.reply);

        } catch (err) {
            const errText = "Warning: Neural Link Unstable. Connection Failed.";
            setMessages(prev => [...prev, { role: 'assistant', content: errText }]);
            speak("Connection failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[2000] font-mono">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-16 h-16 bg-cyan-900/80 hover:bg-cyan-600 rounded-full shadow-[0_0_30px_rgba(8,145,178,0.4)] border border-cyan-500/50 backdrop-blur-md transition-all hover:scale-110"
                >
                    <div className="absolute inset-0 rounded-full border border-cyan-400 opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                    <Bot size={32} className="text-cyan-200 group-hover:text-white transition-colors" />
                    {/* Status Dot */}
                    <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
                </button>
            )}

            {isOpen && (
                <div className="glass-panel w-80 md:w-96 rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 border-cyan-500/30">

                    {/* Header */}
                    <div className="p-4 bg-cyan-950/50 border-b border-cyan-500/20 flex justify-between items-center backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm tracking-wider">A.I. CORE</h3>
                                <p className="text-[10px] text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setVoiceMode(!voiceMode)}
                                className={`p-2 rounded hover:bg-white/10 ${voiceMode ? 'text-cyan-400' : 'text-slate-500'}`}
                                title="Toggle Speech Output"
                            >
                                {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/80 relative">
                        {/* Grid Background */}
                        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-3 relative z-10 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-cyan-900/20 border-cyan-500/30'}`}>
                                    {m.role === 'user' ? <User size={14} className="text-slate-300" /> : <Bot size={14} className="text-cyan-400" />}
                                </div>
                                <div className={`p-3 max-w-[80%] text-sm rounded ${m.role === 'user' ? 'bg-slate-700 text-white' : 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(8,145,178,0.1)]'}`}>
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center">
                                    <Loader2 size={14} className="text-cyan-400 animate-spin" />
                                </div>
                                <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 rounded">
                                    <span className="text-cyan-400 text-xs animate-pulse">PROCESSING NEURAL QUERY...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-950 border-t border-cyan-500/20 backdrop-blur-xl">
                        <form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={toggleListen}
                                className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700'}`}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-10 py-3 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                                    placeholder={isListening ? "Listening..." : "Execute command..."}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    disabled={isListening}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || (!input.trim() && !isListening)}
                                className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAssistant;
