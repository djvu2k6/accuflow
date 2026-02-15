import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const ParishDashboard = () => {
    const { currentParishId } = useRole();
    const [formData, setFormData] = useState({ income: 0, expense: 0, category: 'Offerings', desc: "" });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch the remittance history for this specific parish
    const fetchHistory = async () => {
        if (!currentParishId) return;
        const { data, error } = await supabase
            .from("financial_entries")
            .select("*")
            .eq("parish_id", currentParishId)
            .order("created_at", { ascending: false });

        if (!error) setHistory(data || []);
    };

    useEffect(() => {
        fetchHistory();
    }, [currentParishId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

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
            alert("Submission Error: " + error.message);
        } else {
            alert("Financial record successfully synced to the Archdiocese.");
            setFormData({ income: 0, expense: 0, category: 'Offerings', desc: "" });
            fetchHistory();
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 space-y-10 font-sans">

            {/* Header Section */}
            <div className="border-b-2 border-slate-300 pb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Parish Portal</h2>
                <p className="text-slate-600 font-bold text-sm mt-1 uppercase tracking-widest">Submit Data to Archdiocese</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-10">

                {/* SECTION 1: Data Entry Form */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-300 shadow-xl">
                    <header className="mb-8 border-b-2 border-slate-100 pb-4">
                        <h3 className="text-xl font-black text-blue-900 uppercase">Monthly Remittance</h3>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase">Digital Entry Form</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase ml-1">Submission Category</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-400 rounded-xl font-bold outline-none focus:border-blue-600 transition-all cursor-pointer"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Offerings">Sunday Offerings</option>
                                    <option value="Donations">Special Donations</option>
                                    <option value="Maintenance">Maintenance/Utilities</option>
                                    <option value="Salaries">Staff Salaries</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase ml-1">Income (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl font-black focus:border-emerald-600 outline-none transition-all"
                                        value={formData.income}
                                        onChange={e => setFormData({ ...formData, income: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-700 uppercase ml-1">Expense (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl font-black focus:border-rose-600 outline-none transition-all"
                                        value={formData.expense}
                                        onChange={e => setFormData({ ...formData, expense: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Narration / Remarks</label>
                            <textarea
                                className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl h-28 font-medium outline-none focus:border-blue-600 transition-all"
                                placeholder="Enter specific details about this remittance..."
                                value={formData.desc}
                                onChange={e => setFormData({ ...formData, desc: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "SYNCING TO CLOUD..." : "FINALIZE REMITTANCE"}
                        </button>
                    </form>
                </div>

                {/* SECTION 2: Remittance History */}
                <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 overflow-hidden shadow-xl">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-sm">Recent Remittances</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Digital Parish Archive</p>
                        </div>
                        <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Verified</span>
                    </div>

                    <div className="divide-y-2 divide-slate-100">
                        {history.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                                No previous records found.
                            </div>
                        ) : (
                            history.map((item, i) => (
                                <div key={i} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </p>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Ref: #{item.id.slice(0, 5)}
                                            </p>
                                        </div>
                                        <h5 className="text-xl font-black text-slate-900 uppercase">{item.category}</h5>
                                        {item.description && (
                                            <p className="text-xs font-medium text-slate-500 italic max-w-md">
                                                "{item.description}"
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-full md:w-auto text-left md:text-right border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                        <p className="text-2xl font-black text-emerald-700">₹{item.income.toLocaleString()}</p>
                                        <p className="text-xs font-black text-rose-500 uppercase tracking-tighter">- ₹{item.expense.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParishDashboard;