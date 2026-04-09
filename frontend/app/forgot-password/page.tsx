'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ShieldCheck, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';

type Step = 'request' | 'reset';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('request');
    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccessMessage(res.data.message || 'Reset code sent to your email');
            setStep('reset');
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                'Failed to request password reset. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                resetCode,
                newPassword,
            });
            setSuccessMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                'Failed to reset password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 100, paddingBottom: 40 }}>
            <div className="page-container" style={{ maxWidth: 980 }}>
                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', overflow: 'hidden' }}>
                    <div style={{ padding: 36 }}>
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 24,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 600,
                                padding: 0,
                            }}
                        >
                            <ChevronLeft size={16} />
                            Back to login
                        </button>

                        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                            {step === 'request' ? 'Reset your password' : 'Enter reset code'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                            {step === 'request'
                                ? 'We will send you a code to reset your password'
                                : 'Enter the code we sent and your new password'}
                        </p>

                        {error && (
                            <div
                                style={{
                                    marginBottom: 14,
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    color: '#B91C1C',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    fontSize: 13,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div
                                style={{
                                    marginBottom: 14,
                                    background: '#F0FDF4',
                                    border: '1px solid #86EFAC',
                                    color: '#166534',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    fontSize: 13,
                                }}
                            >
                                {successMessage}
                            </div>
                        )}

                        {step === 'request' ? (
                            <form onSubmit={handleRequestReset} style={{ display: 'grid', gap: 12 }}>
                                <div>
                                    <label className="input-label">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="input-field"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                    style={{ marginTop: 4 }}
                                >
                                    {loading ? 'Sending code...' : <>Send reset code <ArrowRight size={16} /></>}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 12 }}>
                                <div>
                                    <label className="input-label">Reset Code</label>
                                    <input
                                        type="text"
                                        placeholder="Enter code from email"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                                        required
                                        className="input-field"
                                        maxLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="input-label">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="At least 8 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="input-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="input-field"
                                    />
                                </div>

                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--text-secondary)',
                                        padding: '8px 12px',
                                        background: '#F8FAFF',
                                        borderRadius: 6,
                                        border: '1px solid var(--border-color)',
                                    }}
                                >
                                    • At least 8 characters
                                    <br />• Contains one uppercase letter
                                    <br />• Contains one number
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                    style={{ marginTop: 4 }}
                                >
                                    {loading ? 'Resetting...' : <>Reset Password <ArrowRight size={16} /></>}
                                </button>
                            </form>
                        )}
                    </div>

                    <div
                        style={{
                            background: '#F8FAFF',
                            borderLeft: '1px solid var(--border-color)',
                            padding: 30,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--accent-primary)',
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Security First
                        </p>
                        <h2 style={{ marginTop: 10, fontSize: 24, lineHeight: 1.2, fontWeight: 800 }}>
                            We take your account security seriously
                        </h2>
                        <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 15 }}>
                            Your password is hashed and never stored in plain text.
                        </p>

                        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                            {['Secure Reset Process', 'Encrypted Storage', 'Account Protection'].map((item) => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                                    <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {item}
                                    </span>
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
