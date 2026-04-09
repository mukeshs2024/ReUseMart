'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StepTwoProps {
    onSubmit: (data: { otp: string }) => Promise<void>;
    onBack: () => void;
    loading: boolean;
    phone: string;
}

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

export default function StepTwo({ onSubmit, onBack, loading, phone }: StepTwoProps) {
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const validateForm = (): boolean => {
        setOtpError('');

        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            setOtpError('OTP must be 6 digits');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            await onSubmit({ otp });
        }
    };

    const handleResendOtp = () => {
        // In a real app, this would resend OTP
        setResendTimer(30);
        setOtp('');
        setOtpError('');
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <motion.div variants={item}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-primary)' }}>Step 02</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>Verify Your Phone</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    OTP sent to <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{phone}</span>
                </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={item} className="space-y-2">
                    <label className="input-label text-xs font-semibold uppercase tracking-wider">6-Digit OTP</label>
                    <input
                        type="text" value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000" maxLength={6}
                        className="input-field w-full py-4 text-center text-2xl font-mono"
                        style={{
                            letterSpacing: '0.5em',
                            borderColor: otpError ? '#DC2626' : undefined,
                        }}
                    />
                    {otpError && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: '#EF4444' }}>{otpError}</motion.p>}
                </motion.div>

                <motion.div variants={item}
                    className="p-3.5 rounded-xl text-sm"
                    style={{ background: 'rgba(40, 116, 240, 0.06)', border: '1px solid rgba(40, 116, 240, 0.18)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter the 6-digit OTP sent to your phone number to continue.
                    </p>
                </motion.div>

                <motion.div variants={item}>
                    <motion.button
                        type="submit" disabled={loading || otp.length !== 6}
                        whileHover={(loading || otp.length !== 6) ? {} : { scale: 1.02, y: -1 }}
                        whileTap={(loading || otp.length !== 6) ? {} : { scale: 0.95 }}
                        className="btn-primary w-full mt-4 py-3.5 rounded-xl text-sm font-semibold"
                        style={{
                            background: (loading || otp.length !== 6) ? 'rgba(40, 116, 240, 0.45)' : 'var(--accent-primary)',
                        }}
                    >
                        {loading ? 'Verifying...' : 'Verify and Continue'}
                    </motion.button>
                </motion.div>

                <motion.div variants={item} className="text-center">
                    {resendTimer > 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resend in <span style={{ color: 'var(--accent-primary)' }}>{resendTimer}s</span></p>
                    ) : (
                        <button type="button" onClick={handleResendOtp} className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
                            Resend OTP
                        </button>
                    )}
                </motion.div>

                <motion.div variants={item}>
                    <motion.button
                        type="button" onClick={onBack}
                        whileHover={{ backgroundColor: '#F2F6FF' }}
                        whileTap={{ scale: 0.97 }}
                        className="btn-secondary w-full py-3 rounded-xl text-sm"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                        Back
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
}
