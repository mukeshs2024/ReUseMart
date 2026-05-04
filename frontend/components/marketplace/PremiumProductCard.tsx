'use client';

import Link from 'next/link';
import { Search, Smartphone, Sofa, Shirt, Watch, Laptop, Tag, MapPin, Heart } from 'lucide-react';
import Image from 'next/image';
import { getPlaceholderImage } from '@/lib/utils';

interface ProductCardProps {
  product: any;
}

export function PremiumProductCard({ product }: ProductCardProps) {
  const discount = 20; // Example discount percentage
  const originalPrice = Math.round(product.price / (1 - discount / 100));

  const finalImageUrl = (!product.imageUrl || product.imageUrl.includes('unsplash.com') || product.imageUrl.includes('placehold.co')) 
      ? getPlaceholderImage(product.category, product.id) 
      : product.imageUrl;

  return (
    <div className="group h-full rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative h-56 bg-gray-100 overflow-hidden">
        {/* Badge */}
        <div className="absolute top-3 left-3 z-10 bg-teal-500 text-white px-2 py-1 rounded text-xs font-semibold">
          {product.condition || 'Used'}
        </div>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            {discount}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
        </button>

        {/* Product Image */}
        <img
          src={finalImageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/F3F4F6/9CA3AF?text=No+Image';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
            {discount > 0 && (
              <span className="text-sm text-gray-500 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
            {product.seller?.name?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 truncate">{product.seller?.name || 'Seller'}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-900">4.5★</span>
              <span className="text-xs text-gray-500">(234 reviews)</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-green-50 px-2 py-1 rounded">
            <span className="text-xs font-bold text-green-700">✓</span>
            <span className="text-xs text-green-700 font-semibold">Verified</span>
          </div>
        </div>

        {/* Stock/Usage Info */}
        {product.usageYears > 0 && (
          <p className="text-xs text-gray-600 mb-3">
            Used for {product.usageYears} {product.usageYears === 1 ? 'year' : 'years'}
          </p>
        )}

        {/* Add to Cart Button */}
        <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg transition-colors mt-auto">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
