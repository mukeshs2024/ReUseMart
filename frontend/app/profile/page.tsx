'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ReceiptText, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDistanceToNow } from '@/lib/utils';

interface PurchaseOrder {
    id: string;
    totalAmount: number;
    quantity: number;
    status: 'PLACED' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    address: {
        fullName: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        id: string;
        quantity: number;
        lineTotal: number;
        product: {
            id: string;
            title: string;
            imageUrl: string;
            price: number;
        };
        seller: {
            id: string;
            name: string;
        };
    }>;
    product: {
        id: string;
        title: string;
        imageUrl: string;
        price: number;
    } | null;
    seller: {
        id: string;
        name: string;
    } | null;
}

interface PurchaseHistoryResponse {
    summary: {
        totalOrders: number;
        totalItemsBought: number;
        totalAmountSpent: number;
    };
    orders: PurchaseOrder[];
}

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<PurchaseHistoryResponse | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        api.get('/seller/orders/history')
            .then((response) => {
                setHistory(response.data);
                setError('');
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Failed to load purchase history');
            })
            .finally(() => setLoading(false));
    }, [isAuthenticated, router]);

    const summary = useMemo(() => {
        return history?.summary || {
            totalOrders: 0,
            totalItemsBought: 0,
            totalAmountSpent: 0,
        };
    }, [history]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 92, paddingBottom: 24 }}>
            <div className="page-container">
                <div className="card" style={{ padding: 16, marginBottom: 14 }}>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>My Profile</h1>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
                        {user?.name} • {user?.email}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Products Bought</p>
                        <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800 }}>
                            {summary.totalItemsBought}
                        </p>
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Orders Placed</p>
                        <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800 }}>
                            {summary.totalOrders}
                        </p>
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Total Amount</p>
                        <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 800 }}>
                            {formatCurrency(summary.totalAmountSpent)}
                        </p>
                    </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Purchase History</h2>
                        <Link href="/products" className="btn-secondary" style={{ textDecoration: 'none', padding: '7px 10px' }}>
                            Buy More
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="skeleton" style={{ height: 84 }} />
                            ))}
                        </div>
                    ) : error ? (
                        <p style={{ margin: 0, color: '#B91C1C', fontWeight: 600 }}>{error}</p>
                    ) : !history || history.orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '18px 0' }}>
                            <ShoppingBag className="w-9 h-9" style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
                            <p style={{ margin: '8px 0 0', fontWeight: 700 }}>No purchases yet</p>
                            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
                                Once you buy products, your order history appears here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                            {history.orders.map((order) => (
                                <article key={order.id} className="card" style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                                    <div>
                                        {order.product ? (
                                            <Link href={`/products/${order.product.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{order.product.title}</h3>
                                            </Link>
                                        ) : (
                                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Checkout order</h3>
                                        )}
                                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                            {order.items.length} item{order.items.length === 1 ? '' : 's'} • {order.address.city}, {order.address.state}
                                        </p>
                                        {order.seller ? (
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                                Seller: {order.seller.name}
                                            </p>
                                        ) : null}
                                        <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <Package className="w-3.5 h-3.5" /> Qty: {order.quantity}
                                            </span>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <ReceiptText className="w-3.5 h-3.5" /> {formatDistanceToNow(order.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 800 }}>{formatCurrency(order.totalAmount)}</p>
                                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
                                            {order.status}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @media (max-width: 860px) {
                        .page-container > div:nth-child(2) {
                            grid-template-columns: 1fr !important;
                        }
                    }

                    @media (max-width: 680px) {
                        article.card {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
