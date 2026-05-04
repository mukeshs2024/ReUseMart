'use client';

interface CheckoutStepsProps {
    currentStep: 1 | 2 | 3;
}

const steps = [
    { id: 1, label: 'Cart' },
    { id: 2, label: 'Address' },
    { id: 3, label: 'Payment' },
] as const;

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {steps.map((step) => {
                const completed = currentStep > step.id;
                const active = currentStep === step.id;

                return (
                    <div
                        key={step.id}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                            completed
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : active
                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                    : 'border-gray-200 bg-white text-gray-500'
                        }`}
                    >
                        <span className="block text-[11px] uppercase tracking-[0.18em] opacity-70">Step {step.id}</span>
                        <span>{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
}