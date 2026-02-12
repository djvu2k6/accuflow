import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const ParishDashboard = () => {
    const { currentParishId } = useRole();
    const [formData, setFormData] = useState({ income: 0, expense: 0, category: 'General Offering', desc: "" });
    const [loading, setLoading] = useState(false);

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
        if (error) alert(error.message);
        else {
            alert("Financial Data Synced Successfully!");
            setFormData({ income: 0, expense: 0, category: 'General Offering', desc: "" });
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <header className="mb-10 text-center">
                    <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-3">Cloud Ledger</div>
                    <h3 className="text-3xl font-black text-gray-900">Parish Portal</h3>
                    <p className="text-gray-400 text-sm mt-2">Submit your church's monthly accounts</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase px-1">Entry Type</label>
                        <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            <option>General Offering</option>
                            <option>Donations</option>
                            <option>Building Fund</option>
                            <option>Charity Outflow</option>
                            <option>Maintenance</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase px-1">Income (₹)</label>
                            <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" value={formData.income} onChange={e => setFormData({ ...formData, income: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase px-1">Expense (₹)</label>
                            <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" value={formData.expense} onChange={e => setFormData({ ...formData, expense: e.target.value })} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase px-1">Narrative</label>
                        <textarea className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl h-32 outline-none" placeholder="Details about this entry..." value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 hover:scale-[1.01] transition-all shadow-xl shadow-blue-200 disabled:opacity-50">
                        {loading ? "Syncing..." : "Submit to Archdiocese"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ParishDashboard;