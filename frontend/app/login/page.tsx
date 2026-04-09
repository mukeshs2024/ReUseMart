'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, ShieldCheck, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [form, setForm]         = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Load remembered email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('reusemart_remembered_email');
        if (savedEmail) {
            setForm(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Save email if "Remember me" is checked
            if (rememberMe) {
                localStorage.setItem('reusemart_remembered_email', form.email);
            } else {
                localStorage.removeItem('reusemart_remembered_email');
            }

            const res = await api.post('/auth/login', form);
            setAuth(res.data.user, res.data.token);
            router.push('/products');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 100, paddingBottom: 40 }}>
            <div className="page-container" style={{ maxWidth: 980 }}>
                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', overflow: 'hidden' }}>
                    <div style={{ padding: 36 }}>
                        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18, textDecoration: 'none' }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
                                <ShoppingBag className="w-4 h-4 text-white" />
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Reuse<span style={{ color: 'var(--accent-primary)' }}>Mart</span></span>
                        </Link>

                        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Login to your account</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                            Continue your smart second-hand shopping journey.
                        </p>

                        {error && (
                            <div style={{ marginBottom: 14, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                            <div>
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="input-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="Enter password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        className="input-field"
                                        style={{ paddingRight: 36 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                                    />
                                    <label htmlFor="rememberMe" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                                        Remember me
                                    </label>
                                </div>
                                <Link
                                    href="/forgot-password"
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--accent-primary)',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                                {loading ? 'Signing in...' : <>Continue <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--text-secondary)' }}>
                            New to ReUseMart?{' '}
                            <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                Create account
                            </Link>
                        </p>
                    </div>

                    <div style={{ background: '#F8FAFF', borderLeft: '1px solid var(--border-color)', padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--accent-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Why ReUseMart
                        </p>
                        <h2 style={{ marginTop: 10, fontSize: 24, lineHeight: 1.2, fontWeight: 800 }}>
                            Buy & sell pre-owned products safely
                        </h2>
                        <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 15 }}>
                            Verified sellers. Better prices.
                        </p>

                        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                            {['Verified Sellers', 'Buyer Protection', 'Secure Payments'].map((item) => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                                    <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @media (max-width: 900px) {
                        .card {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
