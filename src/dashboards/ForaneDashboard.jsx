import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const ForaneDashboard = () => {
    const { currentForaneId } = useRole();
    const [entries, setEntries] = useState([]);
    const [newParish, setNewParish] = useState({ name: "", user: "", pass: "" });
    const [loading, setLoading] = useState(false);

    const fetchForaneData = async () => {
        if (!currentForaneId) return;
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

    useEffect(() => {
        fetchForaneData();
    }, [currentForaneId]);

    const handleRegisterParish = async () => {
        if (!newParish.name || !newParish.user || !newParish.pass) {
            alert("Please fill all fields to authorize the new parish.");
            return;
        }

        setLoading(true);
        const { data: pData, error: pError } = await supabase
            .from('parishes')
            .insert([{ name: newParish.name, forane_id: currentForaneId }])
            .select().single();

        if (!pError) {
            const { error: uError } = await supabase.from('users').insert([{
                username: newParish.user,
                password: newParish.pass,
                role: 'parish',
                parish_id: pData.id
            }]);

            if (!uError) {
                alert("Parish account successfully created and authorized.");
                setNewParish({ name: "", user: "", pass: "" });
                fetchForaneData();
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 space-y-10 font-sans">

            {/* Header Section */}
            <div className="border-b-2 border-slate-300 pb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Forane Supervision</h2>
                <p className="text-slate-600 font-bold text-sm mt-1 uppercase tracking-widest">Administrative & Financial Oversight</p>
            </div>

            {/* Registration Section - Card with 2px borders */}
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-[2rem] border-2 border-slate-300 shadow-md no-print space-y-6">
                <div className="border-b-2 border-slate-100 pb-3">
                    <h3 className="text-xl font-black text-blue-900 uppercase">Authorize New Parish</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase">Credentials Generation</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-700 uppercase ml-1">Church / Parish Name</label>
                        <input
                            className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-slate-50 outline-none focus:border-blue-600 transition-all placeholder:text-slate-300"
                            placeholder="Enter Parish Name"
                            value={newParish.name}
                            onChange={e => setNewParish({ ...newParish, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Assign User ID</label>
                            <input
                                className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-white"
                                placeholder="User ID"
                                value={newParish.user}
                                onChange={e => setNewParish({ ...newParish, user: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Assign Password</label>
                            <input
                                className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-white"
                                placeholder="Password"
                                value={newParish.pass}
                                onChange={e => setNewParish({ ...newParish, pass: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleRegisterParish}
                        disabled={loading}
                        className="w-full bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                        {loading ? "AUTHORIZING..." : "GENERATE PARISH ACCOUNT"}
                    </button>
                </div>
            </div>
            ```

            {/* Financial Oversight Section - Records Feed */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-700 rounded-full"></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Recent Parish Submissions</h3>
                </div>

                <div className="grid gap-4">
                    {entries.length === 0 ? (
                        <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-300 text-center text-slate-400 font-bold">
                            No parish submissions found in this jurisdiction.
                        </div>
                    ) : (
                        entries.map((entry, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 transition-colors gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                            Live Entry
                                        </span>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(entry.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900">{entry.parishes.name}</h4>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{entry.category}</p>
                                </div>

                                <div className="w-full md:w-auto text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-0 border-slate-200">
                                    <p className="text-2xl font-black text-emerald-700">₹{entry.income.toLocaleString()}</p>
                                    <p className="text-sm font-black text-rose-500 uppercase tracking-tighter">- ₹{entry.expense.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForaneDashboard;