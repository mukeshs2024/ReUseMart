'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function FiltersSidebar() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    condition: true,
    category: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="sticky top-24 h-fit">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Price Filter */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('price')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">Price</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-600 transition-transform ${
                expandedSections.price ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.price && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-2">Min: ₹0 - Max: ₹100,000</label>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="5000"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Condition Filter */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('condition')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">Condition</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-600 transition-transform ${
                expandedSections.condition ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.condition && (
            <div className="px-4 pb-4 space-y-3">
              {['Like New', 'Used', 'Old', 'Fair'].map((condition) => (
                <label key={condition} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-teal-500" />
                  <span className="text-sm text-gray-700">{condition}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleSection('category')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">Category</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-600 transition-transform ${
                expandedSections.category ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.category && (
            <div className="px-4 pb-4 space-y-3">
              {['Electronics', 'Mobiles', 'Furniture', 'Fashion', 'Accessories'].map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-teal-500" />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Filters Button */}
      <button className="w-full mt-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
        Clear Filters
      </button>
    </div>
  );
}
