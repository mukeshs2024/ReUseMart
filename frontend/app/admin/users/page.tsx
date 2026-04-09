'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, Shield, UserCheck, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import api from '@/lib/axios';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    userType?: 'BUYER' | 'SELLER' | 'BOTH';
    isSeller: boolean;
    createdAt: string;
    _count: { products: number };
}

export default function AdminUsersPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/admin-secret-login');
            return;
        }
        api.get('/admin/users')
            .then((r) => setUsers(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isAuthenticated, user, router]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this user? This will also remove all their products.')) return;
        setDeletingId(id);
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = users.filter(
        (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-8 bg-bgPrimary overflow-y-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-textPrimary mb-1">Users</h1>
                        <p className="text-textSecondary text-sm">{users.length} registered accounts</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                        <input
                            type="text"
                            placeholder="Search users..."
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
                                <div key={i} className="h-12 bg-bgCard rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-borderColor">
                                        {['User', 'Role', 'Products', 'Joined', 'Actions'].map((h) => (
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
                                    {filtered.map((u) => (
                                        <tr key={u.id} className="hover:bg-bgHover transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-bgHover flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-textSecondary">
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-textPrimary">{u.name}</p>
                                                        <p className="text-xs text-textMuted">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {u.role === 'ADMIN' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-medium">
                                                            <Shield className="w-3 h-3" /> Admin
                                                        </span>
                                                    ) : u.userType === 'BOTH' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full font-medium">
                                                            <UserCheck className="w-3 h-3" /> Buyer + Seller
                                                        </span>
                                                    ) : u.userType === 'SELLER' || u.isSeller ? (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full font-medium">
                                                            <UserCheck className="w-3 h-3" /> Seller
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-bgHover text-textSecondary rounded-full font-medium">
                                                            <UserIcon className="w-3 h-3" /> Buyer
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-textSecondary">
                                                {u._count.products}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-textSecondary">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                {u.role !== 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        disabled={deletingId === u.id}
                                                        className="p-2 rounded-lg text-textMuted hover:text-red-400 hover:bg-red-400/10
                                       transition-colors disabled:opacity-40"
                                                        title="Delete user"
                                                    >
                                                        {deletingId === u.id ? (
                                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-textMuted text-sm">
                                                No users found
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
