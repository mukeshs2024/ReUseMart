'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, ShoppingCart, Heart } from 'lucide-react';
import {
    estimateOriginalPrice,
    formatCurrency,
    normalizeCondition,
    savingsPercent,
    getPlaceholderImage,
} from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    stock?: number;
    usageYears?: number;
    imageUrl: string;
    condition?: string;
    category?: string;
    createdAt: string;
    seller: { id: string; name: string; businessName?: string };
}

export function ProductCard({ product }: { product: Product }) {
    const sellerName = product.seller?.businessName || product.seller?.name || 'Seller';
    const condition = normalizeCondition(product.condition);
    const originalPrice = estimateOriginalPrice(product.price, product.condition);
    const saved = savingsPercent(product.price, originalPrice);
    const stock = product.stock ?? 1;
    const usageYears = product.usageYears ?? 0;
    const isOutOfStock = stock <= 0;
    const addItem = useCartStore((state) => state.addItem);
    const [added, setAdded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const finalImageUrl = (!product.imageUrl || product.imageUrl.includes('unsplash.com') || product.imageUrl.includes('placehold.co')) 
        ? getPlaceholderImage(product.category, product.id) 
        : product.imageUrl;

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: finalImageUrl,
            sellerId: product.seller.id,
            sellerName,
            availableStock: Math.max(0, stock),
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    return (
        <article className="card-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Link href={`/products/${product.id}`} className="block" style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '3 / 2', background: '#F3F4F6' }}>
                    <img
                        src={finalImageUrl}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/F3F4F6/9CA3AF?text=No+Image';
                        }}
                    />
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                        <span className="badge-condition">{condition}</span>
                        {saved > 0 && <span className="badge-saving">Save {saved}%</span>}
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            background: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart className="w-5 h-5" style={{ color: isWishlisted ? '#EF4444' : '#9CA3AF', fill: isWishlisted ? '#EF4444' : 'none' }} />
                    </button>
                </div>

                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {product.title}
                    </h3>

                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(product.price)}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatCurrency(originalPrice)}
                        </span>
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <BadgeCheck className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Verified seller</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sellerName}</span>
                            {product.seller && (product.seller as any).trustScore !== undefined && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        padding: '4px 8px',
                                        borderRadius: 20,
                                        background: (product.seller as any).trustScore > 75 ? 'rgba(16,185,129,0.12)' : (product.seller as any).trustScore >= 40 ? 'rgba(250,204,21,0.08)' : 'rgba(239,68,68,0.06)',
                                        color: (product.seller as any).trustScore > 75 ? '#047857' : (product.seller as any).trustScore >= 40 ? '#92400E' : '#7F1D1D',
                                    }}
                                    title="Based on completed orders, ratings, and response speed"
                                >
                                    <span>⭐</span> {(product.seller as any).trustScore} Trust Score
                                </span>
                            )}
                        </div>
                    </div>

                    <p style={{ margin: '8px 0 0', fontSize: 12, color: isOutOfStock ? '#B91C1C' : 'var(--text-muted)' }}>
                        {isOutOfStock ? 'Out of stock' : `Stock: ${stock}`}
                    </p>
                    {usageYears > 0 && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                            Used for: {usageYears} {usageYears === 1 ? 'year' : 'years'}
                        </p>
                    )}
                </div>
            </Link>

            <div style={{ padding: '0 10px 10px', marginTop: 'auto' }}>
                <button
                    type="button"
                    onClick={handleAddToCart}
                    className={isOutOfStock ? 'btn-secondary' : 'btn-primary'}
                    style={{
                        width: '100%',
                        ...(isOutOfStock ? { background: '#E5E7EB', color: '#9CA3AF', border: 'none' } : {})
                    }}
                    disabled={isOutOfStock}
                >
                    <ShoppingCart className="w-4 h-4" /> {isOutOfStock ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Cart'}
                </button>
            </div>
        </article>
    );
}

export default ProductCard;
