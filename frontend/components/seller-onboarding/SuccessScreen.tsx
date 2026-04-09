'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, ShieldCheck, Store } from 'lucide-react';

interface SuccessScreenProps {
    onContinue: () => void;
}

const listContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
};
const listItem = {
    hidden: { opacity: 0, x: -12 },
    show:   { opacity: 1,  x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export default function SuccessScreen({ onContinue }: SuccessScreenProps) {
    const nextSteps = [
        'Set up your seller profile',
        'Add your first product listing',
        'Respond to buyer messages',
        'Earn badges and grow your trust',
    ];

    return (
        <div className="space-y-8 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{
                    background: 'rgba(40, 116, 240, 0.1)',
                    border: '1.5px solid rgba(40, 116, 240, 0.35)',
                    color: 'var(--accent-primary)',
                }}
            >
                <BadgeCheck className="w-10 h-10" />
            </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="space-y-3"
                >
                    <h2 className="text-3xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>
                        You&apos;re Now a <span style={{ color: 'var(--accent-primary)' }}>Trusted Seller</span>
                    </h2>
                    <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Welcome to ReUse Mart. Your account is now buyer + seller. You can switch to seller mode anytime from profile.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.35 }}
                    className="grid grid-cols-3 gap-3 py-6"
                    style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
                >
                    {[
                        { value: '75', label: 'Trust' },
                        { value: 'OK', label: 'Verified' },
                        { value: '0', label: 'Products' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + i * 0.08 }}
                            className="space-y-1"
                        >
                            <div className="text-2xl font-extrabold" style={{ color: 'var(--accent-primary)' }}>{stat.value}</div>
                            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-5 text-left space-y-3"
                    style={{ background: 'var(--bg-hover)', border: '1px solid rgba(40, 116, 240, 0.14)' }}
                >
                    <h3 className="font-bold uppercase text-xs tracking-widest" style={{ color: 'var(--accent-primary)' }}>What&apos;s Next?</h3>
                    <motion.ul variants={listContainer} initial="hidden" animate="show" className="space-y-2">
                        {nextSteps.map((step) => (
                            <motion.li key={step} variants={listItem} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                                    style={{ background: 'rgba(40, 116, 240, 0.12)', border: '1px solid rgba(40, 116, 240, 0.3)', color: 'var(--accent-primary)' }}
                                >
                                    <ShieldCheck className="w-3 h-3" />
                                </motion.span>
                                {step}
                            </motion.li>
                        ))}
                    </motion.ul>
                </motion.div>

                <motion.button
                    onClick={onContinue}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary w-full py-3.5 rounded-xl text-sm font-semibold"
                    style={{
                        background: 'var(--accent-primary)',
                    }}
                >
                    <span className="inline-flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        Continue to Marketplace
                    </span>
                </motion.button>
        </div>
    );
}
