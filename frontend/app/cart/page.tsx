'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { isBuyerAccount, isSellerMode } from '@/lib/authMode';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const clearCart = useCartStore((state) => state.clearCart);

    const [error, setError] = useState('');

    const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
    const hasOutOfStockItems = useMemo(() => items.some((item) => item.availableStock <= 0), [items]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 92, paddingBottom: 24 }}>
            <div className="page-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>My Cart</h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{totalItems} item{totalItems === 1 ? '' : 's'}</p>
                    </div>
                    <Link href="/products" className="btn-secondary" style={{ textDecoration: 'none' }}>
                        Continue Shopping
                    </Link>
                </div>

                {error && (
                    <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: 'rgba(185, 28, 28, 0.3)', background: 'rgba(254, 242, 242, 0.8)' }}>
                        <p style={{ margin: 0, color: '#B91C1C', fontWeight: 600 }}>{error}</p>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="card" style={{ padding: 28, textAlign: 'center' }}>
                        <ShoppingCart className="w-10 h-10" style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
                        <p style={{ margin: '10px 0 0', fontWeight: 700 }}>Your cart is empty</p>
                        <p style={{ margin: '6px 0 14px', color: 'var(--text-secondary)' }}>
                            Add products to cart and checkout from here.
                        </p>
                        <Link href="/products" className="btn-primary" style={{ textDecoration: 'none' }}>
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
                        <section style={{ display: 'grid', gap: 10 }}>
                            {items.map((item) => {
                                const availableStock = Number.isFinite(item.availableStock) ? item.availableStock : 1;

                                return (
                                <article key={item.productId} className="card" style={{ padding: 12, display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 12, alignItems: 'center' }}>
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, background: '#F3F4F6' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/96x96/F3F4F6/9CA3AF?text=No+Image';
                                        }}
                                    />

                                    <div>
                                        <Link href={`/products/${item.productId}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{item.title}</h3>
                                        </Link>
                                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                                            Seller: {item.sellerName}
                                        </p>
                                        <p style={{ margin: '4px 0 0', color: availableStock > 0 ? 'var(--text-muted)' : '#B91C1C', fontSize: 12 }}>
                                            {availableStock > 0 ? `Available: ${availableStock}` : 'Out of stock'}
                                        </p>
                                        <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{formatCurrency(item.price)}</p>
                                    </div>

                                    <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                                            <button
                                                className="nav-icon-btn"
                                                style={{ width: 32, height: 32 }}
                                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                                disabled={availableStock <= 0}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span style={{ minWidth: 34, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.quantity}</span>
                                            <button
                                                className="nav-icon-btn"
                                                style={{ width: 32, height: 32 }}
                                                onClick={() => updateQuantity(item.productId, Math.min(availableStock, item.quantity + 1))}
                                                disabled={availableStock <= item.quantity}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => removeItem(item.productId)}>
                                            <Trash2 className="w-4 h-4" /> Remove
                                        </button>
                                    </div>
                                </article>
                            )})}
                        </section>

                        <aside className="card" style={{ padding: 14, alignSelf: 'start', position: 'sticky', top: 90 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Order Summary</h2>

                            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span>Total Items</span>
                                    <span>{totalItems}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                    <span>Total Amount</span>
                                    <span>{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={() => router.push('/checkout')} disabled={items.length === 0}>
                                Proceed to Checkout
                            </button>

                            <button className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={clearCart}>
                                Clear Cart
                            </button>
                        </aside>
                    </div>
                )}

                <style jsx>{`
                    @media (max-width: 980px) {
                        .page-container > div:last-child {
                            grid-template-columns: 1fr !important;
                        }
                    }

                    @media (max-width: 720px) {
                        article.card {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
