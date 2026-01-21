import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const plan = localStorage.getItem('plan');

        if (token) {
            // Reconstruct user session
            setCurrentUser({ access_token: token, role, plan });
        }
        setLoading(false);
    }, []);

    const loginCustom = (userData) => {
        setCurrentUser(userData);
        localStorage.setItem('token', userData.access_token);
        if (userData.role) localStorage.setItem('role', userData.role);
        if (userData.plan) localStorage.setItem('plan', userData.plan);
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('plan');
    };

    const value = {
        currentUser,
        loading,
        loginCustom,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
