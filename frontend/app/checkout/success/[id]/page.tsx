'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Package, MapPin } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';

interface OrderItem {
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: { id: string; title: string; imageUrl: string; price: number };
    seller: { id: string; name: string };
}

interface CheckoutOrder {
    id: string;
    totalAmount: number;
    status: 'PLACED' | 'COMPLETED' | 'CANCELLED';
    paymentMethod: 'QR';
    createdAt: string;
    address: {
        fullName: string;
        phoneNumber: string;
        streetAddress: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: OrderItem[];
}

export default function CheckoutSuccessPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const [order, setOrder] = useState<CheckoutOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        api.get(`/seller/orders/${id}`)
            .then((response) => {
                setOrder(response.data);
                setError('');
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Unable to load order summary');
            })
            .finally(() => setLoading(false));
    }, [id, isAuthenticated, router]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 pb-10">
            <div className="page-container max-w-4xl">
                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="skeleton h-8 w-64" />
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="skeleton h-56 rounded-2xl" />
                            <div className="skeleton h-56 rounded-2xl" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
                        <p className="font-semibold">{error}</p>
                        <Link href="/cart" className="mt-4 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white">
                            Back to cart
                        </Link>
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-1 h-8 w-8 text-emerald-600" />
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Order Confirmed</p>
                                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">Your order has been placed</h1>
                                    <p className="mt-2 text-sm text-gray-600">Order ID: {order.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                                <div className="mt-4 space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                                            <img src={item.product.imageUrl} alt={item.product.title} className="h-16 w-16 rounded-lg object-cover" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-sm font-semibold text-gray-900">{item.product.title}</h3>
                                                <p className="mt-1 text-xs text-gray-500">Seller: {item.seller.name}</p>
                                                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>{formatCurrency(item.lineTotal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <aside className="space-y-6">
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                        <MapPin className="h-5 w-5 text-teal-600" /> Delivery Address
                                    </h2>
                                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                                        <p className="font-semibold text-gray-900">{order.address.fullName}</p>
                                        <p>{order.address.phoneNumber}</p>
                                        <p>{order.address.streetAddress}</p>
                                        <p>
                                            {order.address.city}, {order.address.state} {order.address.pincode}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                                        <Package className="h-5 w-5 text-teal-600" /> Summary
                                    </h2>
                                    <div className="mt-4 space-y-3 text-sm text-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span>Status</span>
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Payment</span>
                                            <span>{order.paymentMethod}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Total</span>
                                            <span className="text-base font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Link href="/products" className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                        Continue Shopping
                                    </Link>
                                    <Link href="/profile" className="flex-1 rounded-xl bg-teal-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-teal-700">
                                        View Profile
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}