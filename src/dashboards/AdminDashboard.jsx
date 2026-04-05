import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// ─── Icons (inline SVG) ────────────────────────────────────────────────────────
const IconView    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconReg     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
const IconFilter  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IconChurch  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 2 L12 6 M10 4 L14 4 M3 22 L21 22 M3 10 L21 10 L21 22 L3 22 Z M8 22 L8 14 L16 14 L16 22"/><line x1="12" y1="6" x2="12" y2="10"/></svg>;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtD = (d) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
const net  = (inc, exp) => Number(inc||0) - Number(exp||0);

// ─── Income & Expense Category Lists (same as Parish / Substation dashboards) ──
const incomeCategories = [
    'Balance in Hand','Monthly Subscription','Holi Mass','Sunday Collection',
    'Auctions','Vault','Agricultural Income','Rent','Donation- Specific purpose',
    'Grant - Church/School','Bank Interest/Savings','Exclusive Income',
    'Capital Income (Loan/Land)','Bank Withdrawal','Mission Sunday/Good Friday','Other Income'
];
const expenseCategories = [
    'Pastoral Ministry','Church Feast','Family Ministry','BCC','Youth Ministry',
    'Laity Ministry','Social Service Ministry','Education Ministry','Fisheries',
    'Maintenance','Agricultural Expenses','Capital Expenses','Salary & Allowances',
    'Tax and Fees','Contribution to Diocese/Forane','Other Expenses','Bank Deposit','Cash in Hand'
];

