import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRole } from '../context/RoleContext';

const LoginPage = () => {
    const { setIsLoggedIn, setRole, setCurrentForaneId, setCurrentParishId } = useRole();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        setLoading(false);

        if (user) {
            setRole(user.role);
            if (user.role === 'forane') setCurrentForaneId(user.forane_id);
            if (user.role === 'parish') setCurrentParishId(user.parish_id);
            setIsLoggedIn(true);
        } else {
            alert("Invalid User ID or Password");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f1f5f9] font-sans p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-[#0f172a] tracking-tighter mb-2">
                        Accu<span className="text-blue-600">Flow</span>
                    </h1>
                    <p className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em]">
                        Ecclesiastical Financial Portal
                    </p>
                </div>

                {/* Login Card with defined borders */}
                <form
                    onSubmit={handleLogin}
                    className="bg-white p-10 rounded-3xl shadow-xl border-2 border-slate-300"
                >
                    <div className="mb-8 border-b-2 border-slate-100 pb-4">
                        <h2 className="text-2xl font-black text-slate-800">Sign In</h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">Please enter your authorized credentials.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">
                                User ID
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your ID"
                                className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-medium"
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full p-4 bg-white border-2 border-slate-400 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-medium"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-700 uppercase tracking-wider"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-4 bg-[#0f172a] text-white rounded-xl font-black text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {loading ? "AUTHENTICATING..." : "ACCESS DASHBOARD"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;