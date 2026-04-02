"use client";
import React, { createContext, useState, useContext } from "react";

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState(null);
    const [currentForaneId, setCurrentForaneId] = useState(null);
    const [currentParishId, setCurrentParishId] = useState(null);
    const [currentSubstationId, setCurrentSubstationId] = useState(null);

    const logout = () => {
        setIsLoggedIn(false);
        setRole(null);
        setCurrentForaneId(null);
        setCurrentParishId(null);
        setCurrentSubstationId(null);
    };

    return (
        <RoleContext.Provider value={{
            isLoggedIn, setIsLoggedIn,
            role, setRole,
            currentForaneId, setCurrentForaneId,
            currentParishId, setCurrentParishId,
            currentSubstationId, setCurrentSubstationId,
            logout
        }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);