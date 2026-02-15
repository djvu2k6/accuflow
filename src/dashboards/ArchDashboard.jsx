import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ArchDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [foranes, setForanes] = useState([]);
    const [totals, setTotals] = useState({ income: 0, expense: 0 });
    const [newForane, setNewForane] = useState({ name: "", user: "", pass: "" });
    const [newParish, setNewParish] = useState({ name: "", foraneId: "", user: "", pass: "" });

    const fetchData = async () => {
        // 1. Fetch Global Financial Feed
        const { data: entries } = await supabase
            .from('financial_entries')
            .select(`
                income, expense, category, created_at,
                parishes ( name, foranes ( name ) )
            `)
            .order('created_at', { ascending: false });

        if (entries) {
            setLogs(entries);
            const inc = entries.reduce((acc, curr) => acc + Number(curr.income), 0);
            const exp = entries.reduce((acc, curr) => acc + Number(curr.expense), 0);
            setTotals({ income: inc, expense: exp });
        }

        // 2. Fetch Foranes for registration dropdown
        const { data: fData } = await supabase.from('foranes').select('id, name');
        setForanes(fData || []);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDownloadPDF = () => {
        window.print();
    };

    // --- ADMINISTRATIVE FUNCTIONS ---

    const handleRegisterForane = async () => {
        if (!newForane.name || !newForane.user || !newForane.pass) {
            alert("Please fill all forane fields");
            return;
        }

        const { data: archData } = await supabase.from('archdioceses').select('id').limit(1).single();

        const { data: fData, error: fError } = await supabase
            .from('foranes')
            .insert([{ name: newForane.name, archdiocese_id: archData?.id }])
            .select().single();

        if (fError) {
            alert(fError.message);
            return;
        }

        const { error: uError } = await supabase.from('users').insert([{
            username: newForane.user,
            password: newForane.pass,
            role: 'forane',
            forane_id: fData.id
        }]);

        if (!uError) {
            alert("Forane and Credentials Created Successfully!");
            setNewForane({ name: "", user: "", pass: "" });
            fetchData();
        } else {
            alert(uError.message);
        }
    };

    const handleRegisterParish = async () => {
        if (!newParish.name || !newParish.foraneId || !newParish.user || !newParish.pass) {
            alert("Please fill all parish fields");
            return;
        }

        const { data: pData, error: pError } = await supabase
            .from('parishes')
            .insert([{ name: newParish.name, forane_id: newParish.foraneId }])
            .select().single();

        if (pError) {
            alert(pError.message);
            return;
        }

        const { error: uError } = await supabase.from('users').insert([{
            username: newParish.user,
            password: newParish.pass,
            role: 'parish',
            parish_id: pData.id
        }]);

        if (!uError) {
            alert("Parish and Credentials Created Successfully!");
            setNewParish({ name: "", foraneId: "", user: "", pass: "" });
            fetchData();
        } else {
            alert(uError.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 space-y-10 font-sans">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print border-b-2 border-slate-300 pb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">Authority Portal</h2>
                    <p className="text-slate-600 font-bold text-sm mt-1 uppercase tracking-widest">Archdiocese Oversight</p>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    className="w-full md:w-auto border-2 border-slate-900 bg-white text-slate-900 px-8 py-3 rounded-xl font-black hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-md"
                >
                    DOWNLOAD AUDIT REPORT
                </button>
            </div>

            {/* Metrics Section - 2px Borders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500 shadow-sm">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Income</p>
                    <h2 className="text-3xl font-black text-slate-900 mt-2">₹{totals.income.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-8 rounded-3xl border-2 border-rose-500 shadow-sm">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Expense</p>
                    <h2 className="text-3xl font-black text-slate-900 mt-2">₹{totals.expense.toLocaleString()}</h2>
                </div>
                <div className="bg-slate-900 p-8 rounded-3xl border-2 border-slate-900 text-white shadow-xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Net Assets</p>
                    <h2 className="text-3xl font-black mt-2 text-emerald-400">₹{(totals.income - totals.expense).toLocaleString()}</h2>
                </div>
            </div>

            {/* Administration Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
                {/* Forane Card */}
                <div className="bg-white p-8 rounded-3xl border-2 border-slate-300 shadow-md space-y-6">
                    <h3 className="font-black text-slate-900 text-xl border-b-2 border-slate-100 pb-3 uppercase">Register Forane</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Forane Name</label>
                            <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-slate-50 outline-none focus:border-blue-600 transition-all" placeholder="Enter Name" value={newForane.name} onChange={e => setNewForane({ ...newForane, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-700 uppercase ml-1">Assigned User ID</label>
                                <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold" placeholder="User ID" value={newForane.user} onChange={e => setNewForane({ ...newForane, user: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-700 uppercase ml-1">Passkey</label>
                                <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold" type="text" placeholder="Password" value={newForane.pass} onChange={e => setNewForane({ ...newForane, pass: e.target.value })} />
                            </div>
                        </div>
                        <button onClick={handleRegisterForane} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-md">Authorize Forane Account</button>
                    </div>
                </div>

                {/* Parish Card */}
                <div className="bg-white p-8 rounded-3xl border-2 border-slate-300 shadow-md space-y-6">
                    <h3 className="font-black text-slate-900 text-xl border-b-2 border-slate-100 pb-3 uppercase">Register Parish</h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Jurisdiction</label>
                            <select className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-slate-50 outline-none" value={newParish.foraneId} onChange={e => setNewParish({ ...newParish, foraneId: e.target.value })}>
                                <option value="">Select Forane...</option>
                                {foranes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Church Name</label>
                            <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-slate-50" placeholder="Parish Name" value={newParish.name} onChange={e => setNewParish({ ...newParish, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input className="p-4 border-2 border-slate-400 rounded-xl font-bold" placeholder="Assign User ID" value={newParish.user} onChange={e => setNewParish({ ...newParish, user: e.target.value })} />
                            <input className="p-4 border-2 border-slate-400 rounded-xl font-bold" type="text" placeholder="Assign Passkey" value={newParish.pass} onChange={e => setNewParish({ ...newParish, pass: e.target.value })} />
                        </div>
                        <button onClick={handleRegisterParish} className="w-full bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-md">Generate Parish Account</button>
                    </div>
                </div>
            </div>

            {/* Audit Table - High Contrast 2px Borders */}
            <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden shadow-xl">
                <div className="p-6 bg-slate-900 text-white font-black uppercase tracking-widest text-sm">
                    Global Transaction Audit Log
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5 border-r-2 border-slate-200">Date</th>
                                <th className="px-8 py-5 border-r-2 border-slate-200">Origin Unit</th>
                                <th className="px-8 py-5 border-r-2 border-slate-200">Category</th>
                                <th className="px-8 py-4 text-right">Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-200">
                            {logs.map((item, i) => (
                                <tr key={i} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-8 py-5 text-xs font-black border-r-2 border-slate-200">{new Date(item.created_at).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 border-r-2 border-slate-200">
                                        <div className="text-sm font-black text-slate-900">{item.parishes?.name}</div>
                                        <div className="text-[10px] text-blue-700 font-black uppercase tracking-widest">{item.parishes?.foranes?.name}</div>
                                    </td>
                                    <td className="px-8 py-5 border-r-2 border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.category}</td>
                                    <td className="px-8 py-5 text-right font-black">
                                        <div className="text-emerald-700 text-lg">₹{item.income.toLocaleString()}</div>
                                        <div className="text-rose-600 text-xs">-₹{item.expense.toLocaleString()}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ArchDashboard;