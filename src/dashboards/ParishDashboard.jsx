import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

// ─── Category Definitions ────────────────────────────────────────────────────
const incomeCategories = [
    'Balance in Hand', 'Monthly Subscription', 'Holi Mass', 'Sunday Collection',
    'Auctions', 'Vault', 'Agricultural Income', 'Rent', 'Donation- Specific purpose',
    'Grant - Church/School', 'Bank Interest/Savings', 'Exclusive Income',
    'Capital Income (Loan/Land)', 'Bank Withdrawal', 'Mission Sunday/Good Friday', 'Other Income'
];
const expenseCategories = [
    'Pastoral Ministry', 'Church Feast', 'Family Ministry', 'BCC', 'Youth Ministry',
    'Laity Ministry', 'Social Service Ministry', 'Education Ministry', 'Fisheries',
    'Maintenance', 'Agricultural Expenses', 'Capital Expenses', 'Salary & Allowances',
    'Tax and Fees', 'Contribution to Diocese/Forane', 'Other Expenses', 'Bank Deposit', 'Cash in Hand'
];

// Build initial zeroed-out state from a list of categories
const blankAmounts = (cats) => Object.fromEntries(cats.map(c => [c, '']));

// ─── Reusable category form grid ─────────────────────────────────────────────
const CategoryForm = ({ categories, amounts, onChange, accent }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {categories.map(cat => (
            <div key={cat} className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider leading-tight">
                    {cat}
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm select-none">₹</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={amounts[cat]}
                        onChange={e => onChange(cat, e.target.value)}
                        className={`w-full pl-7 pr-3 py-3 border-2 rounded-xl font-bold text-sm outline-none transition-all
                            border-slate-200 bg-white focus:bg-white
                            focus:border-${accent}-400 hover:border-slate-300`}
                    />
                </div>
            </div>
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ParishDashboard = () => {
    const { currentParishId } = useRole();
    const [history,  setHistory]  = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [tab,      setTab]      = useState('income');   // 'income' | 'expense'
    const [success,  setSuccess]  = useState('');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

    // Per-category amount maps
    const [incomeAmounts,  setIncomeAmounts]  = useState(blankAmounts(incomeCategories));
    const [expenseAmounts, setExpenseAmounts] = useState(blankAmounts(expenseCategories));

    // Bank Statement State
    const [bankData, setBankData] = useState({
        savings_opening: 0, savings_dep: 0, savings_with: 0,
        fd_opening: 0, fd_dep: 0, fd_with: 0
    });

    const fetchHistory = async () => {
        if (!currentParishId) return;
        const { data } = await supabase
            .from('financial_entries')
            .select('*')
            .eq('parish_id', currentParishId)
            .order('created_at', { ascending: false });
        setHistory(data || []);
    };

    useEffect(() => { fetchHistory(); }, [currentParishId]);

    // Submit all non-zero fields as individual entries
    const handleSubmitLedger = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');

        const amounts = tab === 'income' ? incomeAmounts : expenseAmounts;
        const rows = Object.entries(amounts)
            .filter(([, val]) => val !== '' && parseFloat(val) > 0)
            .map(([cat, val]) => ({
                parish_id: currentParishId,
                entry_date: entryDate,
                category:  cat,
                income:    tab === 'income'  ? parseFloat(val) : 0,
                expense:   tab === 'expense' ? parseFloat(val) : 0,
            }));

        if (rows.length === 0) {
            alert('Please enter at least one amount.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('financial_entries').insert(rows);
        setLoading(false);
        if (!error) {
            setSuccess(`✅ ${rows.length} ${tab} entr${rows.length > 1 ? 'ies' : 'y'} recorded successfully.`);
            tab === 'income'
                ? setIncomeAmounts(blankAmounts(incomeCategories))
                : setExpenseAmounts(blankAmounts(expenseCategories));
            fetchHistory();
        } else {
            alert(error.message);
        }
    };

    const handleSaveBankStatement = async () => {
        setLoading(true);
        const { error } = await supabase.from('bank_statements').insert([{
            parish_id: currentParishId,
            savings_opening_balance: parseFloat(bankData.savings_opening) || 0,
            savings_deposit:         parseFloat(bankData.savings_dep)     || 0,
            savings_withdrawal:      parseFloat(bankData.savings_with)    || 0,
            fd_opening_balance:      parseFloat(bankData.fd_opening)      || 0,
            fd_deposit:              parseFloat(bankData.fd_dep)          || 0,
            fd_withdrawal:           parseFloat(bankData.fd_with)         || 0,
        }]);
        setLoading(false);
        if (!error) alert('Monthly Bank Statement Reconciled & Saved!');
    };

    const savingsTotal   = parseFloat(bankData.savings_opening || 0) + parseFloat(bankData.savings_dep || 0);
    const savingsClosing = savingsTotal - parseFloat(bankData.savings_with || 0);
    const fdTotal        = parseFloat(bankData.fd_opening || 0) + parseFloat(bankData.fd_dep || 0);
    const fdClosing      = fdTotal - parseFloat(bankData.fd_with || 0);

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 space-y-10 font-sans pb-20">

            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Parish Digital Ledger</h2>
                <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">Data Entry & Reporting</p>
            </div>

            {/* ── LEDGER ENTRY FORM ────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-xl overflow-hidden">

                {/* Tab switcher */}
                <div className="flex border-b-2 border-slate-200">
                    <button
                        type="button"
                        onClick={() => { setTab('income'); setSuccess(''); }}
                        className={`flex-1 py-5 font-black uppercase tracking-widest text-sm transition-all
                            ${tab === 'income'
                                ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-500'
                                : 'bg-slate-50 text-slate-400 border-b-4 border-transparent hover:bg-slate-100'}`}>
                        ↑ Income Entry
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('expense'); setSuccess(''); }}
                        className={`flex-1 py-5 font-black uppercase tracking-widest text-sm transition-all
                            ${tab === 'expense'
                                ? 'bg-rose-50 text-rose-700 border-b-4 border-rose-500'
                                : 'bg-slate-50 text-slate-400 border-b-4 border-transparent hover:bg-slate-100'}`}>
                        ↓ Expense Entry
                    </button>
                </div>

                <form onSubmit={handleSubmitLedger} className="p-8 space-y-8">

                    {/* Section label */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${tab === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <p className={`text-xs font-black uppercase tracking-widest ${tab === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                Enter amounts for each {tab} category &mdash; leave blank to skip
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 px-3 py-2 rounded-xl">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Date:</label>
                            <input 
                                type="date" 
                                value={entryDate}
                                onChange={e => setEntryDate(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                            />
                        </div>
                    </div>

                    {/* Category fields */}
                    {tab === 'income' ? (
                        <CategoryForm
                            categories={incomeCategories}
                            amounts={incomeAmounts}
                            onChange={(cat, val) => setIncomeAmounts(prev => ({ ...prev, [cat]: val }))}
                            accent="emerald"
                        />
                    ) : (
                        <CategoryForm
                            categories={expenseCategories}
                            amounts={expenseAmounts}
                            onChange={(cat, val) => setExpenseAmounts(prev => ({ ...prev, [cat]: val }))}
                            accent="rose"
                        />
                    )}

                    {/* Feedback */}
                    {success && (
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm">
                            {success}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl font-black text-base uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-50
                            ${tab === 'income'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'}`}>
                        {loading ? 'Saving...' : `Record ${tab === 'income' ? 'Income' : 'Expense'} Entries`}
                    </button>
                </form>
            </div>

            {/* ── BANK STATEMENT RECONCILIATION ────────────────────────── */}
            <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] border-2 border-slate-900 shadow-xl overflow-hidden">
                <div className="p-6 bg-slate-900 text-white font-black uppercase tracking-widest text-sm">
                    Bank Statement Reconciliation (Monthly)
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* Savings */}
                    <div className="space-y-4">
                        <h4 className="font-black text-blue-700 border-b-2 border-blue-100 pb-2 uppercase text-sm italic">Savings Account</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Opening Balance</label>
                                <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-400"
                                    value={bankData.savings_opening} onChange={e => setBankData({ ...bankData, savings_opening: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Deposit</label>
                                <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-400"
                                    value={bankData.savings_dep} onChange={e => setBankData({ ...bankData, savings_dep: e.target.value })} />
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Current Total</span>
                            <span className="font-black text-slate-900">₹{savingsTotal.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Withdrawal</label>
                            <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-400"
                                value={bankData.savings_with} onChange={e => setBankData({ ...bankData, savings_with: e.target.value })} />
                        </div>
                        <div className="bg-blue-900 p-4 rounded-xl text-white flex justify-between items-center shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-widest">Closing Balance</span>
                            <span className="text-lg font-black text-emerald-400">₹{savingsClosing.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Fixed Deposit */}
                    <div className="space-y-4">
                        <h4 className="font-black text-indigo-700 border-b-2 border-indigo-100 pb-2 uppercase text-sm italic">Fixed Deposit (FD)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Opening Balance</label>
                                <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400"
                                    value={bankData.fd_opening} onChange={e => setBankData({ ...bankData, fd_opening: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Deposit</label>
                                <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400"
                                    value={bankData.fd_dep} onChange={e => setBankData({ ...bankData, fd_dep: e.target.value })} />
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Total FD Assets</span>
                            <span className="font-black text-slate-900">₹{fdTotal.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Withdrawal</label>
                            <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-indigo-400"
                                value={bankData.fd_with} onChange={e => setBankData({ ...bankData, fd_with: e.target.value })} />
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl text-white flex justify-between items-center shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-widest">Closing FD Balance</span>
                            <span className="text-lg font-black text-emerald-400">₹{fdClosing.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveBankStatement}
                        disabled={loading}
                        className="col-span-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all border-2 border-slate-900 disabled:opacity-50">
                        Sync Monthly Bank Statement
                    </button>
                </div>
            </div>

            {/* ── LEDGER HISTORY ────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto bg-white rounded-[2rem] border-2 border-slate-900 overflow-hidden shadow-lg">
                <div className="p-6 bg-slate-900 text-white font-black uppercase tracking-widest text-sm">Verified Ledger History</div>
                <div className="divide-y-2 divide-slate-100">
                    {history.length === 0 && (
                        <div className="p-10 text-center text-slate-300 text-sm font-bold uppercase tracking-widest">No entries yet</div>
                    )}
                    {history.map((item, i) => (
                        <div key={i} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${item.income > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {item.category}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                    {new Date(item.entry_date || item.created_at).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                            <div className="text-right">
                                {item.income > 0
                                    ? <p className="text-xl font-black text-emerald-700">+ ₹{Number(item.income).toLocaleString()}</p>
                                    : <p className="text-xl font-black text-rose-600">− ₹{Number(item.expense).toLocaleString()}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParishDashboard;