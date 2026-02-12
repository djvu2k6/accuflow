import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ArchDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [foranes, setForanes] = useState([]);
    const [newForaneName, setNewForaneName] = useState("");
    const [newParish, setNewParish] = useState({ name: "", foraneId: "" });
    const [totals, setTotals] = useState({ income: 0, expense: 0 });

    const fetchData = async () => {
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

        const { data: fData } = await supabase.from('foranes').select('id, name');
        setForanes(fData || []);
    };

    useEffect(() => { fetchData(); }, []);

    const handleDownloadPDF = () => { window.print(); };

    const handleAddForane = async () => {
        if (!newForaneName) return;
        const { data: archData } = await supabase.from('archdioceses').select('id').limit(1).single();
        const { error } = await supabase
            .from('foranes')
            .insert([{ name: newForaneName, archdiocese_id: archData.id }]);
        if (!error) { alert("Forane Registered!"); setNewForaneName(""); fetchData(); }
    };

    const handleAddParish = async () => {
        if (!newParish.name || !newParish.foraneId) return;
        const { error } = await supabase
            .from('parishes')
            .insert([{ name: newParish.name, forane_id: newParish.foraneId }]);
        if (!error) { alert("Parish Registered!"); setNewParish({ name: "", foraneId: "" }); fetchData(); }
    };

    return (
        <div className="space-y-6 md:space-y-8 px-2 md:px-0">
            {/* Header & Download Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
                <h2 className="text-2xl md:text-3xl font-black text-blue-900">Diocese Overview</h2>
                <button
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 sm:py-2 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition shadow-lg"
                >
                    Download Audit Report
                </button>
            </div>

            {/* Printable PDF Header */}
            <div className="hidden print:block text-center mb-10">
                <h1 className="text-2xl font-bold text-black">AccuFlow Financial Audit Report</h1>
                <p className="text-sm">Latin Arch Diocese - Trivandrum, Kerala</p>
                <p className="text-xs text-gray-500">Report Generated: {new Date().toLocaleString()}</p>
                <hr className="my-4 border-black" />
            </div>

            {/* Metrics Summary - Stacks on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border-l-4 border-blue-600 print:border-black">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Income</p>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900">₹{totals.income.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border-l-4 border-red-500 print:border-black">
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Expense</p>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900">₹{totals.expense.toLocaleString()}</h2>
                </div>
                <div className="bg-blue-900 p-5 md:p-6 rounded-2xl shadow-sm text-white print:bg-gray-100 print:text-black print:border print:border-black">
                    <p className="text-xs font-bold opacity-80 uppercase print:text-black">Net Assets</p>
                    <h2 className="text-xl md:text-2xl font-black">₹{(totals.income - totals.expense).toLocaleString()}</h2>
                </div>
            </div>

            {/* Admin Controls - Stacks on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-blue-900 mb-4 text-sm uppercase tracking-wider">Register Forane</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input className="flex-1 p-3 sm:p-2 border rounded-lg text-sm" placeholder="Forane Name" value={newForaneName} onChange={e => setNewForaneName(e.target.value)} />
                        <button onClick={handleAddForane} className="bg-blue-900 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-bold">Add Forane</button>
                    </div>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-blue-900 mb-4 text-sm uppercase tracking-wider">Register Parish</h3>
                    <div className="flex flex-col gap-2">
                        <select className="p-3 sm:p-2 border rounded-lg text-sm" onChange={e => setNewParish({ ...newParish, foraneId: e.target.value })} value={newParish.foraneId}>
                            <option value="">Select Target Forane...</option>
                            {foranes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input className="flex-1 p-3 sm:p-2 border rounded-lg text-sm" placeholder="Parish Name" value={newParish.name} onChange={e => setNewParish({ ...newParish, name: e.target.value })} />
                            <button onClick={handleAddParish} className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-bold">Add Parish</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Activity - Table for Desktop, Cards for Mobile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-black">
                {/* Desktop View Table */}
                <div className="hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
                            <tr className="text-[10px] font-bold text-gray-400 uppercase">
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Church / Forane</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((item, i) => (
                                <tr key={i} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 text-xs text-gray-400">
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{item.parishes?.name}</div>
                                        <div className="text-[10px] text-blue-600 font-bold uppercase">{item.parishes?.foranes?.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">{item.category}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-green-600">₹{item.income}</span>
                                        <div className="text-[10px] text-red-400">- ₹{item.expense}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card List */}
                <div className="md:hidden divide-y divide-gray-100">
                    <div className="bg-gray-50 p-4 text-[10px] font-bold text-gray-400 uppercase">Live Activity Feed</div>
                    {logs.map((item, i) => (
                        <div key={i} className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{item.parishes?.name}</div>
                                    <div className="text-[10px] text-blue-600 font-bold uppercase">{item.parishes?.foranes?.name}</div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                <span className="text-xs text-gray-500 font-medium">{item.category}</span>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-green-600">₹{item.income}</span>
                                    <span className="text-[10px] text-red-400 ml-2">- ₹{item.expense}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArchDashboard;