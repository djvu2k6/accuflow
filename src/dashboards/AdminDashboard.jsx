import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminDashboard = () => {
    // Management State
    const [units, setUnits] = useState({ foranes: [], parishes: [] });
    const [formData, setFormData] = useState({ name: "", user: "", pass: "", parentId: "", type: "forane" });

    // Financial Monitoring State
    const [logs, setLogs] = useState([]);
    const [totals, setTotals] = useState({ income: 0, expense: 0 });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        // 1. Fetch Units for Dropdowns
        const { data: f } = await supabase.from('foranes').select('id, name');
        const { data: p } = await supabase.from('parishes').select('id, name');
        setUnits({ foranes: f || [], parishes: p || [] });

        // 2. Fetch Global Financial Logs
        const { data: entries } = await supabase
            .from('financial_entries')
            .select(`
                income, expense, category, created_at,
                parishes ( name, foranes ( name ) ),
                substations ( name )
            `)
            .order('created_at', { ascending: false });

        if (entries) {
            setLogs(entries);
            const inc = entries.reduce((acc, curr) => acc + Number(curr.income), 0);
            const exp = entries.reduce((acc, curr) => acc + Number(curr.expense), 0);
            setTotals({ income: inc, expense: exp });
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateUnit = async () => {
        if (!formData.name || !formData.user || !formData.pass) return alert("Fill all fields");

        setLoading(true);
        let table = formData.type === 'substation' ? 'substations' : (formData.type === 'forane' ? 'foranes' : 'parishes');
        let payload = { name: formData.name };

        if (formData.type === "parish") payload.forane_id = formData.parentId;
        if (formData.type === "substation") payload.parish_id = formData.parentId;

        const { data: entity, error: eError } = await supabase.from(table).insert([payload]).select().single();

        if (!eError) {
            const userPayload = { username: formData.user, password: formData.pass, role: formData.type };
            if (formData.type === 'forane') userPayload.forane_id = entity.id;
            if (formData.type === 'parish') userPayload.parish_id = entity.id;
            if (formData.type === 'substation') userPayload.substation_id = entity.id;

            const { error: uError } = await supabase.from('users').insert([userPayload]);
            if (!uError) {
                alert(`SUCCESS: ${formData.type.toUpperCase()} Account Created.`);
                setFormData({ ...formData, name: "", user: "", pass: "" });
                fetchData(); // Refresh units and logs
            }
        } else { alert(eError.message); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 space-y-12 font-sans pb-20">
            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Master System Control</h2>
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mt-1">Full System Authorization & Monitoring</p>
                </div>
                <div className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-900">
                    System Admin Mode
                </div>
            </div>

            {/* Financial Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500 shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Income</p>
                    <h2 className="text-3xl font-black text-slate-900 mt-2">₹{totals.income.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-8 rounded-3xl border-2 border-rose-500 shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Expenses</p>
                    <h2 className="text-3xl font-black text-slate-900 mt-2">₹{totals.expense.toLocaleString()}</h2>
                </div>
                <div className="bg-slate-900 p-8 rounded-3xl border-2 border-slate-900 text-white shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net System Assets</p>
                    <h2 className="text-3xl font-black mt-2 text-emerald-400">₹{(totals.income - totals.expense).toLocaleString()}</h2>
                </div>
            </div>

            {/* Registration Form Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-300 shadow-xl space-y-8">
                <div className="border-b-2 border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-blue-900 uppercase">Authorize New Ecclesiastical Unit</h3>
                    <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Infrastructure Management</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-700 ml-1">Unit Type</label>
                        <select className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-slate-50 outline-none focus:border-blue-600 transition-all" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                            <option value="forane">New Forane</option>
                            <option value="parish">New Parish Church</option>
                            <option value="substation">New Substation (Branch)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-700 ml-1">Legal Name</label>
                        <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-white" placeholder="Official Title" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    {(formData.type !== "forane") && (
                        <div className="space-y-2 col-span-full">
                            <label className="text-xs font-black uppercase text-slate-700 ml-1">Parent Entity</label>
                            <select className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-blue-50 outline-none focus:border-blue-600" value={formData.parentId} onChange={e => setFormData({ ...formData, parentId: e.target.value })}>
                                <option value="">Select Parent Jurisdiction...</option>
                                {(formData.type === "parish" ? units.foranes : units.parishes).map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-full pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-700 ml-1">Assigned Access ID</label>
                            <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold" placeholder="User ID" value={formData.user} onChange={e => setFormData({ ...formData, user: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-700 ml-1">Security Password</label>
                            <input className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold" placeholder="Initial Passkey" value={formData.pass} onChange={e => setFormData({ ...formData, pass: e.target.value })} />
                        </div>
                    </div>
                </div>
                <button onClick={handleCreateUnit} disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                    {loading ? "AUTHORIZING..." : "GENERATE UNIT CREDENTIALS"}
                </button>
            </div>

            {/* Global Audit Log */}
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-900 overflow-hidden shadow-2xl">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-lg uppercase tracking-[0.2em]">Master Audit Feed</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Cross-jurisdictional financial monitoring</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5 border-r-2 border-slate-200">Timestamp</th>
                                <th className="px-8 py-5 border-r-2 border-slate-200">Originating Unit</th>
                                <th className="px-8 py-5 border-r-2 border-slate-200">Ledger Item</th>
                                <th className="px-8 py-5 text-right">Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-200">
                            {logs.map((item, i) => (
                                <tr key={i} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-8 py-6 text-xs font-black border-r-2 border-slate-100">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 border-r-2 border-slate-100">
                                        <div className="text-sm font-black text-slate-900">{item.parishes?.name}</div>
                                        <div className="text-[10px] text-blue-700 font-black uppercase tracking-widest">
                                            {item.substations?.name ? `Sub: ${item.substations.name}` : `Forane: ${item.parishes?.foranes?.name}`}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 border-r-2 border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        {item.category}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black">
                                        <div className="text-emerald-700 text-lg">₹{item.income.toLocaleString()}</div>
                                        <div className="text-rose-600 text-[10px]">-₹{item.expense.toLocaleString()}</div>
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

export default AdminDashboard;