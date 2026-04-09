import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { verifyToken } from '../config/jwt';

export interface ChatMessageEventPayload {
    id: string;
    content: string;
    senderType: 'BUYER' | 'SELLER';
    buyerId: string;
    sellerId: string;
    productId: string;
    isRead: boolean;
    createdAt: string;
}

export interface OrderPlacedEventPayload {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    quantity: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;

const getAllowedOrigins = (): string[] => {
    return [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
    ].filter((origin): origin is string => Boolean(origin));
};

const extractToken = (socket: Socket): string | null => {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
        return authToken.trim();
    }

    const headerValue = socket.handshake.headers.authorization;
    const normalizedHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!normalizedHeader) {
        return null;
    }

    if (normalizedHeader.startsWith('Bearer ')) {
        return normalizedHeader.slice(7).trim();
    }

    return normalizedHeader.trim();
};

export const initializeChatSocket = (httpServer: HttpServer): Server => {
    const allowedOrigins = getAllowedOrigins();

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                    return;
                }

                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
        },
    });

    io.use((socket, next) => {
        try {
            const token = extractToken(socket);
            if (!token) {
                next(new Error('Unauthorized'));
                return;
            }

            const decoded = verifyToken(token);
            socket.data.userId = decoded.id;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const currentUserId = socket.data.userId as string | undefined;
        if (!currentUserId) {
            socket.disconnect(true);
            return;
        }

        socket.join(userRoom(currentUserId));
    });

    return io;
};

export const emitChatMessageCreated = (payload: ChatMessageEventPayload): void => {
    if (!io) {
        return;
    }

    io.to(userRoom(payload.buyerId)).emit('chat:new-message', payload);

    if (payload.sellerId !== payload.buyerId) {
        io.to(userRoom(payload.sellerId)).emit('chat:new-message', payload);
    }
};

export const emitOrderPlaced = (payload: OrderPlacedEventPayload): void => {
    if (!io) {
        return;
    }

    io.to(userRoom(payload.sellerId)).emit('order:placed', payload);

    if (payload.buyerId !== payload.sellerId) {
        io.to(userRoom(payload.buyerId)).emit('order:placed', payload);
    }
};
