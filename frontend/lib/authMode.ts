import type { User } from '@/store/authStore';

export type MarketplaceMode = 'BUYER' | 'SELLER';

export const isSellerAccount = (user: User | null | undefined): boolean => {
    if (!user) {
        return false;
    }

    return user.userType === 'SELLER' || user.userType === 'BOTH' || user.isSeller === true;
};

export const isBuyerAccount = (user: User | null | undefined): boolean => {
    if (!user) {
        return false;
    }

    if (user.userType === 'BUYER' || user.userType === 'BOTH') {
        return true;
    }

    return user.isSeller !== true;
};

export const getActiveMarketplaceMode = (user: User | null | undefined): MarketplaceMode => {
    if (!isSellerAccount(user)) {
        return 'BUYER';
    }

    if (!isBuyerAccount(user)) {
        return 'SELLER';
    }

    return user?.activeMode === 'SELLER' ? 'SELLER' : 'BUYER';
};

export const isSellerMode = (user: User | null | undefined): boolean => {
    return isSellerAccount(user) && getActiveMarketplaceMode(user) === 'SELLER';
};