'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { isSellerAccount } from '@/lib/authMode';

export default function SellerOffersPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOffers = async () => {
        try {
            const res = await api.get('/seller/offers');
            setOffers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!isSellerAccount(user)) {
            router.push('/become-seller');
            return;
        }
        void fetchOffers().finally(() => setLoading(false));
    }, [isAuthenticated, user]);

    const respond = async (id: string, action: 'accept' | 'decline') => {
        try {
            await api.post(`/seller/offers/${id}/${action}`);
            await fetchOffers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed');
        }
    };

    if (loading) return <div className="page-container" style={{ paddingTop: 96 }}><div className="skeleton" style={{ height: 200 }} /></div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 88, paddingBottom: 40 }}>
            <div className="page-container">
                <h1 className="section-title">My Offers</h1>
                <p className="section-sub">Offers made by buyers for your listings</p>

                {offers.length === 0 ? (
                    <div className="card" style={{ padding: 14, marginTop: 12 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No offers yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        {offers.map((o) => (
                            <div key={o.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{o.product.title}</p>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{o.buyer.name} offered ₹{o.price}</p>
                                    {o.message && <p style={{ margin: '6px 0 0', fontSize: 13 }}>{o.message}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {o.status === 'PENDING' && (
                                        <>
                                            <button className="btn-primary" onClick={() => respond(o.id, 'accept')}>Accept</button>
                                            <button className="btn-secondary" onClick={() => respond(o.id, 'decline')}>Decline</button>
                                        </>
                                    )}
                                    {o.status !== 'PENDING' && <span style={{ fontWeight: 700 }}>{o.status}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
