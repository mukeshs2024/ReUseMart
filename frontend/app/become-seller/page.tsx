'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { isSellerAccount, isSellerMode } from '@/lib/authMode';
import StepOne from '@/components/seller-onboarding/StepOne';
import StepTwo from '@/components/seller-onboarding/StepTwo';
import StepThree from '@/components/seller-onboarding/StepThree';
import SuccessScreen from '@/components/seller-onboarding/SuccessScreen';
import ProgressIndicator from '@/components/seller-onboarding/ProgressIndicator';

type Step = 1 | 2 | 3 | 'success';

export default function BecomeSellerPage() {
    const { user, updateUser, setAuth } = useAuthStore();
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fullName, setFullName] = useState('');
    const verifiedEmail = user?.email ?? '';

    useEffect(() => {
        if (!user) {
            return;
        }

        if (!isSellerAccount(user)) {
            return;
        }

        if (isSellerMode(user)) {
            router.replace('/seller/dashboard');
            return;
        }

        router.replace('/products');
    }, [user, router]);

    if (isSellerAccount(user)) {
        return null;
    }

    const handleStep1Submit = async (data: { fullName: string }) => {
        setLoading(true);
        setError('');
        try {
            await api.post('/seller/onboard/initiate', { fullName: data.fullName });
            setFullName(data.fullName);
            setCurrentStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to initiate seller registration');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!fullName.trim()) {
            setError('Please complete step 1 before resending OTP');
            throw new Error('Full name is required before resending OTP');
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/seller/onboard/initiate', { fullName });
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to resend OTP';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async (data: { otp: string }) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/seller/onboard/verify-otp', { otp: data.otp });

            if (response.data.token && response.data.user) {
                setAuth(response.data.user, response.data.token);
            } else {
                updateUser({ userType: 'BOTH', isSeller: true, activeMode: 'BUYER' });
            }

            setCurrentStep(3);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleStep3Submit = async (data: { avatarUrl?: string }) => {
        setLoading(true);
        setError('');
        try {
            await api.post('/seller/onboard/complete-profile', { avatarUrl: data.avatarUrl });
            updateUser({ userType: 'BOTH', isSeller: true, activeMode: 'BUYER' });
            setCurrentStep('success');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    const featureItems = ['Instant verification', 'Build your trust score', 'Pro seller benefits', 'Grow your sales'];

    return (
        <div
            className="min-h-screen"
            style={{
                background: 'linear-gradient(180deg, #F3F7FF 0%, var(--bg-primary) 38%, var(--bg-primary) 100%)',
            }}
        >
            <div className="page-container pt-8 pb-12 md:pt-10 md:pb-16">
                <motion.div
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex items-center justify-between"
                >
                    <Link href="/" className="inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                            <Store className="w-5 h-5" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
                            ReUse<span style={{ color: 'var(--accent-primary)' }}>Mart</span>
                        </span>
                    </Link>

                    <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Marketplace
                    </Link>
                </motion.div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <AnimatePresence>
                        {currentStep !== 'success' && (
                            <motion.div
                                initial={{ opacity: 0, x: -22 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -22 }}
                                className="hidden lg:block"
                            >
                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        color: 'var(--accent-primary)',
                                        background: 'rgba(40, 116, 240, 0.08)',
                                        border: '1px solid rgba(40, 116, 240, 0.22)',
                                    }}
                                >
                                    Seller Program
                                </div>

                                <h1 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                    Start Selling
                                    <span className="block" style={{ color: 'var(--accent-primary)' }}>
                                        With Confidence
                                    </span>
                                </h1>

                                <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    Join our marketplace and complete your seller verification in three simple steps.
                                    Build trust, unlock seller tools, and reach more buyers.
                                </p>

                                <div className="mt-8 space-y-3">
                                    {featureItems.map((text, index) => (
                                        <motion.div
                                            key={text}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + index * 0.08 }}
                                        >
                                            <FeatureItem text={text} />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-8 max-w-lg">
                                    <ProgressIndicator currentStep={currentStep as number} totalSteps={3} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`flex items-center justify-center ${currentStep === 'success' ? 'lg:col-span-2' : ''}`}>
                        <div className="w-full max-w-md">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="rounded-2xl p-6 md:p-8"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: 'var(--shadow-lg)',
                                }}
                            >
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="mb-6 p-3 rounded-xl text-sm"
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.06)',
                                                border: '1px solid rgba(239, 68, 68, 0.22)',
                                                color: '#B91C1C',
                                            }}
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={String(currentStep)}
                                        initial={{ x: 12, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -12, opacity: 0 }}
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    >
                                        {currentStep === 1 && <StepOne onSubmit={handleStep1Submit} loading={loading} defaultName={fullName} email={verifiedEmail} />}
                                        {currentStep === 2 && (
                                            <StepTwo
                                                onSubmit={handleStep2Submit}
                                                onBack={() => setCurrentStep(1)}
                                                onResend={handleResendOtp}
                                                loading={loading}
                                                email={verifiedEmail}
                                            />
                                        )}
                                        {currentStep === 3 && <StepThree onSubmit={handleStep3Submit} onBack={() => setCurrentStep(2)} loading={loading} />}
                                        {currentStep === 'success' && <SuccessScreen onContinue={() => router.push('/products')} />}
                                    </motion.div>
                                </AnimatePresence>

                                {currentStep !== 'success' && (
                                    <div className="mt-8 lg:hidden">
                                        <ProgressIndicator currentStep={currentStep as number} totalSteps={3} />
                                    </div>
                                )}
                            </motion.div>

                            {currentStep !== 'success' && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="mt-5 text-center text-xs"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    By continuing, you agree to our{' '}
                                    <a href="#" className="underline" style={{ color: 'var(--accent-primary)' }}>
                                        Terms of Service
                                    </a>
                                </motion.p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <motion.div className="flex items-center gap-3" whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                    background: 'rgba(40, 116, 240, 0.1)',
                    border: '1px solid rgba(40, 116, 240, 0.28)',
                    color: 'var(--accent-primary)',
                }}
            >
                <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                {text}
            </span>
        </motion.div>
    );
}
