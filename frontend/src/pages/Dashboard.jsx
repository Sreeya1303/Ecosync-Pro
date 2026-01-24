import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LightDashboard from './LightDashboard';
import ProDashboard from './ProDashboard';

const Dashboard = () => {
    const { userProfile } = useAuth();

    // Explicit Mode State (Default: Lite)
    const [isProMode, setIsProMode] = useState(false);

    // Sync with User Profile on Load
    useEffect(() => {
        if (userProfile?.plan === 'pro') {
            setIsProMode(true);
        }
    }, [userProfile]);

    const handleToggle = () => {
        if (userProfile?.plan !== 'pro' && !isProMode) {
            // If switching to PRO but not paid, show alert (or allow demo)
            alert("Enabling Pro Mode Demo. Upgrade for persistent data.");
        }
        setIsProMode(!isProMode);
    };

    return isProMode
        ? <ProDashboard onToggle={handleToggle} />
        : <LightDashboard onToggle={handleToggle} />;
};

export default Dashboard;
