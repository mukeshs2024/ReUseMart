import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { emitChatMessageCreated } from '../realtime/chatSocket';

const sendMessageSchema = z.object({
    content: z.string().min(5, 'Message must be at least 5 characters').max(1000),
    productId: z.string().uuid('Invalid product ID'),
});

const replyMessageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(1000),
    productId: z.string().uuid('Invalid product ID'),
    otherUserId: z.string().uuid('Invalid recipient user ID'),
});

const conversationParamsSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    otherUserId: z.string().uuid('Invalid user ID'),
});

const getErrorCode = (error: unknown): string | null => {
    if (!error || typeof error !== 'object') {
        return null;
    }

    if (!('code' in error)) {
        return null;
    }

    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
};

const isIncomingForUser = (message: { senderType: 'BUYER' | 'SELLER'; buyerId: string; sellerId: string }, userId: string) => {
    if (message.senderType === 'BUYER') {
        return message.sellerId === userId;
    }

    return message.buyerId === userId;
};

const broadcastMessageCreated = (message: {
    id: string;
    content: string;
    senderType: 'BUYER' | 'SELLER';
    buyerId: string;
    sellerId: string;
    productId: string;
    isRead: boolean;
    createdAt: Date;
}) => {
    emitChatMessageCreated({
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        buyerId: message.buyerId,
        sellerId: message.sellerId,
        productId: message.productId,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
    });
};

// POST /api/messages — buyer sends message to seller
export async function sendMessage(req: AuthRequest, res: Response) {
    const buyerId = req.user!.id;
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
    }

    const { content, productId } = parsed.data;

    // Fetch product to get sellerId
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true, title: true },
    });

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (product.sellerId === buyerId) {
        return res.status(400).json({ error: 'You cannot message yourself' });
    }

    const message = await prisma.message.create({
        data: {
            content,
            productId,
            buyerId,
            sellerId: product.sellerId,
            senderType: 'BUYER',
        },
        include: {
            buyer: { select: { id: true, name: true, email: true } },
            product: { select: { id: true, title: true } },
        },
    });

    broadcastMessageCreated(message);

    return res.status(201).json(message);
}

// GET /api/messages/inbox — seller reads their received messages
export async function getInbox(req: AuthRequest, res: Response) {
    const sellerId = req.user!.id;

    const messages = await prisma.message.findMany({
        where: { sellerId, senderType: 'BUYER' },
        orderBy: { createdAt: 'desc' },
        include: {
            buyer: { select: { id: true, name: true, email: true } },
            product: { select: { id: true, title: true, imageUrl: true } },
        },
    });

    // Mark all as read
    await prisma.message.updateMany({
        where: { sellerId, senderType: 'BUYER', isRead: false },
        data: { isRead: true },
    });

    return res.json(messages);
}

// GET /api/messages/inbox/unread-count — for badge
export async function getUnreadCount(req: AuthRequest, res: Response) {
    const sellerId = req.user!.id;
    try {
        const count = await prisma.message.count({
            where: { sellerId, senderType: 'BUYER', isRead: false },
        });
        return res.json({ count });
    } catch (error) {
        if (getErrorCode(error) === 'P1001') {
            console.warn('[messages/getUnreadCount] Database temporarily unreachable. Returning fallback count=0.');
            return res.json({ count: 0, degraded: true });
        }

        console.error('[messages/getUnreadCount] Failed to get unread count:', error);
        return res.status(500).json({ error: 'Failed to get unread count' });
    }
}

// GET /api/messages/unread-count — generic unread count for both buyers and sellers
export async function getUnreadCountForUser(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    try {
        const count = await prisma.message.count({
            where: {
                isRead: false,
                OR: [
                    { sellerId: userId, senderType: 'BUYER' },
                    { buyerId: userId, senderType: 'SELLER' },
                ],
            },
        });

        return res.json({ count });
    } catch (error) {
        if (getErrorCode(error) === 'P1001') {
            console.warn('[messages/getUnreadCountForUser] Database temporarily unreachable. Returning fallback count=0.');
            return res.json({ count: 0, degraded: true });
        }

        console.error('[messages/getUnreadCountForUser] Failed to get unread count:', error);
        return res.status(500).json({ error: 'Failed to get unread count' });
    }
}

// GET /api/messages/sent — buyer sees their sent messages
export async function getSent(req: AuthRequest, res: Response) {
    const buyerId = req.user!.id;
    const messages = await prisma.message.findMany({
        where: { buyerId, senderType: 'BUYER' },
        orderBy: { createdAt: 'desc' },
        include: {
            seller: { select: { id: true, name: true } },
            product: { select: { id: true, title: true, imageUrl: true } },
        },
    });
    return res.json(messages);
}

