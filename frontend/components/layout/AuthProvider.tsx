'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

type RestoredUser = {
    isSeller?: boolean;
    userType?: 'BUYER' | 'SELLER' | 'BOTH';
    activeMode?: 'BUYER' | 'SELLER';
    [key: string]: unknown;
};

const normalizeUserType = (userType: RestoredUser['userType'], isSeller?: boolean) => {
    if (userType === 'BUYER' || userType === 'SELLER' || userType === 'BOTH') {
        return userType;
    }

    return isSeller ? 'BOTH' : 'BUYER';
};

const normalizeActiveMode = (userType: 'BUYER' | 'SELLER' | 'BOTH', activeMode?: 'BUYER' | 'SELLER') => {
    if (userType === 'BUYER') {
        return 'BUYER' as const;
    }

    if (userType === 'SELLER') {
        return 'SELLER' as const;
    }

    return activeMode === 'SELLER' ? 'SELLER' : 'BUYER';
};

/**
 * Restores authentication state from localStorage on page load.
 * Ensures axios interceptor has the token ready before any API calls.
 * Must render inside <body>. Produces no visible output.
 */
export function AuthProvider() {
    useEffect(() => {
        // Restore auth state from localStorage
        // The Zustand persist middleware handles this automatically
        const authState = localStorage.getItem('reusemart_auth');
        if (authState) {
            try {
                const parsed = JSON.parse(authState);
                if (parsed.state?.token && parsed.state?.user) {
                    const restoredUser = parsed.state.user as RestoredUser;
                    const userType = normalizeUserType(restoredUser.userType, restoredUser.isSeller === true);
                    // Token is already restored by Zustand persist middleware
                    // This just ensures the state is available immediately
                    useAuthStore.setState({
                        ...parsed.state,
                        user: {
                            ...restoredUser,
                            userType,
                            isSeller: userType === 'SELLER' || userType === 'BOTH',
                            activeMode: normalizeActiveMode(userType, restoredUser.activeMode),
                        },
                    });
                }
            } catch (error) {
                console.error('Failed to restore auth state:', error);
            }
        }
    }, []);

    return null;
}
