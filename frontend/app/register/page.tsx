'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, ShieldCheck, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/register', form);
            setAuth(res.data.user, res.data.token);
            router.push('/products');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
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

                        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Create your account</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                            Start buying and selling trusted pre-owned products.
                        </p>

                        {error && (
                            <div style={{ marginBottom: 14, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                            <div>
                                <label className="input-label">Full Name</label>
                                <input
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    minLength={2}
                                    className="input-field"
                                />
                            </div>

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
                                        autoComplete="new-password"
                                        placeholder="Create password"
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

                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                                {loading ? 'Creating account...' : <>Continue <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--text-secondary)' }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                Login
                            </Link>
                        </p>
                    </div>

                    <div style={{ background: '#F8FAFF', borderLeft: '1px solid var(--border-color)', padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ margin: 0, color: 'var(--accent-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            ReUseMart Promise
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
