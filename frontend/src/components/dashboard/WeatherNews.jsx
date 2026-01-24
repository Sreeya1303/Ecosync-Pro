import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';

const MOCK_NEWS = [
    {
        id: 1,
        title: "Global Heatwave: Temperatures Soar Across Continents",
        source: "EcoWatch",
        summary: "Record-breaking temperatures are being recorded in Europe and Asia, prompting urgent climate warnings.",
        time: "2h ago"
    },
    {
        id: 2,
        title: "New AI Model Predicts Air Quality with 99% Accuracy",
        source: "TechGreen",
        summary: "Machine learning algorithms are revolutionizing how we forecast particulate matter dispersion in urban areas.",
        time: "4h ago"
    },
    {
        id: 3,
        title: "Category 5 Storm Updates: Coastal Regions on High Alert",
        source: "WeatherDaily",
        summary: "Emergency protocols activated as superstorm approaches. Residents advised to seek shelter.",
        time: "6h ago"
    },
    {
        id: 4,
        title: "Amazon Rainforest Carbon Sink Capacity Decreasing",
        source: "NatureScience",
        summary: "New study reveals concerning trends in the Amazon's ability to absorb CO2 emissions.",
        time: "12h ago"
    }
];

const WeatherNews = () => {
    const [news, setNews] = useState([]);

    useEffect(() => {
        // In a real app, fetch from NewsAPI here.
        // Simulating network delay
        setTimeout(() => {
            setNews(MOCK_NEWS);
        }, 1000);
    }, []);

    return (
        <div className="bg-emerald-900/40 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Newspaper className="text-emerald-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Live Eco-News</h2>
                </div>
                <span className="text-xs text-emerald-400/60 bg-emerald-950/50 px-2 py-1 rounded-full animate-pulse">Running</span>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar flex-1">
                {news.map((item) => (
                    <div key={item.id} className="group p-4 bg-black/20 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/10 hover:border-emerald-500/40 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-mono text-emerald-400">{item.source}</span>
                            <span className="text-xs text-emerald-600">{item.time}</span>
                        </div>
                        <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">{item.title}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2">{item.summary}</p>
                        <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={14} className="text-emerald-400" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherNews;
