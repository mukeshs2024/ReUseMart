'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

const CATEGORY_OPTIONS = [
    { value: 'ELECTRONICS', label: 'Electronics' },
    { value: 'MOBILES', label: 'Mobiles' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'FASHION', label: 'Fashion' },
    { value: 'ACCESSORIES', label: 'Accessories' },
];

const CONDITION_OPTIONS = [
    { value: 'LIKE_NEW', label: 'Like New' },
    { value: 'USED', label: 'Used' },
    { value: 'OLD', label: 'Old' },
    { value: 'TOO_OLD', label: 'Too Old' },
];

export default function EditProductPage() {
    const { id } = useParams<{ id: string }>();
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        stock: '1',
        usageYears: '0',
        category: 'ELECTRONICS',
        condition: 'USED',
        imageUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        // Load product data from the public API
        api.get(`/products/${id}`)
            .then((res) => {
                const p = res.data;
                // Verify ownership
                if (p.seller.id !== user?.id) {
                    router.push('/seller/products');
                    return;
                }
                setForm({
                    title: p.title,
                    description: p.description,
                    price: String(p.price),
                    stock: String(p.stock ?? 1),
                    usageYears: String(p.usageYears ?? 0),
                    category: p.category || 'ELECTRONICS',
                    condition: p.condition || 'USED',
                    imageUrl: p.imageUrl,
                });
            })
            .catch(() => router.push('/seller/products'))
            .finally(() => setFetching(false));
    }, [id, isAuthenticated, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.put(`/sellers/products/${id}`, {
                ...form,
                price: parseFloat(form.price),
                stock: parseInt(form.stock, 10),
                usageYears: parseInt(form.usageYears, 10),
            });
            router.push('/seller/products');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update product.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="py-10 page-container max-w-2xl">
                <div className="skeleton h-6 w-32 mb-8" />
                <div className="card p-8 space-y-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="py-10">
            <div className="page-container max-w-2xl">
                <Link
                    href="/seller/products"
                    className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFFFFF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9CA3AF'}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to My Products
                </Link>

                <div className="mb-8">
                    <h1 className="section-title">Edit Product</h1>
                    <p className="section-sub">Update your listing details</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg text-sm"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card p-8 space-y-6">
                    <div>
                        <label className="input-label">Product Title *</label>
                        <input
                            type="text"
                            className="input-field"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            minLength={2}
                        />
                    </div>

                    <div>
                        <label className="input-label">Description *</label>
                        <textarea
                            rows={4}
                            className="input-field resize-none"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            required
                            minLength={10}
                        />
                    </div>

                    <div>
                        <label className="input-label">Price (USD) *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
                            <input
                                type="number"
                                className="input-field pl-7"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                                min="0.01"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Available Quantity *</label>
                        <input
                            type="number"
                            className="input-field"
                            value={form.stock}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                            required
                            min="1"
                            step="1"
                        />
                    </div>

                    <div>
                        <label className="input-label">Used For (Years) *</label>
                        <input
                            type="number"
                            className="input-field"
                            value={form.usageYears}
                            onChange={(e) => setForm({ ...form, usageYears: e.target.value })}
                            required
                            min="0"
                            step="1"
                        />
                    </div>

                    <div>
                        <label className="input-label">Category *</label>
                        <select
                            className="input-field"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            required
                        >
                            {CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="input-label">Condition *</label>
                        <select
                            className="input-field"
                            value={form.condition}
                            onChange={(e) => setForm({ ...form, condition: e.target.value })}
                            required
                        >
                            {CONDITION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="input-label">Image URL *</label>
                        <input
                            type="url"
                            className="input-field"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            required
                        />
                        {form.imageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden aspect-video" style={{ border: '1px solid var(--border-color)' }}>
                                <img
                                    src={form.imageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            'https://placehold.co/640x360/111111/444444?text=Invalid+URL';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Link href="/seller/products" className="btn-secondary flex-1">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
