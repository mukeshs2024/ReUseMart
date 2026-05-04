'use client';

import Link from 'next/link';
import { Smartphone, Sofa, Shirt, Watch, Laptop } from 'lucide-react';
import { HomepageHero } from '@/components/marketplace/HomepageHero';
import { TrustStrip } from '@/components/marketplace/TrustStrip';
import { FiltersSidebar } from '@/components/marketplace/FiltersSidebar';
import { PremiumProductCard } from '@/components/marketplace/PremiumProductCard';
import { SellerCTA } from '@/components/marketplace/SellerCTA';
import { PremiumFooter } from '@/components/marketplace/PremiumFooter';
import { useEffect, useState } from 'react';

const categories = [
  { label: 'Electronics', Icon: Laptop },
  { label: 'Mobiles', Icon: Smartphone },
  { label: 'Furniture', Icon: Sofa },
  { label: 'Fashion', Icon: Shirt },
  { label: 'Accessories', Icon: Watch },
];

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data.slice(0, 12) : []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <HomepageHero />

      {/* Trust Strip */}
      <TrustStrip />

      {/* Category Quick Links */}
      <section className="w-full bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map(({ label, Icon }) => (
              <Link
                key={label}
                href={`/products?category=${encodeURIComponent(label)}`}
                className="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center mb-2 transition-colors">
                  <Icon className="w-6 h-6 text-gray-700 group-hover:text-teal-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Products with Filters */}
      <section className="flex-1 w-full bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Section Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New & Trending</h2>
            <p className="text-gray-600">Discover the latest products in your area</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <FiltersSidebar />
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg h-96 animate-pulse" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <PremiumProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-600 text-lg">No products available at the moment.</p>
                  <p className="text-gray-500 text-sm mt-2">Check back soon for more listings!</p>
                </div>
              )}

              {/* View All Button */}
              {products.length > 0 && (
                <div className="mt-12 text-center">
                  <Link
                    href="/products"
                    className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                  >
                    View All Products
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <SellerCTA />

      {/* Footer */}
      <PremiumFooter />
    </div>
  );
}
