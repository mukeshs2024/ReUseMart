'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, Search } from 'lucide-react';
import api from '@/lib/axios';
import { ProductCard } from '@/components/products/ProductCard';
import {
    CATEGORY_LABELS,
    categoryLabelFromValue,
    normalizeCategoryFilter,
    normalizeCondition,
} from '@/lib/utils';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    category?: 'ELECTRONICS' | 'MOBILES' | 'FURNITURE' | 'FASHION' | 'ACCESSORIES';
    imageUrl: string;
    condition?: string;
    createdAt: string;
    seller: { id: string; name: string; businessName?: string };
}

const categories = ['All', ...CATEGORY_LABELS] as const;
const conditions = ['All', 'Like New', 'Used', 'Old', 'Too Old'];

type CategoryFilter = (typeof categories)[number];

function ProductsPageContent() {
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
    const [condition, setCondition] = useState(searchParams.get('condition') || 'All');
    const [category, setCategory] = useState<CategoryFilter>(normalizeCategoryFilter(searchParams.get('category')));

    useEffect(() => {
        setQuery(searchParams.get('q') || '');
        setCondition(searchParams.get('condition') || 'All');
        setCategory(normalizeCategoryFilter(searchParams.get('category')));
    }, [searchParams]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const trimmedQuery = query.trim();
            const categoryParam = category !== 'All' ? category : null;
            const endpoint = (() => {
                if (trimmedQuery) {
                    const params = new URLSearchParams({ q: trimmedQuery });
                    if (categoryParam) {
                        params.set('category', categoryParam);
                    }
                    return `/products/search?${params.toString()}`;
                }

                if (categoryParam) {
                    const params = new URLSearchParams({ category: categoryParam });
                    return `/products?${params.toString()}`;
                }

                return '/products';
            })();

            const res = await api.get(endpoint);
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [query, category]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const conditionOk = condition === 'All' || normalizeCondition(product.condition) === condition;
            const displayCategory = categoryLabelFromValue(product.category);
            const categoryOk = category === 'All' || displayCategory === category;
            const priceOk = product.price >= priceRange[0] && product.price <= priceRange[1];
            return conditionOk && categoryOk && priceOk;
        });
    }, [products, condition, category, priceRange]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 88, paddingBottom: 20 }}>
            <div className="page-container">
                <div style={{ marginBottom: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Product Listings</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{filteredProducts.length} items found</p>
                    </div>
                </div>

                <div style={{ position: 'relative', maxWidth: 560, marginBottom: 12 }}>
                    <Search className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 36, height: 40 }}
                        placeholder="Search products"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
                    <aside className="card" style={{ padding: 14, alignSelf: 'start', position: 'sticky', top: 86 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Filter className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Filters</h2>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                            <p className="input-label" style={{ marginBottom: 6 }}>Price Range</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={priceRange[0]}
                                    onChange={(e) => setPriceRange([Number(e.target.value || 0), priceRange[1]])}
                                    placeholder="Min"
                                />
                                <input
                                    type="number"
                                    className="input-field"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value || 0)])}
                                    placeholder="Max"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                            <p className="input-label" style={{ marginBottom: 6 }}>Condition</p>
                            <select className="input-field" value={condition} onChange={(e) => setCondition(e.target.value)}>
                                {conditions.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <p className="input-label" style={{ marginBottom: 6 }}>Category</p>
                            <select className="input-field" value={category} onChange={(e) => setCategory(normalizeCategoryFilter(e.target.value))}>
                                {categories.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </aside>

                    <section>
                        {loading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 290 }} />)}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="card" style={{ padding: 26, textAlign: 'center' }}>
                                <p style={{ margin: 0, fontWeight: 700 }}>No products match your filters</p>
                                <p style={{ marginTop: 6, color: 'var(--text-secondary)' }}>Try adjusting price range, category, or condition.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <style jsx>{`
                    @media (max-width: 1000px) {
                        aside {
                            position: static !important;
                        }
                        .page-container > div:last-child {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />}>
            <ProductsPageContent />
        </Suspense>
    );
}
