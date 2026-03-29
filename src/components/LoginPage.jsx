import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const LoginPage = () => {
    // Added setCurrentSubstationId to the context destructuring
    const {
        setIsLoggedIn,
        setRole,
        setCurrentForaneId,
        setCurrentParishId,
        setCurrentSubstationId
    } = useRole();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. Authenticate against the custom users table
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !user) {
            setLoading(false);
            alert("Invalid Access Credentials. Please try again.");
            return;
        }

        // 2. Set the Global Role
        setRole(user.role);

        // 3. Handle ID Mapping based on Role
        try {
            if (user.role === 'forane') {
                setCurrentForaneId(user.forane_id);
            }
            else if (user.role === 'parish') {
                setCurrentParishId(user.parish_id);
            }
            else if (user.role === 'substation') {
                setCurrentSubstationId(user.substation_id);

                // CRITICAL: Fetch parent parish_id so substation data rolls up correctly
                const { data: subData, error: subError } = await supabase
                    .from('substations')
                    .select('parish_id')
                    .eq('id', user.substation_id)
                    .single();

                if (!subError && subData) {
                    setCurrentParishId(subData.parish_id);
                }
            }
            // Note: 'admin' and 'arch' roles don't need specific IDs as they see global data

            // 4. Grant Access
            setIsLoggedIn(true);
        } catch (err) {
            console.error("Login Error:", err);
            alert("An error occurred during session setup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9] font-sans p-4">
            <div className="w-full max-w-md">
                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-[#0f172a] tracking-tighter mb-2">
                        Accu<span className="text-blue-600">Flow</span>
                    </h1>
                    <p className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em]">
                        Ecclesiastical Financial Portal
                    </p>
                </div>

                {/* Login Card */}
                <form
                    onSubmit={handleLogin}
                    className="bg-white p-10 rounded-3xl shadow-xl border-2 border-slate-300 transition-all"
                >
                    <div className="mb-8 border-b-2 border-slate-100 pb-4">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sign In</h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Access your authorized jurisdictional dashboard.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* User ID Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1 tracking-widest">
                                User Identification
                            </label>
                            <input
                                type="text"
                                placeholder="Enter assigned ID"
                                className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-bold placeholder:text-slate-300"
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1 tracking-widest">
                                Passkey
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-bold placeholder:text-slate-300"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-700 uppercase tracking-widest hover:text-blue-900"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-5 bg-[#0f172a] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {loading ? "AUTHENTICATING..." : "ACCESS DASHBOARD"}
                        </button>
                    </div>

                    {/* Security Disclaimer */}
                    <div className="mt-8 pt-6 border-t-2 border-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic">
                            Authorized Access Only. All transactions are logged for audit.
                        </p>
                    </div>
                </form>

                {/* Project Credit */}
                <p className="text-center mt-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    © 2026 AccuFlow Systems | Ecclesiastical Division
                </p>
            </div>
        </div>
    );
};

export default LoginPage;