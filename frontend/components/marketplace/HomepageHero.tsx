'use client';

import { Search, MapPin } from 'lucide-react';

export function HomepageHero() {
  return (
    <section className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-500/50 rounded-full px-4 py-2">
            <span className="text-teal-300 text-sm font-semibold">✓ Trusted Since 2024</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4 leading-tight">
          India's #1 Second-Hand Marketplace
        </h1>

        {/* Subtext */}
        <p className="text-lg text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          Buy verified second-hand products with real-time chat, secure payments, and verified sellers.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none shadow-lg"
            />
          </div>
        </div>

        {/* Location Bar (Optional) */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center gap-2 justify-center text-sm text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>Showing products in your area</span>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="flex flex-wrap justify-center gap-2 items-center">
          <span className="text-sm text-gray-400">Popular:</span>
          {['iPhone', 'Laptop', 'Furniture', 'Bikes', 'Watches'].map((search) => (
            <button
              key={search}
              className="px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
            >
              {search}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
