'use client';

import { io, type Socket } from 'socket.io-client';

export interface LiveChatMessage {
    id: string;
    content: string;
    senderType: 'BUYER' | 'SELLER';
    buyerId: string;
    sellerId: string;
    productId: string;
    isRead: boolean;
    createdAt: string;
}

export interface LiveOrderPlaced {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    quantity: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

let socket: Socket | null = null;
let socketToken: string | null = null;

const getSocketBaseUrl = (): string => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    return apiBase.replace(/\/api\/?$/, '');
};

export const getChatSocket = (token: string): Socket => {
    if (!socket || socketToken !== token) {
        if (socket) {
            socket.disconnect();
        }

        socket = io(getSocketBaseUrl(), {
            auth: { token },
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });
        socketToken = token;
    } else if (!socket.connected) {
        socket.connect();
    }

    return socket;
};

export const disconnectChatSocket = (): void => {
    if (!socket) {
        return;
    }

    socket.disconnect();
    socket = null;
    socketToken = null;
};