// POST /api/messages/reply — both buyer and seller can send a message in a conversation
export async function replyMessage(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.id;
    const parsed = replyMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
    }

    const { content, productId, otherUserId } = parsed.data;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, sellerId: true },
    });

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (otherUserId === currentUserId) {
        return res.status(400).json({ error: 'You cannot message yourself' });
    }

    let buyerId: string;
    let sellerId: string;
    let senderType: 'BUYER' | 'SELLER';

    if (currentUserId === product.sellerId) {
        buyerId = otherUserId;
        sellerId = currentUserId;
        senderType = 'SELLER';

        const [buyerExists, priorMessages, priorOrders] = await Promise.all([
            prisma.user.findUnique({ where: { id: buyerId }, select: { id: true } }),
            prisma.message.count({ where: { productId, buyerId, sellerId } }),
            prisma.order.count({ where: { productId, buyerId, sellerId } }),
        ]);

        if (!buyerExists) {
            return res.status(404).json({ error: 'Buyer not found' });
        }

        if (priorMessages === 0 && priorOrders === 0) {
            return res.status(403).json({ error: 'No conversation context found for this buyer and product' });
        }
    } else {
        buyerId = currentUserId;
        sellerId = product.sellerId;
        senderType = 'BUYER';

        if (otherUserId !== sellerId) {
            return res.status(403).json({ error: 'You can only message the seller of this product' });
        }
    }

    const message = await prisma.message.create({
        data: {
            content,
            productId,
            buyerId,
            sellerId,
            senderType,
        },
        include: {
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } },
            product: { select: { id: true, title: true, imageUrl: true } },
        },
    });

    broadcastMessageCreated(message);

    return res.status(201).json(message);
}

// GET /api/messages/conversations — list all buyer/seller conversations for the logged-in user
export async function getConversations(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.id;

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { buyerId: currentUserId },
                { sellerId: currentUserId },
            ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } },
            product: { select: { id: true, title: true, imageUrl: true } },
        },
    });

    const byConversation = new Map<string, {
        productId: string;
        counterpartyId: string;
        counterparty: { id: string; name: string; email: string };
        product: { id: string; title: string; imageUrl: string };
        lastMessage: { id: string; content: string; createdAt: Date; senderType: 'BUYER' | 'SELLER'; isRead: boolean };
        unreadCount: number;
    }>();

    for (const message of messages) {
        const currentUserIsBuyer = message.buyerId === currentUserId;
        const counterparty = currentUserIsBuyer ? message.seller : message.buyer;
        const conversationKey = `${message.productId}:${counterparty.id}`;
        const incomingUnread = isIncomingForUser(message, currentUserId) && !message.isRead;

        const existing = byConversation.get(conversationKey);
        if (!existing) {
            byConversation.set(conversationKey, {
                productId: message.productId,
                counterpartyId: counterparty.id,
                counterparty: {
                    id: counterparty.id,
                    name: counterparty.name,
                    email: counterparty.email,
                },
                product: {
                    id: message.product.id,
                    title: message.product.title,
                    imageUrl: message.product.imageUrl,
                },
                lastMessage: {
                    id: message.id,
                    content: message.content,
                    createdAt: message.createdAt,
                    senderType: message.senderType,
                    isRead: message.isRead,
                },
                unreadCount: incomingUnread ? 1 : 0,
            });
        } else if (incomingUnread) {
            existing.unreadCount += 1;
        }
    }

    const conversations = [...byConversation.values()].sort(
        (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );

    return res.json(conversations);
}

// GET /api/messages/conversations/:productId/:otherUserId — get one thread and mark incoming unread as read
export async function getConversationMessages(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.id;
    const parsedParams = conversationParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.issues[0]?.message ?? 'Invalid path params' });
    }

    const { productId, otherUserId } = parsedParams.data;
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true, imageUrl: true, sellerId: true },
    });

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    let buyerId: string;
    let sellerId: string;

    if (currentUserId === product.sellerId) {
        sellerId = currentUserId;
        buyerId = otherUserId;
    } else {
        buyerId = currentUserId;
        sellerId = product.sellerId;
        if (otherUserId !== sellerId) {
            return res.status(403).json({ error: 'You can only access a thread with the seller of this product' });
        }
    }

    if (buyerId === sellerId) {
        return res.status(400).json({ error: 'Invalid conversation participants' });
    }

    const messages = await prisma.message.findMany({
        where: { productId, buyerId, sellerId },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            content: true,
            senderType: true,
            buyerId: true,
            sellerId: true,
            isRead: true,
            createdAt: true,
        },
    });

    if (currentUserId === sellerId) {
        await prisma.message.updateMany({
            where: { productId, buyerId, sellerId, senderType: 'BUYER', isRead: false },
            data: { isRead: true },
        });
    } else {
        await prisma.message.updateMany({
            where: { productId, buyerId, sellerId, senderType: 'SELLER', isRead: false },
            data: { isRead: true },
        });
    }

    return res.json({
        product,
        buyerId,
        sellerId,
        otherUserId,
        messages,
    });
}
