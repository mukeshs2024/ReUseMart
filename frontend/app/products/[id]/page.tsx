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
    usageYears: number;
    imageUrl: string;
    condition?: string;
    conditionDetails?: string[];
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
    const [offerOpen, setOfferOpen] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [offerSubmitting, setOfferSubmitting] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
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
    const usageYears = product.usageYears ?? 0;
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

    const handleWhatsAppShare = () => {
        if (!product) return;
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const msg = `Hey! Check out this ${product.title} on ReUseMart for ₹${product.price}. Condition: ${product.condition || ''}. Link: ${url}`;
        const encoded = encodeURIComponent(msg);
        const waUrl = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
            ? `whatsapp://send?text=${encoded}`
            : `https://web.whatsapp.com/send?text=${encoded}`;
        window.open(waUrl, '_blank');
    };

    const handleOpenOffer = () => {
        if (!ensureBuyerMode()) return;
        setOfferOpen(true);
    };

    const submitOffer = async () => {
        if (!product) return;
        if (!offerPrice || Number(offerPrice) <= 0) {
            alert('Enter a valid offer price');
            return;
        }

        setOfferSubmitting(true);
        try {
            await api.post('/offers', {
                productId: product.id,
                price: Number(offerPrice),
                message: offerMessage,
            });
            alert('Offer submitted');
            setOfferOpen(false);
            setOfferPrice('');
            setOfferMessage('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit offer');
        } finally {
            setOfferSubmitting(false);
        }
    };

    const handleBuyNow = async () => {
        const canContinue = ensureBuyerMode();
        if (!canContinue) {
            return;
        }

        if (isOutOfStock) {
            alert('This product is out of stock.');
            return;
        }

        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            sellerId: product.seller.id,
            sellerName: product.seller.name,
            availableStock,
        }, quantity);

        router.push('/checkout');
    };

    const handleCompletePayment = async () => {
        const canContinue = ensureBuyerMode();
        if (!canContinue) {
            return;
        }

        if (isOutOfStock) {
            setPaymentError('This product is out of stock.');
            return;
        }

        setPaymentProcessing(true);
        setPaymentError('');

        try {
            addItem({
                productId: product.id,
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl,
                sellerId: product.seller.id,
                sellerName: product.seller.name,
                availableStock,
            }, quantity);

            setShowPaymentModal(false);
            router.push('/checkout');
        } catch {
            setPaymentError('Failed to proceed to checkout. Please try again.');
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
        }, quantity);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 92, paddingBottom: 20 }}>
            <div className="page-container">
                {/* Breadcrumb */}
                <nav style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <Link href="/products" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Products</Link>
                    <span style={{ margin: '0 8px' }}>›</span>
                    <span>{normalizeCondition(product?.condition)}</span>
                    <span style={{ margin: '0 8px' }}>›</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product?.title}</span>
                </nav>

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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                        <section>
                            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>{product.title}</h1>

                            <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="badge-condition">{condition}</span>
                                <span className="badge-trust"><BadgeCheck className="w-3.5 h-3.5" /> Verified Seller</span>
                                <span className="badge-condition" style={{ color: isOutOfStock ? '#B91C1C' : undefined }}>
                                    {isOutOfStock ? 'Out of stock' : `Stock: ${availableStock}`}
                                </span>
                            </div>

                            <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                                {usageYears > 0 ? `Used for: ${usageYears} ${usageYears === 1 ? 'year' : 'years'}` : 'Usage not specified'}
                            </p>

                            <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(product.price)}</span>
                                <span style={{ fontSize: 15, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCurrency(originalPrice)}</span>
                                <span className="badge-saving">You save {savings}%</span>
                            </div>

                            <div className="card" style={{ marginTop: 12, padding: 12, background: '#F8FAFF' }}>
                                <div style={{ marginBottom: 10 }}>
                                    {descExpanded ? product.description : product.description?.substring(0, 200)}
                                    {product.description && product.description.length > 200 && (
                                        <button
                                            onClick={() => setDescExpanded(!descExpanded)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--accent-primary)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: 13,
                                                marginTop: 8,
                                            }}
                                        >
                                            {descExpanded ? 'Show less' : 'Show more'}
                                        </button>
                                    )}
                                </div>
                                {product.description?.includes('◆') && (
                                    <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                                        {product.description?.split('◆').filter((s: string) => s.trim()).map((bullet: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                                                <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>•</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{bullet.trim()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="card" style={{ marginTop: 12, padding: 12 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Condition Breakdown</p>
                                {product.conditionDetails && Array.isArray(product.conditionDetails) && product.conditionDetails.length > 0 ? (
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {(product.conditionDetails as string[]).map((item) => (
                                            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ color: '#10B981' }}>✔</span>
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Seller did not provide a condition breakdown.</p>
                                )}
                            </div>

                            <div className="card" style={{ marginTop: 12, padding: 12 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Seller Information</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: 16,
                                    }}>
                                        {product.seller.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{product.seller.name}</p>
                                        {product.seller && (product.seller as any).trustScore !== undefined && (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                marginTop: 4,
                                                padding: '2px 8px',
                                                borderRadius: 12,
                                                background: (product.seller as any).trustScore > 75 ? 'rgba(16,185,129,0.12)' : (product.seller as any).trustScore >= 40 ? 'rgba(250,204,21,0.08)' : 'rgba(239,68,68,0.06)',
                                                color: (product.seller as any).trustScore > 75 ? '#047857' : (product.seller as any).trustScore >= 40 ? '#92400E' : '#7F1D1D',
                                            }}>
                                                ⭐ {(product.seller as any).trustScore} Trust Score
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!isOwner ? (
                                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                                    <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Quantity</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                                            <button className="nav-icon-btn" style={{ width: 36, height: 36 }} onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                                                <span style={{ fontSize: 16, fontWeight: 700 }}>−</span>
                                            </button>
                                            <span style={{ minWidth: 44, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{quantity}</span>
                                            <button className="nav-icon-btn" style={{ width: 36, height: 36 }} onClick={() => setQuantity((current) => Math.min(availableStock, current + 1))}>
                                                <span style={{ fontSize: 16, fontWeight: 700 }}>+</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button onClick={handleWhatsAppShare} className="btn-secondary" style={{
                                        minWidth: 150,
                                        background: '#25D366',
                                        color: 'white',
                                        border: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                    }}>
                                        📱 Share on WhatsApp
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ flex: 1, minWidth: 150 }}
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock}
                                    >
                                        <ShoppingCart className="w-4 h-4" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                    <button onClick={handleOpenOffer} className="btn-secondary" style={{
                                        flex: 1,
                                        minWidth: 150,
                                        background: '#1F2937',
                                        color: 'white',
                                        border: 'none',
                                    }}>
                                        Make an Offer
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{
                                            flex: 1,
                                            minWidth: 150,
                                            background: '#1D9E75',
                                            color: 'white',
                                        }}
                                        onClick={() => void handleBuyNow()}
                                        disabled={isOutOfStock}
                                        title={isOutOfStock ? 'This product is out of stock' : 'Proceed to checkout'}
                                    >
                                        <ShoppingCart className="w-4 h-4" /> Buy Now
                                    </button>
                                    <button onClick={handleChat} disabled={sending} className="btn-secondary" style={{ flex: 1, minWidth: 150 }}>
                                        <MessageSquare className="w-4 h-4" /> {sending ? 'Sending...' : 'Chat with Seller'}
                                    </button>
                                    </div>
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

                        {/* Offer popup */}
                        {offerOpen && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setOfferOpen(false)}>
                                <div className="card" style={{ width: '100%', maxWidth: 480, padding: 18 }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Make an Offer</h3>
                                        <button className="btn-secondary" onClick={() => setOfferOpen(false)} style={{ padding: 6 }}>
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
                                        Propose a price and an optional message to the seller.
                                    </p>

                                    <div style={{ marginTop: 10 }}>
                                        <label className="input-label">Offer Price (₹)</label>
                                        <input type="number" className="input-field" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
                                    </div>

                                    <div style={{ marginTop: 10 }}>
                                        <label className="input-label">Message (optional)</label>
                                        <input type="text" className="input-field" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} placeholder="Will pick up today" />
                                    </div>

                                    <div style={{ marginTop: 12 }}>
                                        <button className="btn-primary" style={{ width: '100%' }} onClick={submitOffer} disabled={offerSubmitting}>
                                            {offerSubmitting ? 'Submitting...' : 'Send Offer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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
