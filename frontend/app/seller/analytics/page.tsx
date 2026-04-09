'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, Package, BarChart3, ShoppingBag } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import api from '@/lib/axios';
import { getChatSocket, type LiveOrderPlaced } from '@/lib/chatSocket';
import { useAuthStore } from '@/store/authStore';
import { isSellerAccount } from '@/lib/authMode';
import { formatCurrency } from '@/lib/utils';

interface TopListing {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    createdAt: string;
}

interface RecentOrder {
    id: string;
    amount: number;
    quantity: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    product: { id: string; title: string; imageUrl: string };
    buyer: { id: string; name: string };
}

interface AnalyticsData {
    totalActiveListings: number;
    totalRevenue: number;
    portfolioValue: number;
    avgPrice: number;
    maxPrice: number;
    priceRanges: { name: string; count: number }[];
    monthlyRevenue: { month: string; revenue: number }[];
    topListings: TopListing[];
    recentOrders: RecentOrder[];
}

const COLORS = ['#22C55E', '#2563EB', '#EF4444', '#FF9500', '#8b5cf6'];

const STATUS_STYLES: Record<string, React.CSSProperties> = {
    COMPLETED: { color: '#22C55E', background: 'rgba(34,197,94,0.1)' },
    PENDING:   { color: '#FF9500', background: 'rgba(255,149,0,0.1)' },
    CANCELLED: { color: '#EF4444', background: 'rgba(239,68,68,0.1)' },
};

export default function SellerAnalyticsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        const response = await api.get<AnalyticsData>('/seller/analytics');
        setData(response.data);
        setError('');
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        if (!isSellerAccount(user)) { router.push('/become-seller'); return; }

        fetchAnalytics()
            .catch(() => setError('Failed to load analytics'))
            .finally(() => setLoading(false));

        const intervalId = setInterval(() => {
            void fetchAnalytics().catch(() => {});
        }, 20_000);

        const token = typeof window !== 'undefined' ? localStorage.getItem('reusemart_token') : null;
        const socket = token ? getChatSocket(token) : null;

        const onOrderPlaced = (event: LiveOrderPlaced) => {
            if (event.sellerId !== user?.id) {
                return;
            }

            void fetchAnalytics().catch(() => {});
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

    if (loading) {
        return (
            <div className="py-10 page-container">
                <div className="skeleton h-8 w-40 mb-8" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
                </div>
                <div className="skeleton h-64 rounded-xl" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="py-10 page-container">
                <div className="card p-10 text-center" style={{ color: '#EF4444' }}>
                    {error || 'No data available'}
                </div>
            </div>
        );
    }

    const statsCards = [
        {
            label: 'Active Listings',
            value: data.totalActiveListings,
            icon: Package,
            color: 'text-[#2563EB] bg-[#2563EB]/10',
        },
        {
            label: 'Total Revenue',
            value: formatCurrency(data.totalRevenue),
            icon: DollarSign,
            color: 'text-[#22C55E] bg-[#22C55E]/10',
        },
        {
            label: 'Portfolio Value',
            value: formatCurrency(data.portfolioValue),
            icon: BarChart3,
            color: 'text-[#FF9500] bg-[#FF9500]/10',
        },
        {
            label: 'Avg Listing Price',
            value: formatCurrency(data.avgPrice),
            icon: TrendingUp,
            color: 'text-[#EF4444] bg-[#EF4444]/10',
        },
    ];

    return (
        <div className="py-10">
            <div className="page-container">
                <div className="mb-8">
                    <h1 className="section-title">Analytics</h1>
                    <p className="section-sub">Real-time overview of your seller performance</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((stat) => (
                        <div key={stat.label} className="card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Monthly Revenue Line Chart */}
                    <div className="lg:col-span-2 card p-6">
                        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Monthly Revenue</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>All non-cancelled orders - last 6 months</p>
                        {data.monthlyRevenue.every((m) => m.revenue === 0) ? (
                            <div className="flex items-center justify-center h-56 text-sm" style={{ color: 'var(--text-muted)' }}>
                                No completed orders yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={data.monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false}
                                        tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#2563EB"
                                        strokeWidth={2.5}
                                        dot={{ fill: '#2563EB', strokeWidth: 0, r: 4 }}
                                        activeDot={{ r: 6, fill: '#2563EB' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Price Distribution */}
                    <div className="card p-6">
                        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Price Distribution</h2>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Listings by price range</p>
                        {data.priceRanges.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={data.priceRanges}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            dataKey="count"
                                            paddingAngle={3}
                                        >
                                            {data.priceRanges.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: 12, borderRadius: 8, color: 'var(--text-primary)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-2 space-y-1.5">
                                    {data.priceRanges.map((r, i) => (
                                        <div key={r.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                                <span style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                                            </div>
                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--text-muted)' }}>
                                No listings yet
                            </div>
                        )}
                    </div>

                    {/* Revenue Bar Chart */}
                    <div className="lg:col-span-3 card p-6">
                        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Revenue Trend</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Monthly non-cancelled order revenue</p>
                        {data.monthlyRevenue.every((m) => m.revenue === 0) ? (
                            <div className="flex items-center justify-center h-52 text-sm" style={{ color: 'var(--text-muted)' }}>
                                No revenue data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={data.monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false}
                                        tickFormatter={(v) => `$${v}`} />
                                    <Tooltip
                                        formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top listings */}
                <div className="mt-6 card">
                    <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <TrendingUp className="w-4 h-4" style={{ color: '#22C55E' }} />
                        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Top 5 Listings by Price</h2>
                    </div>
                    {data.topListings.length === 0 ? (
                        <div className="p-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No listings yet</div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                            {data.topListings.map((product, i) => (
                                <div key={product.id} className="flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.title}</span>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: '#22C55E' }}>
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent orders */}
                <div className="mt-6 mb-6 card">
                    <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <ShoppingBag className="w-4 h-4" style={{ color: '#2563EB' }} />
                        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Orders</h2>
                    </div>
                    {data.recentOrders.length === 0 ? (
                        <div className="p-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet</div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                            {data.recentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.product.title}</span>
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            Buyer: {order.buyer.name} &middot; Qty: {order.quantity} &middot; {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold" style={{ color: '#22C55E' }}>
                                            {formatCurrency(order.amount)}
                                        </span>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                                            style={STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
