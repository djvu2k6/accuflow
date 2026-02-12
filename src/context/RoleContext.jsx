import React, { createContext, useState, useContext } from "react";

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false); // New state
    const [role, setRole] = useState(null);
    const [currentForaneId, setCurrentForaneId] = useState(null);
    const [currentParishId, setCurrentParishId] = useState(null);

    return (
        <RoleContext.Provider value={{
            isLoggedIn, setIsLoggedIn,
            role, setRole,
            currentForaneId, setCurrentForaneId,
            currentParishId, setCurrentParishId
        }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);