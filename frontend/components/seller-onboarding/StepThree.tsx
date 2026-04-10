'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepThreeProps {
    onSubmit: (data: { avatarUrl?: string }) => Promise<void>;
    onBack: () => void;
    loading: boolean;
}

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

export default function StepThree({ onSubmit, onBack, loading }: StepThreeProps) {
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarError, setAvatarError] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setAvatarError('Image must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setImagePreview(result);
                // Local preview URL is used until media upload storage is integrated.
                setAvatarUrl(result);
                setAvatarError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ avatarUrl: avatarUrl || undefined });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <motion.div variants={item}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-primary)' }}>Step 03</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>Complete Profile</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add a profile picture (optional)</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={item} className="space-y-2">
                    <label className="input-label text-xs font-semibold uppercase tracking-wider">Profile Picture</label>
                    <div className="relative">
                        {imagePreview ? (
                            <div className="relative w-full aspect-square rounded-xl overflow-hidden"
                                style={{ border: '1.5px solid rgba(40, 116, 240, 0.22)' }}>
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                                    <Camera className="w-8 h-8 text-white" />
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>
                        ) : (
                            <motion.label
                                className="flex w-full cursor-pointer items-center justify-center rounded-xl"
                                style={{ aspectRatio: '4/3', background: 'var(--bg-card)', border: '1.5px dashed var(--border-color)' }}
                                whileHover={{ borderColor: 'rgba(40, 116, 240, 0.4)', backgroundColor: 'rgba(40, 116, 240, 0.04)' }}
                            >
                                <div className="text-center space-y-2">
                                    <motion.div whileHover={{ scale: 1.12 }}>
                                        <Camera className="w-8 h-8 mx-auto" style={{ color: '#4B5563' }} />
                                    </motion.div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Click to upload</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>or drag and drop</p>
                                    </div>
                                </div>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </motion.label>
                        )}
                    </div>
                    {avatarError && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: '#EF4444' }}>{avatarError}</motion.p>}
                    <p className="text-xs" style={{ color: '#4B5563' }}>JPG, PNG, or GIF. Max 5MB.</p>
                </motion.div>

                <motion.div variants={item}
                    className="p-3.5 rounded-xl"
                    style={{ background: 'rgba(40, 116, 240, 0.06)', border: '1px solid rgba(40, 116, 240, 0.18)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Email verified.</span> One step away from becoming a trusted seller.
                    </p>
                </motion.div>

                <motion.div variants={item}>
                    <motion.button
                        type="submit" disabled={loading}
                        whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!loading ? { scale: 0.95 } : {}}
                        className="btn-primary w-full mt-4 py-3.5 rounded-xl text-sm font-semibold"
                        style={{
                            background: loading ? 'rgba(40, 116, 240, 0.45)' : 'var(--accent-primary)',
                        }}
                    >
                        {loading ? 'Completing Setup...' : 'Complete Registration'}
                    </motion.button>
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

            <motion.div variants={item} className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Your Trust Journey</h3>
                <ul className="space-y-1.5">
                    {[
                        'Email verified -> Trust score: 50',
                        'Profile completed -> Trust score: 75',
                        'Pro Seller Badge at 80+ score',
                    ].map((text, i) => (
                        <motion.li
                            key={text}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.08 }}
                            className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}
                        >
                            <span style={{ color: 'var(--accent-primary)' }}>-</span> {text}
                        </motion.li>
                    ))}
                </ul>
            </motion.div>
        </motion.div>
    );
}
