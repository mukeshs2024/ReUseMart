'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Package, UserCheck, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
    stats: { totalUsers: number; totalProducts: number; totalSellers: number };
    recentUsers: {
        id: string; name: string; email: string;
        role: string; userType?: 'BUYER' | 'SELLER' | 'BOTH'; isSeller: boolean; createdAt: string;
    }[];
    recentProducts: {
        id: string; title: string; price: number;
        createdAt: string; seller: { name: string };
    }[];
}

export default function AdminDashboardPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/admin-secret-login'); return; }
        if (user?.role !== 'ADMIN') { router.push('/admin-secret-login'); return; }
        api.get('/admin/dashboard')
            .then((r) => setData(r.data))
            .catch(() => router.push('/admin-secret-login'))
            .finally(() => setLoading(false));
    }, [isAuthenticated, user, router]);

    const statCards = data
        ? [
            { label: 'Total Users', value: data.stats.totalUsers, icon: Users, color: 'text-blue-400 bg-blue-400/10' },
            { label: 'Active Sellers', value: data.stats.totalSellers, icon: UserCheck, color: 'text-brand-400 bg-brand-400/10' },
            { label: 'Total Products', value: data.stats.totalProducts, icon: Package, color: 'text-purple-400 bg-purple-400/10' },
            {
                label: 'Buyer/Seller Ratio',
                value: `${data.stats.totalSellers}/${data.stats.totalUsers}`,
                icon: TrendingUp,
                color: 'text-amber-400 bg-amber-400/10',
            },
        ]
        : [];

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-8 bg-bgPrimary overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-textPrimary mb-1">Dashboard</h1>
                    <p className="text-textSecondary text-sm">Platform overview and key metrics</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-28 rounded-xl bg-bgCard animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            {statCards.map((card) => (
                                <div
                                    key={card.label}
                                    className="bg-bgCard border border-borderColor rounded-xl p-5"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-2xl font-bold text-textPrimary mb-0.5">{card.value}</div>
                                    <div className="text-xs text-textMuted">{card.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Recent Users */}
                            <div className="bg-bgCard border border-borderColor rounded-xl">
                                <div className="px-5 py-4 border-b border-borderColor flex items-center justify-between">
                                    <h2 className="font-semibold text-textPrimary">Recent Users</h2>
                                    <a href="/admin/users" className="text-xs text-brand-400 hover:text-brand-300">View all →</a>
                                </div>
                                <div className="divide-y divide-borderColor">
                                    {data!.recentUsers.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-bgHover flex items-center justify-center">
                                                    <span className="text-xs font-medium text-textSecondary">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-textPrimary">{u.name}</p>
                                                    <p className="text-xs text-textMuted">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {u.role !== 'ADMIN' && u.userType === 'BOTH' && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full font-medium">
                                                        Buyer + Seller
                                                    </span>
                                                )}
                                                {u.role !== 'ADMIN' && (u.userType === 'SELLER' || u.isSeller) && u.userType !== 'BOTH' && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full font-medium">
                                                        Seller
                                                    </span>
                                                )}
                                                {u.role === 'ADMIN' && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-medium">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Products */}
                            <div className="bg-bgCard border border-borderColor rounded-xl">
                                <div className="px-5 py-4 border-b border-borderColor flex items-center justify-between">
                                    <h2 className="font-semibold text-textPrimary">Recent Products</h2>
                                    <a href="/admin/products" className="text-xs text-brand-400 hover:text-brand-300">View all →</a>
                                </div>
                                <div className="divide-y divide-borderColor">
                                    {data!.recentProducts.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between px-5 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-textPrimary">{p.title}</p>
                                                <p className="text-xs text-textMuted">by {p.seller?.name}</p>
                                            </div>
                                            <span className="text-sm font-bold text-brand-400">{formatCurrency(p.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
