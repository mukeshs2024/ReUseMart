'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Inbox, ListChecks, Plus, Wallet, BadgeCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '@/lib/axios';
import { getChatSocket, type LiveOrderPlaced } from '@/lib/chatSocket';
import { useAuthStore } from '@/store/authStore';
import { isSellerAccount } from '@/lib/authMode';
import { formatCurrency } from '@/lib/utils';

interface Product {
    id: string;
    title: string;
    price: number;
    createdAt: string;
}

interface AnalyticsData {
    totalRevenue: number;
    totalCompletedSales: number;
    totalActiveListings: number;
    monthlyRevenue: { month: string; revenue: number }[];
    topBuyers: { buyerId: string; buyerName: string; totalQuantity: number; totalSpent: number }[];
}

export default function SellerDashboardPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        const [productsRes, analyticsRes] = await Promise.all([
            api.get('/sellers/products'),
            api.get('/sellers/analytics'),
        ]);

        setProducts(productsRes.data);
        setAnalytics(analyticsRes.data);
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

        fetchDashboardData()
            .catch(console.error)
            .finally(() => setLoading(false));

        const intervalId = setInterval(() => {
            void fetchDashboardData().catch(() => {});
        }, 20_000);

        const token = typeof window !== 'undefined' ? localStorage.getItem('reusemart_token') : null;
        const socket = token ? getChatSocket(token) : null;

        const onOrderPlaced = (event: LiveOrderPlaced) => {
            if (event.sellerId !== user?.id) {
                return;
            }

            void fetchDashboardData().catch(() => {});
        };

        if (socket) {
            socket.on('order:placed', onOrderPlaced);
        }

        return () => {
            clearInterval(intervalId);
            if (socket) {
                socket.off('order:placed', onOrderPlaced);
            }
        };
    }, [isAuthenticated, user?.id, router]);

    const portfolioValue = products.reduce((sum, p) => sum + p.price, 0);
    const completedSalesCount = analytics?.totalCompletedSales ?? 0;
    const currentMonthRevenue = analytics?.monthlyRevenue[analytics.monthlyRevenue.length - 1]?.revenue ?? 0;

    if (loading) {
        return (
            <div className="page-container" style={{ paddingTop: 96 }}>
                <div className="skeleton" style={{ height: 180 }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 88, paddingBottom: 20 }}>
            <div className="page-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                    <div>
                        <h1 className="section-title">Seller Dashboard</h1>
                        <p className="section-sub">Manage listings, messages, and sales summary</p>
                    </div>
                    <Link href="/seller/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus className="w-4 h-4" /> Add Product
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 14 }}>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>My Listings</p>
                        <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 24 }}>{products.length}</p>
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Sales Summary</p>
                        <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 24 }}>{formatCurrency(analytics?.totalRevenue ?? 0)}</p>
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>Account Trust</p>
                        <p style={{ margin: '6px 0 0', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                            <BadgeCheck className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} /> Verified Seller
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                    <Link href="/seller/products" className="card-hover" style={{ padding: 14, textDecoration: 'none' }}>
                        <p style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, color: 'var(--text-primary)' }}>
                            <ListChecks className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> My Listings
                        </p>
                        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>Update price, stock, and details.</p>
                    </Link>
                    <Link href="/seller/products/new" className="card-hover" style={{ padding: 14, textDecoration: 'none' }}>
                        <p style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, color: 'var(--text-primary)' }}>
                            <Plus className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Add Product
                        </p>
                        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>Create a new listing quickly.</p>
                    </Link>
                    <Link href="/seller/inbox" className="card-hover" style={{ padding: 14, textDecoration: 'none' }}>
                        <p style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, color: 'var(--text-primary)' }}>
                            <Inbox className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Messages
                        </p>
                        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>Respond to buyer queries.</p>
                    </Link>
                    <div className="card" style={{ padding: 14 }}>
                        <p style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, color: 'var(--text-primary)' }}>
                            <Wallet className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Sales Summary
                        </p>
                        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                            Revenue: {formatCurrency(analytics?.totalRevenue ?? 0)}
                        </p>
                    </div>
                </div>

                <div className="card" style={{ padding: 14, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Sales Summary</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 12 }}>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Revenue</p>
                            <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 20 }}>{formatCurrency(analytics?.totalRevenue ?? 0)}</p>
                        </div>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Current Month</p>
                            <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 20 }}>{formatCurrency(currentMonthRevenue)}</p>
                        </div>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Total Units Sold</p>
                            <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 20 }}>{completedSalesCount}</p>
                        </div>
                    </div>

                    {!analytics || analytics.monthlyRevenue.every((item) => item.revenue === 0) ? (
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>No sales yet to chart.</p>
                    ) : (
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        formatter={(val) => [formatCurrency(Number(val)), 'Revenue']}
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#2563EB" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 14, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Top Buyers</h2>
                    {!analytics || analytics.topBuyers.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No buyers yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {analytics.topBuyers.map((buyer) => (
                                <div
                                    key={buyer.buyerId}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        padding: '8px 10px',
                                        background: '#fff',
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{buyer.buyerName}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                                            Quantity bought: {buyer.totalQuantity}
                                        </p>
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(buyer.totalSpent)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Recent Listings</h2>
                    {products.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No listings yet. Add your first product.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {products.slice(0, 6).map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{item.title}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(item.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(item.price)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
