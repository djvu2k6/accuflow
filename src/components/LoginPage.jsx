import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const LoginPage = () => {
    const { setIsLoggedIn, setRole, setCurrentForaneId, setCurrentParishId } = useRole();

    // States to hold dynamic data from DB
    const [foranes, setForanes] = useState([]);
    const [parishes, setParishes] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [view, setView] = useState("select-role"); // 'select-role' or 'select-entity'

    // Fetch lists from Supabase
    useEffect(() => {
        const loadData = async () => {
            const { data: fData } = await supabase.from('foranes').select('id, name');
            const { data: pData } = await supabase.from('parishes').select('id, name');
            setForanes(fData || []);
            setParishes(pData || []);
        };
        loadData();
    }, []);

    const handleFinalLogin = (role) => {
        if (role !== 'arch' && !selectedId) return alert("Please select a unit!");

        setRole(role);
        if (role === 'forane') setCurrentForaneId(selectedId);
        if (role === 'parish') setCurrentParishId(selectedId);

        setIsLoggedIn(true);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-3xl border border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-blue-900 tracking-tight">AccuFlow</h1>
                    <p className="text-gray-500 font-medium mt-1">Latin Arch Diocese Dashboard</p>
                </div>

                <div className="space-y-6">
                    {/* USER SELECTION SECTION */}
                    <div className="space-y-4">
                        <button
                            onClick={() => { setRole('arch'); handleFinalLogin('arch'); }}
                            className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg"
                        >
                            Enter as Archdiocese Admin
                        </button>

                        <hr className="border-gray-100" />

                        {/* Dynamic Forane Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Forane Portal</label>
                            <select
                                className="w-full p-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => setSelectedId(e.target.value)}
                            >
                                <option value="">Select your Forane...</option>
                                {foranes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <button
                                onClick={() => handleFinalLogin('forane')}
                                className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition"
                            >
                                Login as Forane
                            </button>
                        </div>

                        {/* Dynamic Parish Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Parish Portal</label>
                            <select
                                className="w-full p-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => setSelectedId(e.target.value)}
                            >
                                <option value="">Select your Parish...</option>
                                {parishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button
                                onClick={() => handleFinalLogin('parish')}
                                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition"
                            >
                                Login as Parish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;