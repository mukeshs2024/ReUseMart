'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export function PremiumFooter() {
  return (
    <footer className="w-full bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div>
            <div className="font-bold text-white text-lg mb-2">♻️ ReUseMart</div>
            <p className="text-sm text-gray-400 mb-6">
              Buy smart. Sell easy. Live sustainably.
            </p>
            <p className="text-xs text-gray-500">
              © 2024 ReUseMart. All rights reserved.
            </p>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/home" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/home" className="hover:text-white transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/home" className="hover:text-white transition-colors">
                  Furniture
                </Link>
              </li>
              <li>
                <Link href="/home" className="hover:text-white transition-colors">
                  Fashion & Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Sell</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/sell" className="hover:text-white transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="hover:text-white transition-colors">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Seller Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            Made with ♻️ for a sustainable future
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
