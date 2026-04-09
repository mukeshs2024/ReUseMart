'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import api from '@/lib/axios';
import { formatCurrency, formatDistanceToNow } from '@/lib/utils';
import Link from 'next/link';

interface ProductData {
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    createdAt: string;
    seller: { id: string; name: string; email: string };
}

export default function AdminProductsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/admin-secret-login');
            return;
        }
        api.get('/admin/products')
            .then((r) => setProducts(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isAuthenticated, user, router]);

    const filtered = products.filter(
        (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.seller?.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-8 bg-bgPrimary overflow-y-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-textPrimary mb-1">Products</h1>
                        <p className="text-textSecondary text-sm">{products.length} total listings</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                        <input
                            type="text"
                            placeholder="Search products or sellers..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bgCard border border-borderColor text-textPrimary
                         placeholder:text-textMuted text-sm focus:outline-none focus:ring-2 focus:ring-brand-500
                         focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="bg-bgCard border border-borderColor rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-16 bg-bgCard rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-borderColor">
                                        {['Product', 'Price', 'Seller', 'Listed', 'Action'].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left px-5 py-3.5 text-xs font-semibold text-textMuted uppercase tracking-wider"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-borderColor">
                                    {filtered.map((p) => (
                                        <tr key={p.id} className="hover:bg-bgHover transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-bgHover shrink-0">
                                                        <img
                                                            src={p.imageUrl}
                                                            alt={p.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    'https://placehold.co/80x80/1e293b/475569?text=?';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-textPrimary truncate max-w-[200px]">{p.title}</p>
                                                        <p className="text-xs text-textMuted truncate max-w-[200px]">{p.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-brand-400">{formatCurrency(p.price)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="text-sm text-textPrimary">{p.seller?.name}</p>
                                                    <p className="text-xs text-textMuted">{p.seller?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-textSecondary">
                                                {formatDistanceToNow(p.createdAt)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/products/${p.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg text-textMuted hover:text-brand-400 hover:bg-brand-400/10 transition-colors inline-flex"
                                                    title="View listing"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-textMuted text-sm">
                                                No products found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
