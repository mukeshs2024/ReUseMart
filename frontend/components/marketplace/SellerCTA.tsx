 'use client';

import Link from 'next/link';
import Image from 'next/image';

export function SellerCTA() {
  return (
    <section className="py-16" style={{ background: '#0D1B4C' }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
          <div className="text-white">
            <h2 className="text-3xl font-bold">Sell on ReUseMart</h2>
            <p className="mt-3 max-w-md text-lg text-white/90">List items quickly, reach local buyers, and get paid securely — start turning clutter into cash.</p>

            <div className="mt-6 flex gap-4">
              <Link href="/sell" className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0D1B4C] hover:bg-white/90">List an item</Link>
              <Link href="/seller/dashboard" className="inline-flex items-center rounded-xl border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">Seller dashboard</Link>
            </div>
          </div>

          <div className="order-first lg:order-last w-full">
            <div className="relative h-72 w-full overflow-hidden rounded-xl bg-white/5">
              <Image src="https://images.unsplash.com/photo-1520975914683-5b3105b3d0b9?w=1200&q=80&auto=format&fit=crop" alt="person listing items" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
