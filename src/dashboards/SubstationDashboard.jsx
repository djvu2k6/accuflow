import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const SubstationDashboard = () => {
    const { currentSubstationId, currentParishId } = useRole();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Ledger Entry State
    const [entry, setEntry] = useState({ type: 'income', category: 'Sunday Collection', amount: 0, desc: "" });

    // Bank Statement State
    const [bankData, setBankData] = useState({
        savings_opening: 0, savings_dep: 0, savings_with: 0,
        fd_opening: 0, fd_dep: 0, fd_with: 0
    });

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

    const fetchHistory = async () => {
        if (!currentSubstationId) return;
        const { data } = await supabase
            .from("financial_entries")
            .select("*")
            .eq("substation_id", currentSubstationId)
            .order("created_at", { ascending: false });
        setHistory(data || []);
    };

    useEffect(() => { fetchHistory(); }, [currentSubstationId]);

    const handleSubmitLedger = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            parish_id: currentParishId, // Substation data rolls up to parent Parish
            substation_id: currentSubstationId,
            category: entry.category,
            income: entry.type === 'income' ? parseFloat(entry.amount) : 0,
            expense: entry.type === 'expense' ? parseFloat(entry.amount) : 0,
            description: entry.desc
        };

        const { error } = await supabase.from("financial_entries").insert([payload]);

        setLoading(false);
        if (!error) {
            alert("Branch record successfully synchronized.");
            setEntry({ ...entry, amount: 0, desc: "" });
            fetchHistory();
        }
    };

    const handleSaveBankStatement = async () => {
        setLoading(true);
        const { error } = await supabase.from("bank_statements").insert([{
            parish_id: currentParishId,
            substation_id: currentSubstationId,
            savings_opening_balance: parseFloat(bankData.savings_opening),
            savings_deposit: parseFloat(bankData.savings_dep),
            savings_withdrawal: parseFloat(bankData.savings_with),
            fd_opening_balance: parseFloat(bankData.fd_opening),
            fd_deposit: parseFloat(bankData.fd_dep),
            fd_withdrawal: parseFloat(bankData.fd_with)
        }]);
        setLoading(false);
        if (!error) alert("Branch Bank Statement reconciled & saved.");
    };

    const savingsClosing = parseFloat(bankData.savings_opening) + parseFloat(bankData.savings_dep) - parseFloat(bankData.savings_with);
    const fdClosing = parseFloat(bankData.fd_opening) + parseFloat(bankData.fd_dep) - parseFloat(bankData.fd_with);

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 space-y-12 font-sans pb-20">
            <div className="border-b-2 border-slate-300 pb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Substation Portal</h2>
                <p className="text-slate-600 font-bold text-sm mt-1 uppercase tracking-widest">Branch Data Entry & Reporting</p>
            </div>

            {/* ENTRY FORM */}
            <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border-2 border-slate-300 shadow-xl overflow-hidden">
                <div className="flex border-b-2 border-slate-300">
                    <button
                        onClick={() => setEntry({ ...entry, type: 'income', category: incomeCategories[0] })}
                        className={`flex-1 py-6 font-black uppercase tracking-widest ${entry.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}
                    >
                        Income Entry
                    </button>
                    <button
                        onClick={() => setEntry({ ...entry, type: 'expense', category: expenseCategories[0] })}
                        className={`flex-1 py-6 font-black uppercase tracking-widest ${entry.type === 'expense' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-400'}`}
                    >
                        Expense Entry
                    </button>
                </div>
                <form onSubmit={handleSubmitLedger} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Ledger Item</label>
                            <select className="w-full p-4 border-2 border-slate-400 rounded-xl font-bold bg-slate-50" value={entry.category} onChange={e => setEntry({ ...entry, category: e.target.value })}>
                                {(entry.type === 'income' ? incomeCategories : expenseCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">Amount (₹)</label>
                            <input type="number" className={`w-full p-4 border-2 rounded-xl font-black ${entry.type === 'income' ? 'border-emerald-400 focus:border-emerald-600' : 'border-rose-400 focus:border-rose-600'}`} value={entry.amount} onChange={e => setEntry({ ...entry, amount: e.target.value })} required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg ${entry.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                        {loading ? "SYNCING..." : `RECORD BRANCH ${entry.type.toUpperCase()}`}
                    </button>
                </form>
            </div>

            {/* BANK RECONCILIATION */}
            <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border-2 border-slate-900 shadow-xl overflow-hidden">
                <div className="p-6 bg-slate-900 text-white font-black uppercase tracking-widest text-sm">Branch Bank Statement Reconciliation</div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <h4 className="font-black text-blue-700 border-b-2 border-blue-100 pb-2 uppercase text-sm italic">Savings</h4>
                        <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold" placeholder="Opening" onChange={e => setBankData({ ...bankData, savings_opening: e.target.value })} />
                        <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold" placeholder="Deposit" onChange={e => setBankData({ ...bankData, savings_dep: e.target.value })} />
                        <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold" placeholder="Withdrawal" onChange={e => setBankData({ ...bankData, savings_with: e.target.value })} />
                        <div className="bg-blue-900 p-4 rounded-xl text-white flex justify-between items-center shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-widest">Closing Balance</span>
                            <span className="text-lg font-black text-emerald-400">₹{savingsClosing.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-black text-indigo-700 border-b-2 border-indigo-100 pb-2 uppercase text-sm italic">Fixed Deposit</h4>
                        <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold" placeholder="Opening" onChange={e => setBankData({ ...bankData, fd_opening: e.target.value })} />
                        <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold" placeholder="Deposit" onChange={e => setBankData({ ...bankData, fd_dep: e.target.value })} />
                        <input type="number" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold" placeholder="Withdrawal" onChange={e => setBankData({ ...bankData, fd_with: e.target.value })} />
                        <div className="bg-slate-800 p-4 rounded-xl text-white flex justify-between items-center shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-widest">Closing Balance</span>
                            <span className="text-lg font-black text-emerald-400">₹{fdClosing.toLocaleString()}</span>
                        </div>
                    </div>
                    <button onClick={handleSaveBankStatement} className="col-span-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest border-2 border-slate-900">Sync Branch Statement</button>
                </div>
            </div>

            {/* BRANCH HISTORY */}
            <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border-2 border-slate-900 overflow-hidden shadow-lg">
                <div className="p-6 bg-slate-900 text-white font-black uppercase tracking-widest text-sm text-center">Branch Transaction History</div>
                <div className="divide-y-2 divide-slate-100">
                    {history.map((item, i) => (
                        <div key={i} className="p-6 flex justify-between items-center hover:bg-slate-50">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${item.income > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{item.category}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                            <p className={`text-xl font-black ${item.income > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {item.income > 0 ? `+ ₹${item.income.toLocaleString()}` : `- ₹${item.expense.toLocaleString()}`}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubstationDashboard;