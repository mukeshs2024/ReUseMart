import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { emitChatMessageCreated } from '../realtime/chatSocket';

// Create an offer (buyer)
export const createOffer = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    try {
        const { productId, price, message } = req.body;
        if (!productId || !price) {
            res.status(400).json({ error: 'productId and price are required' });
            return;
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (product.sellerId === userId) {
            res.status(400).json({ error: 'Cannot make offer on your own product' });
            return;
        }

        // Check for existing active offer by this buyer
        const existing = await prisma.offer.findFirst({ where: { productId, buyerId: userId, status: 'PENDING' } });
        if (existing) {
            res.status(400).json({ error: 'You already have an active offer for this product' });
            return;
        }

        const offer = await prisma.offer.create({
            data: {
                productId,
                buyerId: userId,
                sellerId: product.sellerId,
                price: Number(price),
                message: message || null,
            },
        });

        // Create a system message to notify seller about new offer and emit realtime event
        const notify = await prisma.message.create({
            data: {
                content: `New offer from ${req.user!.name} for ₹${Number(price)} on product ${product.title}.`,
                senderType: 'BUYER',
                buyerId: userId,
                sellerId: product.sellerId,
                productId: productId,
            },
        });

        emitChatMessageCreated({
            id: notify.id,
            content: notify.content,
            senderType: 'BUYER',
            buyerId: notify.buyerId,
            sellerId: notify.sellerId,
            productId: notify.productId,
            isRead: notify.isRead,
            createdAt: notify.createdAt.toISOString(),
        });

        res.status(201).json(offer);
    } catch (err) {
        console.error('Create offer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Seller: list incoming offers
export const getSellerOffers = async (req: AuthRequest, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    try {
        const offers = await prisma.offer.findMany({
            where: { sellerId },
            orderBy: { createdAt: 'desc' },
            include: { buyer: { select: { id: true, name: true } }, product: { select: { id: true, title: true } } },
        });

        res.json(offers);
    } catch (err) {
        console.error('Get seller offers error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Seller: accept an offer
export const acceptOffer = async (req: AuthRequest, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const offerId = req.params.id;
    try {
        const offer = await prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer) {
            res.status(404).json({ error: 'Offer not found' });
            return;
        }
        if (offer.sellerId !== sellerId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        if (offer.status !== 'PENDING') {
            res.status(400).json({ error: 'Offer already processed' });
            return;
        }

        const updated = await prisma.offer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });

        // Notify buyer via message (simple notification) and emit realtime event
        const notify = await prisma.message.create({
            data: {
                content: `Your offer for product ${offer.productId} was accepted. Proceed to checkout at ₹${offer.price}.`,
                senderType: 'SELLER',
                buyerId: offer.buyerId,
                sellerId: sellerId,
                productId: offer.productId,
            },
        });

        emitChatMessageCreated({
            id: notify.id,
            content: notify.content,
            senderType: 'SELLER',
            buyerId: notify.buyerId,
            sellerId: notify.sellerId,
            productId: notify.productId,
            isRead: notify.isRead,
            createdAt: notify.createdAt.toISOString(),
        });

        res.json(updated);
    } catch (err) {
        console.error('Accept offer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Seller: decline an offer
export const declineOffer = async (req: AuthRequest, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const offerId = req.params.id;
    try {
        const offer = await prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer) {
            res.status(404).json({ error: 'Offer not found' });
            return;
        }
        if (offer.sellerId !== sellerId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        if (offer.status !== 'PENDING') {
            res.status(400).json({ error: 'Offer already processed' });
            return;
        }

        const updated = await prisma.offer.update({ where: { id: offerId }, data: { status: 'DECLINED' } });

        // Notify buyer via message and emit realtime event
        const notify = await prisma.message.create({
            data: {
                content: `Your offer for product ${offer.productId} was declined.`,
                senderType: 'SELLER',
                buyerId: offer.buyerId,
                sellerId: sellerId,
                productId: offer.productId,
            },
        });

        emitChatMessageCreated({
            id: notify.id,
            content: notify.content,
            senderType: 'SELLER',
            buyerId: notify.buyerId,
            sellerId: notify.sellerId,
            productId: notify.productId,
            isRead: notify.isRead,
            createdAt: notify.createdAt.toISOString(),
        });

        res.json(updated);
    } catch (err) {
        console.error('Decline offer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export default {
    createOffer,
    getSellerOffers,
    acceptOffer,
    declineOffer,
};
