'use client';

import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
    const steps = [
        { number: 1, title: 'Personal Info' },
        { number: 2, title: 'Verify Email' },
        { number: 3, title: 'Complete Profile' },
    ];

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    <span>STEP {currentStep} OF {totalSteps}</span>
                    <motion.span
                        key={currentStep}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ color: 'var(--accent-primary)' }}
                    >
                        {Math.round((currentStep / totalSteps) * 100)}%
                    </motion.span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    <motion.div
                        className="h-full rounded-full"
                        initial={false}
                        animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        style={{ background: 'var(--accent-primary)' }}
                    />
                </div>
            </div>

            <div className="flex justify-between items-start gap-2">
                {steps.map((step) => {
                    const isCompleted = step.number < currentStep;
                    const isActive = step.number === currentStep;
                    const isInactive = step.number > currentStep;
                    return (
                        <div key={step.number} className="flex flex-col items-center flex-1">
                            <motion.div
                                animate={isActive ? { scale: 1.08 } : isInactive ? { scale: 0.95, opacity: 0.6 } : { scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2"
                                style={isCompleted ? {
                                    background: 'rgba(40, 116, 240, 0.12)',
                                    border: '1.5px solid var(--accent-primary)',
                                    color: 'var(--accent-primary)',
                                } : isActive ? {
                                    background: 'var(--accent-primary)',
                                    border: '1.5px solid var(--accent-primary)',
                                    color: '#ffffff',
                                } : {
                                    background: 'var(--bg-hover)',
                                    border: '1.5px solid var(--border-color)',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                {isCompleted ? 'OK' : step.number}
                            </motion.div>

                            <motion.span
                                animate={{ color: step.number <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                transition={{ duration: 0.2 }}
                                className="text-xs text-center font-medium"
                            >
                                {step.title}
                            </motion.span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
