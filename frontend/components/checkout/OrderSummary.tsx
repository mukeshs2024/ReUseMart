'use client';

import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import type { CartItem } from '@/store/cartStore';

interface OrderSummaryProps {
    items: CartItem[];
    totalAmount: number;
}

export default function OrderSummary({ items, totalAmount }: OrderSummaryProps) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">Order Summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">{totalItems} item{totalItems === 1 ? '' : 's'}</h2>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 rounded-xl border border-gray-100 p-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="64px" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-gray-900">{item.title}</h3>
                            <p className="mt-1 text-xs text-gray-500">Seller: {item.sellerName}</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                                <span>Qty: {item.quantity}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Items</span>
                    <span>{totalItems}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>
            </div>
        </aside>
    );
}