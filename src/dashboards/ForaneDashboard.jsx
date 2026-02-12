import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const ForaneDashboard = () => {
    const { currentForaneId } = useRole();
    const [entries, setEntries] = useState([]);
    const [newParishName, setNewParishName] = useState("");

    const fetchForaneData = async () => {
        // 1. Fetch entries only for parishes in THIS forane [cite: 265, 268, 271]
        const { data } = await supabase
            .from('financial_entries')
            .select(`
        income, expense, category, created_at,
        parishes!inner ( name, forane_id )
      `)
            .eq('parishes.forane_id', currentForaneId)
            .order('created_at', { ascending: false });
        setEntries(data || []);
    };

    useEffect(() => { if (currentForaneId) fetchForaneData(); }, [currentForaneId]);

    const handleAddParish = async () => {
        if (!newParishName) return;
        const { error } = await supabase
            .from('parishes')
            .insert([{ name: newParishName, forane_id: currentForaneId }]);
        if (!error) { alert("Parish Registered!"); setNewParishName(""); fetchForaneData(); }
    };

    return (
        <div className="space-y-6">
            {/* Forane Header & Admin Registration [cite: 338] */}
            <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl no-print">
                <h2 className="text-2xl font-black mb-1">Forane Supervision</h2>
                <p className="opacity-70 text-sm">Managing local parish registrations and reports</p>
                <div className="mt-6 flex gap-2">
                    <input className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-sm outline-none" placeholder="Enter New Parish Name..." value={newParishName} onChange={e => setNewParishName(e.target.value)} />
                    <button onClick={handleAddParish} className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-100 transition">Register Parish</button>
                </div>
            </div>

            {/* Local Submissions Feed [cite: 76] */}
            <div className="grid gap-4">
                {entries.map((entry, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{entry.parishes.name}</p>
                            <h4 className="text-lg font-bold text-gray-800">{entry.category}</h4>
                            <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(entry.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-gray-900">₹{entry.income}</p>
                            <p className="text-xs font-bold text-red-500">- ₹{entry.expense}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ForaneDashboard;