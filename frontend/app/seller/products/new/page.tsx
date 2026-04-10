'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
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

export default function NewProductPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        stock: '1',
        category: 'ELECTRONICS',
        condition: 'USED',
        imageUrl: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/seller/products', {
                ...form,
                price: parseFloat(form.price),
                stock: parseInt(form.stock, 10),
            });
            router.push('/seller/products');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create product.');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="section-title">Add New Product</h1>
                    <p className="section-sub">Fill in the details for your new listing</p>
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
                            placeholder="e.g. Vintage Leather Jacket"
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
                            placeholder="Describe your product â€” condition, size, any notable details..."
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
                                placeholder="0.00"
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
                            placeholder="1"
                            value={form.stock}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                            required
                            min="1"
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
                            placeholder="https://example.com/image.jpg"
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
                                            'https://placehold.co/640x360/f1f5f9/94a3b8?text=Invalid+URL';
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
                            id="create-product-btn"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Create Listing
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
