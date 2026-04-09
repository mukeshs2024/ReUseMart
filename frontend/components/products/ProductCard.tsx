'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
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

    return (
        <Link href={`/products/${product.id}`} className="block" style={{ textDecoration: 'none' }}>
            <article className="card-hover" style={{ overflow: 'hidden' }}>
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
                </div>
            </article>
        </Link>
    );
}

export default ProductCard;
