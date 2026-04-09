'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isSellerAccount, isSellerMode } from '@/lib/authMode';

interface SellerGuardProps {
    children: ReactNode;
}

export default function SellerGuard({ children }: SellerGuardProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Mark component as hydrated so we know localStorage state has been restored
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        // Only run auth checks after hydration
        if (!isHydrated) return;

        // Check if user is authenticated
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (!isSellerAccount(user)) {
            router.replace('/become-seller');
            return;
        }

    }, [isHydrated, isAuthenticated, user, router]);

    // Show loading screen while hydrating or redirecting unauthenticated/non-seller users.
    if (!isHydrated || !isAuthenticated || !isSellerAccount(user)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-neutral-600">Checking seller access...</p>
                </div>
            </div>
        );
    }

    // Seller account exists, but user must manually switch mode from profile controls.
    if (!isSellerMode(user)) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-xl border bg-white p-6 text-center" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Seller mode is currently off</h2>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Switch to SELLER mode from your profile menu, then open the seller dashboard again.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="btn-primary mt-4"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