// ══════════════════════════════════════════════════════════════════════════════
//  PANEL 1 – MASTER REPORTS & VIEW
// ══════════════════════════════════════════════════════════════════════════════
const ReportsPanel = ({ foranes, parishes, substations }) => {
    const [filters, setFilters] = useState({
        forane_id: '',
        parish_id: '',
        substation_id: '',
        level: 'all',         // 'all' | 'parish' | 'substation'
        category: '',
        dateFrom: '',
        dateTo: ''
    });

    const [entries, setEntries] = useState([]);
    const [totals,  setTotals]  = useState({ income: 0, expense: 0 });
    const [fetching, setFetching] = useState(false);

    // Derived lists based on current filter
    const filteredParishes    = filters.forane_id
        ? parishes.filter(p => p.forane_id === filters.forane_id)
        : parishes;
    const filteredSubstations = filters.parish_id
        ? substations.filter(s => s.parish_id === filters.parish_id)
        : substations;

    const setF = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

    const fetchEntries = async () => {
        setFetching(true);
        let q = supabase
            .from('financial_entries')
            .select(`
                id, income, expense, category, description, created_at,
                parishes ( id, name, foranes ( id, name ) ),
                substations ( id, name )
            `)
            .order('created_at', { ascending: false });

        if (filters.substation_id) {
            q = q.eq('substation_id', filters.substation_id);
        } else if (filters.parish_id) {
            q = q.eq('parish_id', filters.parish_id);
        } else if (filters.forane_id) {
            // fetch all parishes under that forane then filter
            const foraneParishIds = parishes
                .filter(p => p.forane_id === filters.forane_id)
                .map(p => p.id);
            if (foraneParishIds.length) q = q.in('parish_id', foraneParishIds);
        }

        if (filters.level === 'parish')     q = q.is('substation_id', null);
        if (filters.level === 'substation') q = q.not('substation_id', 'is', null);
        if (filters.category)               q = q.eq('category', filters.category);
        if (filters.dateFrom)               q = q.gte('created_at', filters.dateFrom);
        if (filters.dateTo)                 q = q.lte('created_at', filters.dateTo + 'T23:59:59');

        const { data } = await q;
        const rows = data || [];
        setEntries(rows);
        setTotals({
            income:  rows.reduce((a, r) => a + Number(r.income  || 0), 0),
            expense: rows.reduce((a, r) => a + Number(r.expense || 0), 0)
        });
        setFetching(false);
    };

    useEffect(() => { fetchEntries(); }, []);

    const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];

    return (
        <div className="space-y-8">
            {/* ── Filter Bar ───────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-5 flex items-center gap-3">
                    <IconFilter />
                    <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Hierarchy & Data Filters</h3>
                </div>

                <div className="p-8 space-y-6">
                    {/* Row 1 – Hierarchy */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Jurisdictional Hierarchy</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Forane */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase">Forane</label>
                                <select
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-semibold text-sm bg-slate-50 outline-none focus:border-blue-500 transition-all"
                                    value={filters.forane_id}
                                    onChange={e => {
                                        setF('forane_id', e.target.value);
                                        setF('parish_id', '');
                                        setF('substation_id', '');
                                    }}>
                                    <option value="">All Foranes</option>
                                    {foranes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            {/* Parish */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase">Parish</label>
                                <select
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-semibold text-sm bg-slate-50 outline-none focus:border-blue-500 transition-all"
                                    value={filters.parish_id}
                                    onChange={e => {
                                        setF('parish_id', e.target.value);
                                        setF('substation_id', '');
                                    }}>
                                    <option value="">All Parishes</option>
                                    {filteredParishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            {/* Substation */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase">Substation / Branch</label>
                                <select
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl font-semibold text-sm bg-slate-50 outline-none focus:border-blue-500 transition-all"
                                    value={filters.substation_id}
                                    onChange={e => setF('substation_id', e.target.value)}>
                                    <option value="">All Substations</option>
                                    {filteredSubstations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Row 2 – Data Level & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t-2 border-slate-100 pt-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-600 uppercase">Data Level</label>
                            <select
                                className="w-full p-3 border-2 border-slate-200 rounded-xl font-semibold text-sm bg-slate-50 outline-none focus:border-blue-500 transition-all"
                                value={filters.level}
                                onChange={e => setF('level', e.target.value)}>
                                <option value="all">All Entries</option>
                                <option value="parish">Parish Entries Only</option>
                                <option value="substation">Substation Entries Only</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-600 uppercase">Category</label>
                            <select
                                className="w-full p-3 border-2 border-slate-200 rounded-xl font-semibold text-sm bg-slate-50 outline-none focus:border-blue-500 transition-all"
                                value={filters.category}
                                onChange={e => setF('category', e.target.value)}>
                                <option value="">All Categories</option>
                                <optgroup label="── Income ──">
                                    {incomeCategories.map(c => <option key={c}>{c}</option>)}
                                </optgroup>
                                <optgroup label="── Expense ──">
                                    {expenseCategories.map(c => <option key={c}>{c}</option>)}
                                </optgroup>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase">From</label>
                                <input type="date" className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-all"
                                    value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600 uppercase">To</label>
                                <input type="date" className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-all"
                                    value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={fetchEntries}
                        disabled={fetching}
                        className="w-full py-4 bg-gradient-to-r from-slate-900 to-blue-800 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:from-blue-800 hover:to-blue-600 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50">
                        {fetching ? 'Fetching Records...' : 'Apply Filters & Fetch Records'}
                    </button>
                </div>
            </div>

            {/* ── Summary Metrics ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 text-center shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
                    <p className="text-2xl font-black text-emerald-700">{fmt(totals.income)}</p>
                </div>
                <div className="bg-white rounded-2xl border-2 border-rose-200 p-6 text-center shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expense</p>
                    <p className="text-2xl font-black text-rose-600">{fmt(totals.expense)}</p>
                </div>
                <div className={`rounded-2xl border-2 p-6 text-center shadow-md ${net(totals.income, totals.expense) >= 0 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-rose-900 border-rose-900 text-white'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Balance</p>
                    <p className={`text-2xl font-black ${net(totals.income, totals.expense) >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>{fmt(net(totals.income, totals.expense))}</p>
                </div>
            </div>

            {/* ── Entries – Form Style ─────────────────────────────────── */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-5 flex justify-between items-center">
                    <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Financial Records</h3>
                    <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">{entries.length} Entries</span>
                </div>

                {entries.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-slate-400 font-bold uppercase text-sm tracking-widest">No records match the current filters</p>
                        <p className="text-slate-300 text-xs mt-2">Adjust filters and click "Apply Filters & Fetch Records"</p>
                    </div>
                ) : (
                    <div className="divide-y-2 divide-slate-100">
                        {entries.map((item, i) => {
                            const isIncome = Number(item.income) > 0;
                            const parishName = item.parishes?.name;
                            const foraneName = item.parishes?.foranes?.name;
                            const subName    = item.substations?.name;
                            return (
                                <div key={item.id || i} className="p-6 md:p-8 hover:bg-slate-50 transition-colors">
                                    {/* Form-style layout */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                                        {/* Field: Date */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                            <p className="text-sm font-bold text-slate-700">{fmtD(item.created_at)}</p>
                                        </div>
                                        {/* Field: Forane */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Forane</p>
                                            <p className="text-sm font-bold text-slate-700">{foraneName || '—'}</p>
                                        </div>
                                        {/* Field: Parish */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parish</p>
                                            <p className="text-sm font-bold text-slate-700">{parishName || '—'}</p>
                                        </div>
                                        {/* Field: Substation */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Substation</p>
                                            <p className="text-sm font-bold text-blue-700">{subName || <span className="text-slate-300 italic text-xs">Parish Level</span>}</p>
                                        </div>
                                        {/* Field: Category */}
                                        <div className="col-span-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category / Ledger Item</p>
                                            <p className="text-sm font-bold text-slate-800">{item.category}</p>
                                        </div>
                                        {/* Field: Type Badge */}
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                                            <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {isIncome ? 'Income' : 'Expense'}
                                            </span>
                                        </div>
                                        {/* Field: Amount */}
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                            <p className={`text-xl font-black ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>
                                                {isIncome ? `+ ${fmt(item.income)}` : `− ${fmt(item.expense)}`}
                                            </p>
                                        </div>
                                    </div>
                                    {item.description && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                                            <p className="text-sm text-slate-600 italic">{item.description}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  PANEL 2 – UNIT REGISTRATION
// ══════════════════════════════════════════════════════════════════════════════
const RegistrationPanel = ({ foranes, parishes, reload }) => {
    const [form, setForm] = useState({
        type: 'forane',
        name: '',
        forane_id: '',
        parish_id: '',
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const filteredParishes = form.forane_id
        ? parishes.filter(p => p.forane_id === form.forane_id)
        : parishes;

    const handleRegister = async () => {
        setSuccess(''); setError('');
        if (!form.name || !form.username || !form.password) {
            setError('Please fill in all required fields.'); return;
        }
        if (form.type === 'parish'     && !form.forane_id)  { setError('Select a parent Forane.'); return; }
        if (form.type === 'substation' && !form.parish_id)  { setError('Select a parent Parish.'); return; }

        setLoading(true);
        const table = form.type === 'forane' ? 'foranes' : form.type === 'parish' ? 'parishes' : 'substations';
        const entityPayload = { name: form.name };
        if (form.type === 'parish')     entityPayload.forane_id = form.forane_id;
        if (form.type === 'substation') entityPayload.parish_id = form.parish_id;

        const { data: entity, error: eErr } = await supabase.from(table).insert([entityPayload]).select().single();
        if (eErr) { setError(eErr.message); setLoading(false); return; }

        const userPayload = { username: form.username, password: form.password, role: form.type };
        if (form.type === 'forane')     userPayload.forane_id     = entity.id;
        if (form.type === 'parish')     userPayload.parish_id     = entity.id;
        if (form.type === 'substation') userPayload.substation_id = entity.id;

        const { error: uErr } = await supabase.from('users').insert([userPayload]);
        if (uErr) { setError(uErr.message); setLoading(false); return; }

        setSuccess(`✅ ${form.type.charAt(0).toUpperCase() + form.type.slice(1)} "${form.name}" successfully registered!`);
        setForm({ type: form.type, name: '', forane_id: '', parish_id: '', username: '', password: '' });
        reload();
        setLoading(false);
    };

    const typeConfig = {
        forane:     { label: 'Forane',     color: 'blue',    desc: 'A forane is a grouping of parishes under one jurisdiction.' },
        parish:     { label: 'Parish',     color: 'indigo',  desc: 'A parish belongs to a forane and may have substations.' },
        substation: { label: 'Substation', color: 'violet',  desc: 'A substation is a branch of a parish church.' }
    };
    const cfg = typeConfig[form.type];

    return (
        <div className="space-y-8">
            {/* Type Selector Tabs */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-8 py-5">
                    <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Register New Ecclesiastical Unit</h3>
                    <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest">Select the type of unit to register</p>
                </div>

                {/* Tab buttons */}
                <div className="flex border-b-2 border-slate-200">
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setF('type', key)}
                            className={`flex-1 py-5 font-black text-xs uppercase tracking-widest transition-all border-b-4 -mb-0.5 ${
                                form.type === key
                                    ? `border-${cfg.color}-600 text-${cfg.color}-700 bg-${cfg.color}-50`
                                    : 'border-transparent text-slate-400 bg-white hover:bg-slate-50'
                            }`}>
                            {cfg.label}
                        </button>
                    ))}
                </div>

                {/* Info Banner */}
                <div className="mx-8 mt-6 p-4 bg-blue-50 border-2 border-blue-100 rounded-xl">
                    <p className="text-xs font-bold text-blue-700">{cfg.desc}</p>
                </div>

                {/* Form Fields */}
                <div className="p-8 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                            {cfg.label} Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            className="w-full p-4 border-2 border-slate-300 rounded-xl font-semibold text-sm outline-none focus:border-blue-500 transition-all"
                            placeholder={`Official name of the ${cfg.label}...`}
                            value={form.name}
                            onChange={e => setF('name', e.target.value)} />
                    </div>

                    {/* Parent Forane (for Parish & Substation) */}
                    {(form.type === 'parish' || form.type === 'substation') && (
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                Parent Forane <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className="w-full p-4 border-2 border-slate-300 rounded-xl font-semibold text-sm bg-blue-50 outline-none focus:border-blue-500 transition-all"
                                value={form.forane_id}
                                onChange={e => { setF('forane_id', e.target.value); setF('parish_id', ''); }}>
                                <option value="">Select Forane...</option>
                                {foranes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Parent Parish (for Substation only) */}
                    {form.type === 'substation' && (
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                Parent Parish <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className="w-full p-4 border-2 border-slate-300 rounded-xl font-semibold text-sm bg-indigo-50 outline-none focus:border-indigo-500 transition-all"
                                value={form.parish_id}
                                onChange={e => setF('parish_id', e.target.value)}>
                                <option value="">Select Parish...</option>
                                {filteredParishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Credentials */}
                    <div className="pt-2 border-t-2 border-slate-100 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Credentials</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                Username / Access ID <span className="text-rose-500">*</span>
                            </label>
                            <input
                                className="w-full p-4 border-2 border-slate-300 rounded-xl font-semibold text-sm outline-none focus:border-blue-500 transition-all"
                                placeholder="Unique login username..."
                                value={form.username}
                                onChange={e => setF('username', e.target.value)}
                                autoComplete="off" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                Initial Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="password"
                                className="w-full p-4 border-2 border-slate-300 rounded-xl font-semibold text-sm outline-none focus:border-blue-500 transition-all"
                                placeholder="Set initial passkey..."
                                value={form.password}
                                onChange={e => setF('password', e.target.value)}
                                autoComplete="new-password" />
                        </div>
                    </div>

                    {/* Feedback */}
                    {error   && <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-700 font-bold text-sm">{error}</div>}
                    {success && <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm">{success}</div>}

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-slate-900 to-blue-800 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:from-blue-800 hover:to-blue-600 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50">
                        {loading ? 'Registering...' : `Register ${cfg.label} & Generate Credentials`}
                    </button>
                </div>
            </div>

            {/* Quick Reference Table */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-5">
                    <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Registered Units Overview</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Foranes */}
                    <div>
                        <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full inline-block"></span>Foranes ({foranes.length})
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {foranes.map(f => (
                                <div key={f.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-sm font-black text-slate-800">{f.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Parishes */}
                    <div>
                        <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block"></span>Parishes ({parishes.length})
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {parishes.map(p => (
                                <div key={p.id} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <p className="text-sm font-black text-slate-800">{p.name}</p>
                                    <p className="text-[10px] text-indigo-500 font-bold uppercase">{foranes.find(f => f.id === p.forane_id)?.name || '—'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Substations placeholder */}
                    <div>
                        <p className="text-xs font-black text-violet-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-violet-600 rounded-full inline-block"></span>Substations
                        </p>
                        <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 text-center">
                            <p className="text-xs text-violet-400 font-bold uppercase tracking-widest">Substations are visible after registering</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [activePanel, setActivePanel] = useState('reports');
    const [foranes,     setForanes]     = useState([]);
    const [parishes,    setParishes]    = useState([]);
    const [substations, setSubstations] = useState([]);

    const loadUnits = async () => {
        const [{ data: f }, { data: p }, { data: s }] = await Promise.all([
            supabase.from('foranes').select('id, name'),
            supabase.from('parishes').select('id, name, forane_id'),
            supabase.from('substations').select('id, name, parish_id')
        ]);
        setForanes(f     || []);
        setParishes(p    || []);
        setSubstations(s || []);
    };

    useEffect(() => { loadUnits(); }, []);

    return (
        <div className="min-h-screen bg-[#f1f5f9] font-sans">
            {/* ── Top Header ─────────────────────────────────────────── */}
            <div className="bg-slate-900 px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic">
                        Master System Control
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Archdiocese Financial Management System — Admin
                    </p>
                </div>
                <div className="bg-white/10 text-white px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest border border-white/20">
                    Full System Auth
                </div>
            </div>

            {/* ── Panel Toggle Tabs ───────────────────────────────────── */}
            <div className="px-6 md:px-10 pt-8 pb-0">
                <div className="flex gap-3">
                    <button
                        onClick={() => setActivePanel('reports')}
                        className={`flex items-center gap-2.5 px-7 py-4 rounded-t-2xl font-black text-xs uppercase tracking-widest border-b-4 transition-all ${
                            activePanel === 'reports'
                                ? 'bg-white border-blue-600 text-blue-800 shadow-lg'
                                : 'bg-slate-200 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}>
                        <IconView />
                        View & Reports
                    </button>
                    <button
                        onClick={() => setActivePanel('register')}
                        className={`flex items-center gap-2.5 px-7 py-4 rounded-t-2xl font-black text-xs uppercase tracking-widest border-b-4 transition-all ${
                            activePanel === 'register'
                                ? 'bg-white border-indigo-600 text-indigo-800 shadow-lg'
                                : 'bg-slate-200 border-transparent text-slate-500 hover:bg-slate-100'
                        }`}>
                        <IconReg />
                        Register Units
                    </button>
                </div>
            </div>

            {/* ── Panel Content ───────────────────────────────────────── */}
            <div className="px-6 md:px-10 py-8">
                {activePanel === 'reports' && (
                    <ReportsPanel
                        foranes={foranes}
                        parishes={parishes}
                        substations={substations} />
                )}
                {activePanel === 'register' && (
                    <RegistrationPanel
                        foranes={foranes}
                        parishes={parishes}
                        reload={loadUnits} />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;