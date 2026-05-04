'use client';

import { ShieldCheck, Zap, MessageSquare, Percent } from 'lucide-react';

export function TrustStrip() {
  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'Verified Sellers',
      description: 'Every seller is verified for your trust',
    },
    {
      icon: Zap,
      title: 'Fast & Secure',
      description: 'Payment protection guarantee',
    },
    {
      icon: MessageSquare,
      title: 'Real-time Chat',
      description: 'Negotiate directly with sellers',
    },
    {
      icon: Percent,
      title: 'Best Prices',
      description: 'Save up to 70% vs new products',
    },
  ];

  return (
    <section className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                  {point.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
