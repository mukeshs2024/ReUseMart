'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface StepOneProps {
    onSubmit: (data: { fullName: string }) => Promise<void>;
    loading: boolean;
    defaultName?: string;
    email: string;
}

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

export default function StepOne({ onSubmit, loading, defaultName = '', email }: StepOneProps) {
    const [fullName, setFullName] = useState(defaultName);
    const [nameError, setNameError] = useState('');

    const validateForm = (): boolean => {
        setNameError('');
        if (fullName.trim().length < 2) { setNameError('Full name must be at least 2 characters'); return false; }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) await onSubmit({ fullName });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <motion.div variants={item}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-primary)' }}>
                    Step 01
                </div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Let&apos;s Get Started
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tell us a bit about yourself</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={item} className="space-y-2">
                    <label className="input-label text-xs font-semibold uppercase tracking-wider">Full Name</label>
                    <input
                        type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="input-field"
                        style={nameError ? { borderColor: '#DC2626' } : undefined}
                    />
                    {nameError && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: '#EF4444' }}>{nameError}</motion.p>}
                </motion.div>

                <motion.div variants={item} className="space-y-2">
                    <label className="input-label text-xs font-semibold uppercase tracking-wider">Verification Email</label>
                    <input
                        type="email"
                        value={email}
                        readOnly
                        className="input-field"
                    />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        We will send a one-time code to this email address.
                    </p>
                </motion.div>

                <motion.div variants={item}>
                    <motion.button
                        type="submit" disabled={loading}
                        whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!loading ? { scale: 0.95 } : {}}
                        className="btn-primary w-full mt-6 py-3.5 rounded-xl text-sm font-semibold"
                        style={{
                            background: loading ? 'rgba(40, 116, 240, 0.45)' : 'var(--accent-primary)',
                        }}
                    >
                        {loading ? 'Processing...' : 'Send OTP'}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
}
