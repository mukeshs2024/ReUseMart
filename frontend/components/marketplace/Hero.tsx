'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT: Text block */}
          <div className="space-y-6">
              <span className="inline-block rounded-full bg-[#F5A623]/10 px-4 py-1 text-sm font-semibold" style={{ color: '#F5A623' }}>
                India’s Trusted Second-Hand Marketplace
              </span>

              <h1 className="text-4xl lg:text-5xl font-bold" style={{ color: '#0D1B4C' }}>
                Give Things a Second Life
              </h1>

              <p className="text-lg text-gray-600 max-w-xl">
                Buy and sell electronics, furniture, and more from verified sellers.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold"
                  style={{ background: '#0D1B4C', color: '#ffffff' }}
                >
                  Start Shopping
                </Link>

                <Link
                  href="/sell"
                  className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold"
                  style={{ border: '1px solid #0D1B4C', color: '#0D1B4C', background: 'transparent' }}
                >
                  Start Selling
                </Link>
              </div>
          </div>

          {/* RIGHT: Single clean image */}
          <div className="w-full">
            <div className="relative h-80 sm:h-96 rounded-xl shadow-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1526178612703-7a66a3d0b8f8?w=1200&q=80&auto=format&fit=crop"
                  alt="Marketplace multi-category items"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
          </div>
        </div>
      </div>
    </section>
  );
}
