'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, ShoppingCart } from 'lucide-react';
import {
    estimateOriginalPrice,
    formatCurrency,
    normalizeCondition,
    savingsPercent,
} from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    stock?: number;
    imageUrl: string;
    condition?: string;
    createdAt: string;
    seller: { id: string; name: string; businessName?: string };
}

export function ProductCard({ product }: { product: Product }) {
    const sellerName = product.seller?.businessName || product.seller?.name || 'Seller';
    const condition = normalizeCondition(product.condition);
    const originalPrice = estimateOriginalPrice(product.price, product.condition);
    const saved = savingsPercent(product.price, originalPrice);
    const stock = product.stock ?? 1;
    const isOutOfStock = stock <= 0;
    const addItem = useCartStore((state) => state.addItem);
    const [added, setAdded] = useState(false);

    const handleAddToCart = () => {
        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            sellerId: product.seller.id,
            sellerName,
            availableStock: Math.max(0, stock),
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    return (
        <article className="card-hover" style={{ overflow: 'hidden' }}>
            <Link href={`/products/${product.id}`} className="block" style={{ textDecoration: 'none' }}>
                <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#F3F4F6' }}>
                    <img
                        src={product.imageUrl}
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
                </div>

                <div style={{ padding: 12 }}>
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
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sellerName}</span>
                    </div>

                    <p style={{ margin: '8px 0 0', fontSize: 12, color: isOutOfStock ? '#B91C1C' : 'var(--text-muted)' }}>
                        {isOutOfStock ? 'Out of stock' : `Stock: ${stock}`}
                    </p>
                </div>
            </Link>

            <div style={{ padding: '0 12px 12px' }}>
                <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn-secondary"
                    style={{ width: '100%' }}
                    disabled={isOutOfStock}
                >
                    <ShoppingCart className="w-4 h-4" /> {isOutOfStock ? 'Out of Stock' : added ? 'Added' : 'Add to Cart'}
                </button>
            </div>
        </article>
    );
}

export default ProductCard;
