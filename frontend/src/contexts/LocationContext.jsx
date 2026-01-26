import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
    // Default to a generic location or user's preference
    const [activeLocation, setActiveLocation] = useState({
        name: 'HYDERABAD',
        lat: 17.3850,
        lon: 78.4867,
        temp: 32.5,
        humidity: 45
    });

    const updateLocation = (newLoc) => {
        console.log("Global Location Updated:", newLoc);
        setActiveLocation(newLoc);
    };

    return (
        <LocationContext.Provider value={{ activeLocation, updateLocation }}>
            {children}
        </LocationContext.Provider>
    );
};
