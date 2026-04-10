'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, MessageSquare, ShoppingCart, User, X } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { isBuyerAccount, isSellerMode } from '@/lib/authMode';
import {
    estimateOriginalPrice,
    formatCurrency,
    normalizeCondition,
    savingsPercent,
} from '@/lib/utils';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    condition?: string;
    createdAt: string;
    seller: { id: string; name: string };
    hasPaymentQr?: boolean;
    paymentQrCodeUrl?: string | null;
}

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [orderPlacedMessage, setOrderPlacedMessage] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        api.get(`/products/${id}`)
            .then((res) => setProduct(res.data))
            .catch(() => setError('Product not found'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="page-container" style={{ paddingTop: 100 }}>
                <div className="skeleton" style={{ height: 360 }} />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="page-container" style={{ paddingTop: 100 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Product not found.</p>
                </div>
            </div>
        );
    }

    const condition = normalizeCondition(product.condition);
    const originalPrice = estimateOriginalPrice(product.price, product.condition);
    const savings = savingsPercent(product.price, originalPrice);
    const availableStock = Math.max(0, product.stock ?? 0);
    const isOutOfStock = availableStock <= 0;
    const isOwner = user?.id === product.seller.id;
    const ownerInSellerMode = isOwner && isSellerMode(user);

    const ensureBuyerMode = (): boolean => {
        if (!isAuthenticated) {
            router.push('/login');
            return false;
        }

        if (!isBuyerAccount(user)) {
            alert('Your account is not eligible for buyer actions right now.');
            return false;
        }

        if (isSellerMode(user)) {
            alert('Switch to BUYER mode from your profile menu to continue.');
            return false;
        }

        return true;
    };

    const handleChat = async () => {
        const canContinue = ensureBuyerMode();
        if (!canContinue) {
            return;
        }

        setSending(true);
        try {
            await api.post('/messages', {
                content: `Hi, I am interested in ${product.title}. Is this still available?`,
                productId: product.id,
            });
            alert('Message sent to seller.');
        } catch {
            alert('Unable to message seller right now.');
        } finally {
            setSending(false);
        }
    };

    const openPaymentModal = async () => {
        const canContinue = ensureBuyerMode();
        if (!canContinue) {
            return;
        }

        if (!product.hasPaymentQr) {
            alert('Seller has not generated a QR code yet.');
            return;
        }

        if (isOutOfStock) {
            alert('This product is out of stock.');
            return;
        }

        setQuantity(1);
        setShowPaymentModal(true);
    };

    const handleCompletePayment = async () => {
        if (quantity > availableStock) {
            setPaymentError(`Only ${availableStock} item(s) left in stock`);
            return;
        }

        setPaymentProcessing(true);
        setPaymentError('');
        try {
            const response = await api.post('/seller/orders', { productId: product.id, quantity });
            setShowPaymentModal(false);
            setOrderPlacedMessage(response.data?.message || 'Order placed successfully.');
            setProduct((prev) => {
                if (!prev) {
                    return prev;
                }

                return {
                    ...prev,
                    stock: Math.max(0, prev.stock - quantity),
                };
            });
        } catch (err: any) {
            setPaymentError(err.response?.data?.error || 'Failed to place order');
        } finally {
            setPaymentProcessing(false);
        }
    };

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            sellerId: product.seller.id,
            sellerName: product.seller.name,
            availableStock,
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 92, paddingBottom: 20 }}>
            <div className="page-container">
                <Link href="/products" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 12 }}>
                    <ArrowLeft className="w-4 h-4" /> Back to listings
                </Link>

                <div className="card" style={{ padding: 18 }}>
                    {orderPlacedMessage && (
                        <div
                            className="mb-3 rounded-lg px-3 py-2 text-sm"
                            style={{
                                background: 'rgba(34, 197, 94, 0.10)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: '#166534',
                            }}
                        >
                            {orderPlacedMessage}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                        <section>
                            <div style={{ borderRadius: 8, overflow: 'hidden', background: '#F3F4F6', aspectRatio: '1 / 1' }}>
                                <img
                                    src={product.imageUrl}
                                    alt={product.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/700x700/F3F4F6/9CA3AF?text=No+Image';
                                    }}
                                />
                            </div>
                        </section>

                        <section>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{product.title}</h1>

                            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="badge-condition">{condition}</span>
                                <span className="badge-trust"><BadgeCheck className="w-3.5 h-3.5" /> Verified Seller</span>
                                <span className="badge-condition" style={{ color: isOutOfStock ? '#B91C1C' : undefined }}>
                                    {isOutOfStock ? 'Out of stock' : `Stock: ${availableStock}`}
                                </span>
                            </div>

                            <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(product.price)}</span>
                                <span style={{ fontSize: 15, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCurrency(originalPrice)}</span>
                                <span className="badge-saving">You save {savings}%</span>
                            </div>

                            <div className="card" style={{ marginTop: 12, padding: 12, background: '#F8FAFF' }}>
                                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {product.description || 'Seller has not added extra description.'}
                                </p>
                            </div>

                            <div className="card" style={{ marginTop: 12, padding: 12 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Seller Information</p>
                                <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                                    <p style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}><User className="w-4 h-4" /> {product.seller.name}</p>
                                </div>
                            </div>

                            {!isOwner ? (
                                <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ flex: 1, minWidth: 150 }}
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock}
                                    >
                                        <ShoppingCart className="w-4 h-4" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ flex: 1, minWidth: 150 }}
                                        onClick={() => void openPaymentModal()}
                                        disabled={!product.hasPaymentQr || isOutOfStock}
                                        title={
                                            isOutOfStock
                                                ? 'This product is out of stock'
                                                : product.hasPaymentQr
                                                ? 'Pay via seller QR'
                                                : 'Seller has not added QR yet'
                                        }
                                    >
                                        <ShoppingCart className="w-4 h-4" /> Buy Now
                                    </button>
                                    <button onClick={handleChat} disabled={sending} className="btn-secondary" style={{ flex: 1, minWidth: 150 }}>
                                        <MessageSquare className="w-4 h-4" /> {sending ? 'Sending...' : 'Chat with Seller'}
                                    </button>
                                </div>
                            ) : ownerInSellerMode ? (
                                <div style={{ marginTop: 12 }}>
                                    <Link href={`/seller/products/${product.id}/edit`} className="btn-primary" style={{ textDecoration: 'none' }}>
                                        Edit Listing
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        You own this listing. Switch seller mode from your profile to manage it.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {showPaymentModal && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.55)',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 16,
                        }}
                        onClick={() => setShowPaymentModal(false)}
                    >
                        <div
                            className="card"
                            style={{ width: '100%', maxWidth: 440, padding: 18 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Scan and Pay</h3>
                                <button className="btn-secondary" onClick={() => setShowPaymentModal(false)} style={{ padding: 6 }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8, marginBottom: 14 }}>
                                Use any QR app to scan, then place your order after completing the payment.
                            </p>

                            <div className="card" style={{ padding: 14, textAlign: 'center' }}>
                                {product.paymentQrCodeUrl ? (
                                    <img
                                        src={product.paymentQrCodeUrl}
                                        alt="Payment QR"
                                        style={{ width: 260, height: 260, objectFit: 'contain', margin: '0 auto' }}
                                    />
                                ) : (
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>QR not available</p>
                                )}
                                <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 700 }}>
                                    Amount: {formatCurrency(product.price * quantity)}
                                </p>
                            </div>

                            <div style={{ marginTop: 10 }}>
                                <label className="input-label">Quantity</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, availableStock)}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(Math.max(1, availableStock), Number(e.target.value || 1))))}
                                    className="input-field"
                                />
                            </div>

                            <button
                                className="btn-primary"
                                style={{ width: '100%', marginTop: 14 }}
                                onClick={handleCompletePayment}
                                disabled={paymentProcessing}
                            >
                                {paymentProcessing ? 'Placing order...' : 'Place Order'}
                            </button>

                            {paymentError && (
                                <p className="mt-2 text-sm" style={{ color: '#B91C1C' }}>
                                    {paymentError}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <style jsx>{`
                    @media (max-width: 900px) {
                        .card > div {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
