"use client";

import React from 'react';
import { useRole } from '../context/RoleContext';
import LoginPage from '../components/LoginPage';
import AdminDashboard from '../dashboards/AdminDashboard';
import ArchDashboard from '../dashboards/ArchDashboard';
import ForaneDashboard from '../dashboards/ForaneDashboard';
import ParishDashboard from '../dashboards/ParishDashboard';
import SubstationDashboard from '../dashboards/SubstationDashboard';

export default function Home() {
    const { isLoggedIn, role, logout } = useRole();

    if (!isLoggedIn) return <LoginPage />;

    return (
        <div className="min-h-screen bg-[#f1f5f9] font-sans">
            {/* Top Professional Navigation */}
            <nav className="bg-white border-b-2 border-slate-300 p-5 flex justify-between items-center shadow-sm no-print">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                    Accu<span className="text-blue-600">Flow</span>
                </h1>
                <div className="flex items-center gap-4">
                    <span className="hidden md:block text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Session: {role}
                    </span>
                    <button
                        onClick={logout}
                        className="bg-white text-rose-600 border-2 border-rose-600 px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                    >
                        Secure Logout
                    </button>
                </div>
            </nav>

            {/* Logic-based Dashboard Selection */}
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {role === 'admin' && <AdminDashboard />}
                {role === 'arch' && <ArchDashboard />}
                {role === 'forane' && <ForaneDashboard />}
                {role === 'parish' && <ParishDashboard />}
                {role === 'substation' && <SubstationDashboard />}
            </main>

            <footer className="text-center py-10 no-print text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                &copy; 2026 AccuFlow Ecclesiastical Systems | v2.0 Production
            </footer>
        </div>
    );
}
