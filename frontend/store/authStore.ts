'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserType = 'BUYER' | 'SELLER' | 'BOTH';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    userType: UserType;
    isSeller: boolean;
    activeMode: 'BUYER' | 'SELLER';
    isPhoneVerified?: boolean;
    trustScore?: number;
    sellerLevel?: 'BASIC' | 'VERIFIED' | 'TRUSTED' | 'PRO';
    avatarUrl?: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    updateUser: (user: Partial<User>) => void;
    setActiveMode: (mode: 'BUYER' | 'SELLER') => void;
    logout: () => void;
}

const normalizeUserType = (userType: UserType | undefined, isSeller?: boolean): UserType => {
    if (userType === 'BUYER' || userType === 'SELLER' || userType === 'BOTH') {
        return userType;
    }

    return isSeller ? 'BOTH' : 'BUYER';
};

const canUseSellerMode = (userType: UserType): boolean => {
    return userType === 'SELLER' || userType === 'BOTH';
};

const canUseBuyerMode = (userType: UserType): boolean => {
    return userType === 'BUYER' || userType === 'BOTH';
};

const normalizeActiveMode = (userType: UserType, activeMode?: User['activeMode']): User['activeMode'] => {
    if (!canUseSellerMode(userType)) {
        return 'BUYER';
    }

    if (!canUseBuyerMode(userType)) {
        return 'SELLER';
    }

    return activeMode === 'SELLER' ? 'SELLER' : 'BUYER';
};

const normalizeUser = (user: User): User => {
    const userType = normalizeUserType(user.userType, user.isSeller);
    const isSeller = canUseSellerMode(userType);

    return {
        ...user,
        userType,
        isSeller,
        activeMode: normalizeActiveMode(userType, user.activeMode),
    };
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                localStorage.setItem('reusemart_token', token);
                set({
                    user: normalizeUser(user),
                    token,
                    isAuthenticated: true,
                });
            },

            updateUser: (updated) =>
                set((state) => {
                    if (!state.user) {
                        return { user: null };
                    }

                    const merged = { ...state.user, ...updated };
                    return {
                        user: normalizeUser(merged),
                    };
                }),

            setActiveMode: (mode) =>
                set((state) => {
                    if (!state.user) {
                        return { user: null };
                    }

                    const nextMode = mode === 'SELLER'
                        ? (canUseSellerMode(state.user.userType) ? 'SELLER' : 'BUYER')
                        : (canUseBuyerMode(state.user.userType) ? 'BUYER' : 'SELLER');

                    return {
                        user: { ...state.user, activeMode: nextMode },
                    };
                }),

            logout: () => {
                localStorage.removeItem('reusemart_token');
                localStorage.removeItem('reusemart_auth');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'reusemart_auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
