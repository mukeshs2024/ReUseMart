'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Package, QrCode } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { isSellerAccount } from '@/lib/authMode';
import { formatCurrency } from '@/lib/utils';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    stock: number;
    usageYears: number;
    category: 'ELECTRONICS' | 'MOBILES' | 'FURNITURE' | 'FASHION' | 'ACCESSORIES';
    condition: 'LIKE_NEW' | 'USED' | 'OLD' | 'TOO_OLD';
    imageUrl: string;
    createdAt: string;
    hasPaymentQr?: boolean;
    paymentQrCodeUrl?: string | null;
}

const categoryLabel = (category: Product['category']) => {
    switch (category) {
        case 'MOBILES':
            return 'Mobiles';
        case 'FURNITURE':
            return 'Furniture';
        case 'FASHION':
            return 'Fashion';
        case 'ACCESSORIES':
            return 'Accessories';
        default:
            return 'Electronics';
    }
};

const conditionLabel = (condition: Product['condition']) => {
    switch (condition) {
        case 'LIKE_NEW':
            return 'Like New';
        case 'OLD':
            return 'Old';
        case 'TOO_OLD':
            return 'Too Old';
        default:
            return 'Used';
    }
};

export default function SellerProductsPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [generatingQrId, setGeneratingQrId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        if (!isSellerAccount(user)) { router.push('/become-seller'); return; }
        fetchProducts();
    }, [isAuthenticated, user]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/seller/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/seller/products/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleGenerateQr = async (id: string) => {
        setGeneratingQrId(id);
        try {
            const res = await api.post(`/seller/products/${id}/generate-qr`, {});
            setProducts((prev) =>
                prev.map((product) =>
                    product.id === id
                        ? {
                              ...product,
                              hasPaymentQr: true,
                              paymentQrCodeUrl: res.data.paymentQrCode || res.data.paymentQrCodeUrl,
                          }
                        : product
                )
            );
            alert('Payment QR regenerated successfully.');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to regenerate payment QR');
        } finally {
            setGeneratingQrId(null);
        }
    };

    if (loading) {
        return (
            <div className="py-10 page-container">
                <div className="skeleton h-8 w-40 mb-6" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="py-10">
            <div className="page-container">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="section-title">My Products</h1>
                        <p className="section-sub">{products.length} listing{products.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link href="/seller/products/new" className="btn-primary">
                        <Plus className="w-4 h-4" /> Add Product
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="card p-16 text-center">
                        <Package className="w-14 h-14 text-textMuted mx-auto mb-4" />
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No products yet</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Add your first listing to start selling</p>
                        <Link href="/seller/products/new" className="btn-primary">
                            <Plus className="w-4 h-4" /> Add your first product
                        </Link>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="card overflow-hidden group">
                                <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://placehold.co/400x300/f1f5f9/94a3b8?text=No+Image`;
                                        }}
                                    />
                                    <div className="absolute top-2 right-2">
                                        <span className="text-sm font-bold px-2.5 py-1 rounded-lg"
                                            style={{ background: 'rgba(10,10,10,0.85)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.35)', backdropFilter: 'blur(8px)', fontFamily: 'Orbitron, system-ui, sans-serif' }}>
                                            {formatCurrency(product.price)}
                                        </span>
                                    </div>
                                    {product.hasPaymentQr && (
                                        <div className="absolute top-2 left-2">
                                            <span
                                                className="text-xs font-semibold px-2 py-1 rounded-md inline-flex items-center gap-1"
                                                style={{ background: 'rgba(40, 116, 240, 0.9)', color: '#fff' }}
                                            >
                                                <QrCode className="w-3 h-3" /> QR Ready
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold mb-1 truncate" style={{ fontFamily: 'Orbitron, system-ui, sans-serif', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{product.title}</h3>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                                        Category: {categoryLabel(product.category)}
                                    </p>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                                        Condition: {conditionLabel(product.condition)}
                                    </p>
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                                        Used For: {product.usageYears} {product.usageYears === 1 ? 'year' : 'years'}
                                    </p>
                                    <p className="text-xs mb-2" style={{ color: product.stock > 0 ? 'var(--text-muted)' : '#B91C1C' }}>
                                        Stock: {product.stock}
                                    </p>
                                    <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {product.hasPaymentQr && (
                                            <button
                                                onClick={() => handleGenerateQr(product.id)}
                                                disabled={generatingQrId === product.id}
                                                className="btn-secondary text-sm py-2"
                                                title="Regenerate QR code if you want to change it"
                                            >
                                                <QrCode className="w-3.5 h-3.5" />
                                                {generatingQrId === product.id ? 'Regenerating...' : 'Regenerate QR'}
                                            </button>
                                        )}
                                        <Link
                                            href={`/seller/products/${product.id}/edit`}
                                            className="flex-1 btn-secondary text-sm py-2"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            disabled={deletingId === product.id}
                                            className="btn-danger text-sm py-2 px-3 disabled:opacity-60"
                                        >
                                            {deletingId === product.id
                                                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <Trash2 className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
