'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    productId: string;
    title: string;
    price: number;
    imageUrl: string;
    sellerId: string;
    sellerName: string;
    availableStock: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
}

const clampQuantity = (value: number) => {
    return Math.max(1, Math.min(20, value));
};

const clampQuantityByStock = (value: number, availableStock: number) => {
    const normalizedStock = Number.isFinite(availableStock) ? availableStock : 1;
    const safeStock = Math.max(1, Math.min(9999, normalizedStock));
    return Math.max(1, Math.min(safeStock, clampQuantity(value)));
};

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],

            addItem: (item, quantity = 1) =>
                set((state) => {
                    const safeQuantity = clampQuantityByStock(quantity, item.availableStock);
                    const existing = state.items.find((entry) => entry.productId === item.productId);

                    if (existing) {
                        const mergedStock = Math.max(existing.availableStock, item.availableStock);
                        return {
                            items: state.items.map((entry) =>
                                entry.productId === item.productId
                                    ? {
                                          ...entry,
                                          availableStock: mergedStock,
                                          quantity: clampQuantityByStock(entry.quantity + safeQuantity, mergedStock),
                                      }
                                    : entry
                            ),
                        };
                    }

                    return {
                        items: [...state.items, { ...item, quantity: safeQuantity }],
                    };
                }),

            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                })),

            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.productId === productId
                            ? { ...item, quantity: clampQuantityByStock(quantity, item.availableStock) }
                            : item
                    ),
                })),

            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'reusemart_cart',
            partialize: (state) => ({ items: state.items }),
        }
    )
);
