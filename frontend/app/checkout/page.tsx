'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { isBuyerAccount, isSellerMode } from '@/lib/authMode';
import { formatCurrency } from '@/lib/utils';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import AddressForm from '@/components/checkout/AddressForm';
import OrderSummary from '@/components/checkout/OrderSummary';

interface AddressState {
    fullName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    pincode: string;
}

type CheckoutStep = 'address' | 'payment';

const initialAddress: AddressState = {
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
};

export default function CheckoutPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);

    const [step, setStep] = useState<CheckoutStep>('address');
    const [address, setAddress] = useState<AddressState>(initialAddress);
    const [errors, setErrors] = useState<Partial<Record<keyof AddressState, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (!isBuyerAccount(user) || isSellerMode(user)) {
            router.replace('/cart');
        }
    }, [isAuthenticated, router, user]);

    const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

    const qrData = useMemo(() => {
        return `reusemart://checkout?buyer=${encodeURIComponent(user?.id ?? 'guest')}&amount=${totalAmount.toFixed(2)}&items=${totalItems}`;
    }, [totalAmount, totalItems, user?.id]);

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData)}`;

    const handleAddressChange = (field: keyof AddressState, value: string) => {
        setAddress((current) => ({ ...current, [field]: value }));
    };

    const validateAddress = () => {
        const nextErrors: Partial<Record<keyof AddressState, string>> = {};

        if (!address.fullName.trim()) nextErrors.fullName = 'Full name is required';
        if (!/^\+?[0-9]{10,15}$/.test(address.phoneNumber.trim())) nextErrors.phoneNumber = 'Enter a valid phone number';
        if (!address.streetAddress.trim()) nextErrors.streetAddress = 'Street address is required';
        if (!address.city.trim()) nextErrors.city = 'City is required';
        if (!address.state.trim()) nextErrors.state = 'State is required';
        if (!/^[0-9]{4,10}$/.test(address.pincode.trim())) nextErrors.pincode = 'Pincode must be numeric';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleContinueToPayment = () => {
        if (!validateAddress()) {
            setError('Please fill in the delivery address before continuing.');
            return;
        }

        setError('');
        setStep('payment');
    };

    const handleConfirmPayment = async () => {
        if (!validateAddress()) {
            setStep('address');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await api.post('/seller/orders', {
                items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                deliveryAddress: address,
                paymentMethod: 'QR',
                paymentConfirmed: true,
            });

            clearCart();
            router.push(`/checkout/success/${response.data.order.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#f8fafc] pt-28">
                <div className="page-container">
                    <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                        <ShieldCheck className="mx-auto h-12 w-12 text-teal-600" />
                        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Your cart is empty</h1>
                        <p className="mt-2 text-sm text-gray-600">Add items to your cart before starting checkout.</p>
                        <button
                            type="button"
                            onClick={() => router.push('/products')}
                            className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
                        >
                            Browse Products
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] pt-24 pb-10">
            <div className="page-container">
                <button
                    type="button"
                    onClick={() => router.push('/cart')}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to cart
                </button>

                <div className="mb-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Checkout</p>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">Complete your delivery and payment</h1>
                    <p className="mt-2 text-sm text-gray-600">Address first, QR payment second, order last.</p>
                </div>

                <CheckoutSteps currentStep={step === 'address' ? 2 : 3} />

                {error ? (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
                ) : null}

                <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-6">
                        {step === 'address' ? (
                            <AddressForm
                                value={address}
                                errors={errors}
                                onChange={handleAddressChange}
                                onSubmit={handleContinueToPayment}
                            />
                        ) : (
                            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-5 flex items-start gap-3">
                                    <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                                        <QrCode className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Payment QR</p>
                                        <h2 className="mt-1 text-2xl font-semibold text-gray-900">Scan to confirm payment</h2>
                                        <p className="mt-2 text-sm text-gray-600">Complete the payment with your QR app, then confirm the order.</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
                                    <img src={qrUrl} alt="Checkout QR" className="mx-auto h-72 w-72 rounded-xl object-contain" />
                                    <p className="mt-4 text-sm font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
                                    <p className="mt-1 text-xs text-gray-500">This QR is for the pending checkout total.</p>
                                </div>

                                <div className="mt-5 rounded-2xl border border-gray-100 bg-teal-50 p-4 text-sm text-teal-900">
                                    <p className="font-semibold">Payment checklist</p>
                                    <ul className="mt-3 space-y-2">
                                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Scan the QR code</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Complete payment in your app</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Confirm payment to place the order</li>
                                    </ul>
                                </div>

                                <div className="mt-5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('address')}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Edit Address
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleConfirmPayment()}
                                        disabled={submitting}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>

                    <OrderSummary items={items} totalAmount={totalAmount} />
                </div>
            </div>
        </div>
    );
}