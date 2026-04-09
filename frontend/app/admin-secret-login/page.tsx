'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function AdminLoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            if (res.data.user.role !== 'ADMIN') {
                setError('Access denied. Admin credentials required.');
                return;
            }
            setAuth(res.data.user, res.data.token);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bgPrimary">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-14 h-14 bg-brand-600/20 border border-brand-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-7 h-7 text-brand-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-textPrimary mb-1">Admin Portal</h1>
                    <p className="text-textSecondary text-sm">Restricted access — authorized personnel only</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-textSecondary mb-1.5">Email address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-lg bg-bgCard border border-borderColor text-textPrimary
                         placeholder:text-textMuted text-sm focus:outline-none focus:ring-2
                         focus:ring-brand-500 focus:border-transparent transition-all"
                            placeholder="admin@reusemart.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            id="admin-email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textSecondary mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="w-full px-4 py-3 pr-11 rounded-lg bg-bgCard border border-borderColor text-textPrimary
                           placeholder:text-textMuted text-sm focus:outline-none focus:ring-2
                           focus:ring-brand-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                id="admin-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textSecondary transition-colors"
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg
                       transition-all duration-200 flex items-center justify-center gap-2
                       disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        id="admin-login-btn"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                Access Admin Panel
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-xs text-textMuted">
                    This portal is for authorized administrators only.
                    <br />Unauthorized access attempts are logged.
                </p>
            </div>
        </div>
    );
}
