import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const ParishDashboard = () => {
    const { currentParishId } = useRole();
    const [formData, setFormData] = useState({ income: 0, expense: 0, category: 'Offerings', desc: "" });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch the remittance history for this specific parish [cite: 178, 182]
    const fetchHistory = async () => {
        if (!currentParishId) return;
        const { data, error } = await supabase
            .from("financial_entries")
            .select("*")
            .eq("parish_id", currentParishId)
            .order("created_at", { ascending: false }); // Latest entries first [cite: 90]

        if (!error) setHistory(data || []);
    };

    useEffect(() => {
        fetchHistory();
    }, [currentParishId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 2. Insert the new entry into the database [cite: 277, 278, 283]
        const { error } = await supabase
            .from("financial_entries")
            .insert([{
                parish_id: currentParishId,
                income: parseFloat(formData.income),
                expense: parseFloat(formData.expense),
                category: formData.category,
                description: formData.desc
            }]);

        setLoading(false);
        if (error) {
            alert("Error: " + error.message);
        } else {
            alert("Financial data synced to cloud!");
            setFormData({ income: 0, expense: 0, category: 'Offerings', desc: "" });
            fetchHistory(); // Refresh the history list immediately after submission
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {/* SECTION 1: Data Entry Form [cite: 42, 67] */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-gray-100">
                <header className="mb-6">
                    <h3 className="text-2xl font-black text-blue-900">Parish Portal</h3>
                    <p className="text-gray-400 text-sm">Submit monthly financial data to the Archdiocese [cite: 26, 43]</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category</label>
                            <select
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Offerings">Sunday Offerings</option>
                                <option value="Donations">Special Donations</option>
                                <option value="Maintenance">Maintenance/Utilities</option>
                                <option value="Salaries">Staff Salaries</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Income (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    value={formData.income}
                                    onChange={e => setFormData({ ...formData, income: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Expense (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    value={formData.expense}
                                    onChange={e => setFormData({ ...formData, expense: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Narration/Details</label>
                        <textarea
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-20"
                            placeholder="e.g., Monthly electricity bill or special feast collection..."
                            value={formData.desc}
                            onChange={e => setFormData({ ...formData, desc: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-lg disabled:opacity-50 shadow-blue-200"
                    >
                        {loading ? "Syncing to Cloud..." : "Finalize Remittance"}
                    </button>
                </form>
            </div>

            {/* SECTION 2: Remittance History [cite: 39, 46, 85] */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h4 className="font-black text-gray-800 uppercase tracking-tight">Recent Remittances</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Digital Financial Repository </p>
                </div>

                {/* Mobile-Friendly List [cite: 26] */}
                <div className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">No previous remittances found.</div>
                    ) : (
                        history.map((item, i) => (
                            <div key={i} className="p-5 flex justify-between items-center hover:bg-blue-50/30 transition">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.category}</p>
                                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                                    {item.description && <p className="text-[10px] text-gray-500 italic max-w-[200px] truncate">{item.description}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-gray-900">₹{item.income.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-red-400">- ₹{item.expense.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParishDashboard;