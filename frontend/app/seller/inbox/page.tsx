'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { isSellerAccount } from '@/lib/authMode';

export default function SellerInboxPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        if (!isSellerAccount(user)) { router.push('/become-seller'); return; }

        router.replace('/messages');
        setRedirecting(false);
    }, [isAuthenticated, user, router]);

    return redirecting ? null : null;
}
