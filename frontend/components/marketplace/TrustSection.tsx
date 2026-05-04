'use client';

import { ShieldCheck, Lock, MessageCircle, Tag } from 'lucide-react';

export default function TrustSection() {
  const cards = [
    { Icon: ShieldCheck, title: 'Verified Sellers', desc: 'Seller identity and history verified' },
    { Icon: Lock, title: 'Secure Payments', desc: 'Safe transactions with trusted gateways' },
    { Icon: MessageCircle, title: 'Real-time Chat', desc: 'Negotiate directly with buyers & sellers' },
    { Icon: Tag, title: 'Affordable Prices', desc: 'Great deals on quality second-hand items' },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.title} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-6 shadow-md">
              <div className="rounded-xl p-3" style={{ background: '#F5A62320', color: '#F5A623' }}><c.Icon className="w-6 h-6" /></div>
              <div>
                <h3 className="text-sm font-semibold text-[#0D1B4C]">{c.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
