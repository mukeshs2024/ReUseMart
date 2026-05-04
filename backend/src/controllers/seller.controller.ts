import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth';
import { emitOrderPlaced } from '../realtime/chatSocket';
import { getSupabaseClient } from '../lib/supabase';

const resolveParamId = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value;
    }

    if (Array.isArray(value)) {
        const first = value.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
        return first ?? null;
    }

    return null;
};

// Helper function to generate QR code URL
function buildQrCodeUrl(paymentText: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentText)}`;
}

// Helper function to generate payment text for QR
function generatePaymentText(productId: string, sellerId: string, price: number, title: string): string {
    return `reusemart://pay?productId=${productId}&sellerId=${sellerId}&amount=${price}&title=${encodeURIComponent(title)}`;
}

// Ensure product has QR code - auto-generate if missing
async function ensureProductHasQr(product: any) {
    if (!product.paymentQrCode) {
        const paymentText = generatePaymentText(product.id, product.sellerId, product.price, product.title);
        const qrCodeUrl = buildQrCodeUrl(paymentText);
        
        // Update product with QR code
        await prisma.product.update({
            where: { id: product.id },
            data: {
                paymentQrText: paymentText,
                paymentQrCode: qrCodeUrl,
            },
        });
        
        return qrCodeUrl;
    }
    return product.paymentQrCode;
}

// Validation schemas
const productSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be a positive number'),
    stock: z.number().int().min(1, 'Stock must be at least 1').max(9999, 'Stock is too large'),
    usageYears: z.number().int().min(0, 'Usage years cannot be negative').max(100, 'Usage years is too large'),
    category: z.enum(['ELECTRONICS', 'MOBILES', 'FURNITURE', 'FASHION', 'ACCESSORIES']),
    condition: z.enum(['LIKE_NEW', 'USED', 'OLD', 'TOO_OLD']),
    imageUrl: z.string().url('Image URL must be a valid URL'),
    conditionDetails: z.array(z.string()).optional(),
});

const productUpdateSchema = productSchema.partial();

// Seller onboarding schemas
const initiateSellerSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

const verifyOtpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

const completeSellerProfileSchema = z.object({
    avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

const generateQrSchema = z.object({
    paymentHandle: z.string().min(3).max(80).optional(),
});

const checkoutItemSchema = z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.number().int().min(1).max(20),
});

const checkoutAddressSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phoneNumber: z.string().regex(/^[0-9]{10,15}$/, 'Phone number must be valid'),
    streetAddress: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^[0-9]{4,10}$/, 'Pincode must be numeric'),
});

const createOrderSchema = z.object({
    items: z.array(checkoutItemSchema).min(1, 'At least one cart item is required'),
    deliveryAddress: checkoutAddressSchema,
    paymentMethod: z.literal('QR'),
    paymentConfirmed: z.literal(true),
});

const mapOrderForBuyerView = (order: {
    id: string;
    buyerId: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: Date;
    address: {
        id: string;
        fullName: string;
        phoneNumber: string;
        streetAddress: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        product: { id: string; title: string; imageUrl: string; price: number };
        seller: { id: string; name: string };
    }>;
}) => {
    const firstItem = order.items[0];

    return {
        id: order.id,
        buyerId: order.buyerId,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        address: order.address,
        items: order.items,
        product: firstItem?.product ?? null,
        seller: firstItem?.seller ?? null,
        quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    };
};

export const activateSeller = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    try {
        if (req.user!.activeMode === 'SELLER') {
            res.json({ message: 'Seller mode is already active' });
            return;
        }

        const canEnableSellerMode = req.user!.userType === 'SELLER' || req.user!.userType === 'BOTH' || req.user!.isSeller;
        if (!canEnableSellerMode) {
            res.status(403).json({ error: 'User is not allowed to enter seller mode' });
            return;
        }

        const nextUserType = req.user!.userType === 'BUYER' ? 'BOTH' : req.user!.userType;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                isSeller: true,
                userType: nextUserType,
                activeMode: 'BUYER',
            },
        });

        // Return a new token with updated isSeller flag
        const token = signToken({
            id: updated.id,
            email: updated.email,
            role: updated.role,
            userType: updated.userType,
            isSeller: updated.isSeller,
            activeMode: updated.activeMode,
        });

        res.json({
            token,
            message: 'Seller account enabled successfully',
            user: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                userType: updated.userType,
                isSeller: updated.isSeller,
                activeMode: updated.activeMode,
            },
        });
    } catch (err) {
        console.error('Activate seller error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSellerProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    const sellerId = req.user!.id;

    try {
        let products = await prisma.product.findMany({
            where: { sellerId },
            orderBy: { createdAt: 'desc' },
        });

        // Ensure all products have QR codes (async but don't wait)
        products.forEach((product) => {
            if (!product.paymentQrCode) {
                const paymentText = generatePaymentText(product.id, product.sellerId, product.price, product.title);
                const qrCodeUrl = buildQrCodeUrl(paymentText);
                
                // Update in database without waiting
                prisma.product.update({
                    where: { id: product.id },
                    data: {
                        paymentQrText: paymentText,
                        paymentQrCode: qrCodeUrl,
                    },
                }).catch(err => console.error('Error generating QR:', err));
                
                // Update local object for this response
                product.paymentQrCode = qrCodeUrl;
            }
        });

        const enriched = products.map((product) => ({
            ...product,
            hasPaymentQr: Boolean(product.paymentQrCode),
            paymentQrCodeUrl: product.paymentQrCode,
        }));

        res.json(enriched);
    } catch (err) {
        console.error('Get seller products error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const sellerId = req.user!.id;

    try {
        // First create product with basic data
        // QR will be generated after we have the product ID
        const product = await prisma.product.create({
            data: {
                ...parsed.data,
                sellerId,
            },
        });

        // Now generate QR with actual product ID
        const paymentText = generatePaymentText(product.id, sellerId, product.price, product.title);
        const qrCodeUrl = buildQrCodeUrl(paymentText);

        // Update product with QR data
        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: {
                paymentQrText: paymentText,
                paymentQrCode: qrCodeUrl,
            },
        });

        res.status(201).json(updatedProduct);
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = resolveParamId(req.params.id);
    const sellerId = req.user!.id;

    if (!id) {
        res.status(400).json({ error: 'Invalid product id' });
        return;
    }

    const parsed = productUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    try {
        const product = await prisma.product.findUnique({ where: { id } });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (product.sellerId !== sellerId) {
            res.status(403).json({ error: 'Forbidden: You do not own this product' });
            return;
        }

        const updated = await prisma.product.update({
            where: { id },
            data: parsed.data,
        });

        res.json(updated);
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = resolveParamId(req.params.id);
    const sellerId = req.user!.id;

    if (!id) {
        res.status(400).json({ error: 'Invalid product id' });
        return;
    }

    try {
        const product = await prisma.product.findUnique({ where: { id } });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (product.sellerId !== sellerId) {
            res.status(403).json({ error: 'Forbidden: You do not own this product' });
            return;
        }

        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// ==================== SELLER ONBOARDING ENDPOINTS ====================

/**
 * Step 1: Initiate seller onboarding with name
 * Sends a one-time email OTP via Supabase
 */
export const initiateSeller = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = initiateSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
    }

    const userId = req.user!.id;
    const { fullName } = parsed.data;

    try {
        // Check if user already a seller
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const alreadySellerType = user.userType === 'SELLER' || user.userType === 'BOTH' || user.isSeller;
        if (alreadySellerType && user.isPhoneVerified) {
            res.status(400).json({ error: 'You are already a verified seller' });
            return;
        }

        // Update user profile (verification remains pending until OTP confirmation)
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: fullName,
                isPhoneVerified: false,
            },
        });

        let supabase: ReturnType<typeof getSupabaseClient>;
        try {
            supabase = getSupabaseClient();
        } catch {
            res.status(500).json({ error: 'Email OTP service is not configured' });
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            email: user.email,
            options: {
                shouldCreateUser: true,
            },
        });

        if (error) {
            console.error('Supabase send OTP error:', error.message);
            res.status(502).json({ error: 'Failed to send email OTP' });
            return;
        }

        res.json({
            message: 'Email OTP sent successfully',
            email: user.email,
        });
    } catch (err) {
        console.error('Initiate seller error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Step 2: Verify OTP and mark email as verified for seller onboarding
 */
export const verifySellerOtp = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
    }

    const userId = req.user!.id;
    const { otp } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let supabase: ReturnType<typeof getSupabaseClient>;
        try {
            supabase = getSupabaseClient();
        } catch {
            res.status(500).json({ error: 'Email OTP service is not configured' });
            return;
        }

        const { error } = await supabase.auth.verifyOtp({
            email: user.email,
            token: otp,
            type: 'email',
        });

        if (error) {
            res.status(400).json({ error: 'Invalid or expired OTP' });
            return;
        }

        // Update user: seller verified via email OTP
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                isSeller: true,
                userType: req.user!.userType === 'BUYER' ? 'BOTH' : req.user!.userType,
                isPhoneVerified: true,
                sellerLevel: 'VERIFIED',
                trustScore: 50, // Base trust score
                activeMode: 'BUYER',
            },
        });

        // Generate new token with updated user info
        const token = signToken({
            id: updated.id,
            email: updated.email,
            role: updated.role,
            userType: updated.userType,
            isSeller: updated.isSeller,
            activeMode: updated.activeMode,
        });

        res.json({
            message: 'Email verified successfully',
            token,
            user: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                userType: updated.userType,
                isSeller: updated.isSeller,
                activeMode: updated.activeMode,
                isPhoneVerified: updated.isPhoneVerified,
                sellerLevel: updated.sellerLevel,
                trustScore: updated.trustScore,
            },
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Step 3: Complete seller profile with avatar
 */
export const completeSellerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = completeSellerProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
    }

    const userId = req.user!.id;
    const { avatarUrl } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (!user.isPhoneVerified) {
            res.status(400).json({ error: 'Please verify your email first' });
            return;
        }

        // Update user profile with avatar
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                avatarUrl: avatarUrl || user.avatarUrl,
                userType: user.userType === 'BUYER' ? 'BOTH' : user.userType,
                // Optionally upgrade to TRUSTED after profile completion
                sellerLevel: 'TRUSTED',
                trustScore: Math.min(75, user.trustScore + 25),
                activeMode: 'BUYER',
            },
        });

        res.json({
            message: 'Seller profile completed successfully',
            user: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                userType: updated.userType,
                isSeller: updated.isSeller,
                activeMode: updated.activeMode,
                isPhoneVerified: updated.isPhoneVerified,
                avatarUrl: updated.avatarUrl,
                sellerLevel: updated.sellerLevel,
                trustScore: updated.trustScore,
            },
        });
    } catch (err) {
        console.error('Complete seller profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get current seller profile and trust info
 */
export const getSellerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                userType: true,
                isSeller: true,
                activeMode: true,
                isPhoneVerified: true,
                trustScore: true,
                sellerLevel: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (err) {
        console.error('Get seller profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get trust badge information
 */
export const getTrustBadge = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                userType: true,
                isSeller: true,
                isPhoneVerified: true,
                trustScore: true,
                sellerLevel: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Recalculate trust score based on completed orders, average rating, and response speed
        const [completedOrdersCount, ratingAgg] = await Promise.all([
            prisma.order.count({ where: { primarySellerId: userId, status: { not: 'CANCELLED' } } }),
            prisma.rating.aggregate({ where: { sellerId: userId }, _avg: { rating: true } }),
        ]);

        const avgRating = ratingAgg._avg.rating ?? 0;

        // Compute average seller response time (hours)
        const recentMessages = await prisma.message.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        // Build diffs where a buyer message is followed by a seller reply for same product
        const diffs: number[] = [];
        for (let i = recentMessages.length - 1; i >= 0; i--) {
            const msg = recentMessages[i];
            if (msg.senderType === 'SELLER') continue;
            for (let j = i + 1; j < recentMessages.length; j++) {
                const next = recentMessages[j];
                if (next.senderType === 'SELLER' && next.buyerId === msg.buyerId && next.productId === msg.productId) {
                    const diffMs = new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime();
                    if (diffMs > 0) diffs.push(diffMs / (1000 * 60 * 60)); // hours
                    break;
                }
            }
        }

        const avgResponseHours = diffs.length ? diffs.reduce((s, d) => s + d, 0) / diffs.length : Infinity;

        // Scoring weights: orders 40, rating 40, response 20
        const orderPoints = Math.min(40, completedOrdersCount * 2); // up to 40 points
        const ratingPoints = (Math.min(5, avgRating) / 5) * 40; // scale to 40
        let responsePoints = 0;
        if (avgResponseHours === Infinity) responsePoints = 6; // small default if no data
        else if (avgResponseHours <= 2) responsePoints = 20;
        else if (avgResponseHours <= 12) responsePoints = 12;
        else if (avgResponseHours <= 48) responsePoints = 6;
        else responsePoints = 0;

        const calculated = Math.round(orderPoints + ratingPoints + responsePoints);

        // Persist calculated trust score (0-100)
        const newScore = Math.max(0, Math.min(100, calculated));
        await prisma.user.update({ where: { id: userId }, data: { trustScore: newScore } });

        const badge = {
            userType: user.userType,
            verified: user.isPhoneVerified,
            trustScore: newScore,
            level: user.sellerLevel,
            badges: [] as string[],
        };

        if (user.isPhoneVerified) badge.badges.push('verified');
        if (user.sellerLevel === 'TRUSTED' && newScore >= 50) badge.badges.push('trusted-seller');
        if (user.sellerLevel === 'PRO' && newScore >= 80) badge.badges.push('pro-seller');

        res.json(badge);
    } catch (err) {
        console.error('Get trust badge error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /seller/analytics
 * Returns real aggregated data: monthly revenue, total revenue,
 * top 5 listings, active listing count, and recent orders.
 */
export const getSellerAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
    const sellerId = req.user!.id;

    try {
        // ── Listings ─────────────────────────────────────────────
        const [allProducts, totalActiveListings] = await Promise.all([
            prisma.product.findMany({
                where: { sellerId },
                select: { id: true, title: true, price: true, category: true, createdAt: true, imageUrl: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where: { sellerId } }),
        ]);

        const topListings = [...allProducts]
            .sort((a, b) => b.price - a.price)
            .slice(0, 5);

        const portfolioValue = allProducts.reduce((s, p) => s + p.price, 0);
        const avgPrice = allProducts.length ? portfolioValue / allProducts.length : 0;
        const maxPrice = allProducts.length ? Math.max(...allProducts.map((p) => p.price)) : 0;
        const priceRanges = [
            { name: 'Under $50',  count: allProducts.filter((p) => p.price < 50).length },
            { name: '$50–$200',   count: allProducts.filter((p) => p.price >= 50 && p.price < 200).length },
            { name: '$200–$500',  count: allProducts.filter((p) => p.price >= 200 && p.price < 500).length },
            { name: '$500+',      count: allProducts.filter((p) => p.price >= 500).length },
        ].filter((r) => r.count > 0);

        // ── Orders ────────────────────────────────────────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const [completedOrdersWindow, allCompletedOrders, recentOrders] = await Promise.all([
            prisma.order.findMany({
                // Count all non-cancelled orders so legacy pending rows still appear
                // and newer completed rows are reflected immediately.
                where: { primarySellerId: sellerId, status: { not: 'CANCELLED' }, createdAt: { gte: sixMonthsAgo } },
                select: { totalAmount: true, createdAt: true },
            }),
            prisma.order.findMany({
                where: { primarySellerId: sellerId, status: { not: 'CANCELLED' } },
                select: {
                    totalAmount: true,
                    items: { select: { quantity: true } },
                    buyer: { select: { id: true, name: true } },
                },
            }),
            prisma.order.findMany({
                where: { primarySellerId: sellerId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true,
                    items: {
                        take: 1,
                        select: {
                            quantity: true,
                            product: { select: { id: true, title: true, imageUrl: true } },
                        },
                    },
                    buyer: { select: { id: true, name: true } },
                },
            }),
        ]);

        // Build last-6-months buckets
        const monthlyRevenue: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            monthlyRevenue.push({
                month: d.toLocaleString('en-US', { month: 'short' }),
                revenue: 0,
            });
        }
        for (const order of completedOrdersWindow) {
            const label = new Date(order.createdAt).toLocaleString('en-US', { month: 'short' });
            const entry = monthlyRevenue.find((m) => m.month === label);
            if (entry) entry.revenue += order.totalAmount;
        }

        const totalRevenue = allCompletedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalCompletedSales = allCompletedOrders.reduce((sum, o) => sum + o.items.reduce((itemsSum, item) => itemsSum + item.quantity, 0), 0);

        const buyerStatsMap = new Map<string, { buyerId: string; buyerName: string; totalQuantity: number; totalSpent: number }>();
        for (const order of allCompletedOrders) {
            const existing = buyerStatsMap.get(order.buyer.id);
            if (existing) {
                existing.totalQuantity += order.items.reduce((itemsSum, item) => itemsSum + item.quantity, 0);
                existing.totalSpent += order.totalAmount;
            } else {
                buyerStatsMap.set(order.buyer.id, {
                    buyerId: order.buyer.id,
                    buyerName: order.buyer.name,
                    totalQuantity: order.items.reduce((itemsSum, item) => itemsSum + item.quantity, 0),
                    totalSpent: order.totalAmount,
                });
            }
        }

        const topBuyers = [...buyerStatsMap.values()]
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 5);

        res.json({
            totalActiveListings,
            totalRevenue,
            totalCompletedSales,
            portfolioValue,
            avgPrice,
            maxPrice,
            priceRanges,
            monthlyRevenue,
            topListings,
            recentOrders,
            topBuyers,
        });
    } catch (err) {
        console.error('Get seller analytics error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /seller/products/:id/generate-qr
 * Seller generates a payment QR for one product.
 */
export const generateProductPaymentQr = async (req: AuthRequest, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const id = resolveParamId(req.params.id);

    if (!id) {
        res.status(400).json({ error: 'Invalid product id' });
        return;
    }

    const parsed = generateQrSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, title: true, price: true, sellerId: true },
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (product.sellerId !== sellerId) {
            res.status(403).json({ error: 'Forbidden: You do not own this product' });
            return;
        }

        // Generate QR payment text
        const paymentText = generatePaymentText(product.id, sellerId, product.price, product.title);
        const qrCodeUrl = buildQrCodeUrl(paymentText);

        // Update product with new QR code
        const updated = await prisma.product.update({
            where: { id: product.id },
            data: {
                paymentQrText: paymentText,
                paymentQrCode: qrCodeUrl,
            },
        });

        res.json({
            message: 'Payment QR regenerated successfully',
            productId: product.id,
            paymentQrCode: updated.paymentQrCode,
            hasPaymentQr: true,
        });
    } catch (err) {
        console.error('Generate product payment QR error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /seller/orders
 * Create a buyer checkout order after address and payment confirmation.
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    const buyerId = req.user!.id;
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const { items, deliveryAddress } = parsed.data;
    const mergedItems = items.reduce<Array<{ productId: string; quantity: number }>>((acc, item) => {
        const existing = acc.find((entry) => entry.productId === item.productId);
        if (existing) {
            existing.quantity += item.quantity;
            return acc;
        }

        acc.push({ productId: item.productId, quantity: item.quantity });
        return acc;
    }, []);

    try {
        const products = await prisma.product.findMany({
            where: { id: { in: mergedItems.map((item) => item.productId) } },
            select: { id: true, title: true, price: true, sellerId: true, stock: true },
        });

        if (products.length !== mergedItems.length) {
            res.status(404).json({ error: 'One or more products were not found' });
            return;
        }

        const quantityByProductId = new Map(mergedItems.map((item) => [item.productId, item.quantity]));

        if (products.some((product) => product.sellerId === buyerId)) {
            res.status(400).json({ error: 'You cannot order your own product' });
            return;
        }

        const stockIssue = products.find((product) => (quantityByProductId.get(product.id) ?? 0) > product.stock);
        if (stockIssue) {
            const requestedQuantity = quantityByProductId.get(stockIssue.id) ?? 0;
            res.status(400).json({ error: `Only ${stockIssue.stock} item(s) left in stock for ${stockIssue.title} (requested ${requestedQuantity})` });
            return;
        }

        const totalAmount = products.reduce((sum, product) => {
            const quantity = quantityByProductId.get(product.id) ?? 0;
            return sum + product.price * quantity;
        }, 0);

        const createdOrder = await prisma.$transaction(async (tx) => {
            const address = await tx.address.create({
                data: {
                    fullName: deliveryAddress.fullName,
                    phoneNumber: deliveryAddress.phoneNumber,
                    streetAddress: deliveryAddress.streetAddress,
                    city: deliveryAddress.city,
                    state: deliveryAddress.state,
                    pincode: deliveryAddress.pincode,
                },
            });

            for (const product of products) {
                const quantity = quantityByProductId.get(product.id) ?? 0;
                const updatedCount = await tx.product.updateMany({
                    where: {
                        id: product.id,
                        stock: { gte: quantity },
                    },
                    data: {
                        stock: { decrement: quantity },
                    },
                });

                if (updatedCount.count === 0) {
                    throw new Error('INSUFFICIENT_STOCK');
                }
            }

            const order = await tx.order.create({
                data: {
                    buyerId,
                    totalAmount,
                    status: 'PLACED',
                    paymentMethod: 'QR',
                    addressId: address.id,
                    primarySellerId: products[0]?.sellerId ?? null,
                },
            });

            await tx.orderItem.createMany({
                data: products.map((product) => {
                    const quantity = quantityByProductId.get(product.id) ?? 0;
                    const lineTotal = product.price * quantity;

                    return {
                        orderId: order.id,
                        productId: product.id,
                        sellerId: product.sellerId,
                        quantity,
                        unitPrice: product.price,
                        lineTotal,
                    };
                }),
            });

            return order;
        });

        const orderWithDetails = await prisma.order.findUnique({
            where: { id: createdOrder.id },
            include: {
                address: true,
                items: {
                    include: {
                        product: { select: { id: true, title: true, imageUrl: true, price: true } },
                        seller: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!orderWithDetails) {
            res.status(500).json({ error: 'Failed to load created order' });
            return;
        }

        emitOrderPlaced({
            id: orderWithDetails.id,
            buyerId: orderWithDetails.buyerId,
            totalAmount: orderWithDetails.totalAmount,
            itemCount: orderWithDetails.items.reduce((sum, item) => sum + item.quantity, 0),
            status: orderWithDetails.status,
            createdAt: orderWithDetails.createdAt.toISOString(),
            primarySellerId: orderWithDetails.primarySellerId,
        });

        res.status(201).json({
            message: 'Order placed successfully',
            order: orderWithDetails,
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'INSUFFICIENT_STOCK') {
            res.status(400).json({ error: 'Insufficient stock for this order' });
            return;
        }

        console.error('Create order error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /seller/orders/:id
 * Returns a single buyer order with address and items.
 */
export const getBuyerOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    const buyerId = req.user!.id;
    const id = resolveParamId(req.params.id);

    if (!id) {
        res.status(400).json({ error: 'Order id is required' });
        return;
    }

    try {
        const order = await prisma.order.findFirst({
            where: { id, buyerId },
            include: {
                address: true,
                items: {
                    include: {
                        product: { select: { id: true, title: true, imageUrl: true, price: true } },
                        seller: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json(mapOrderForBuyerView(order));
    } catch (err) {
        console.error('Get buyer order by id error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /seller/orders/history
 * Returns the authenticated buyer's purchase history and summary stats.
 */
export const getBuyerOrderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    const buyerId = req.user!.id;

    try {
        const orders = await prisma.order.findMany({
            where: {
                buyerId,
                status: { not: 'CANCELLED' },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                address: true,
                items: {
                    include: {
                        product: { select: { id: true, title: true, imageUrl: true, price: true } },
                        seller: { select: { id: true, name: true } },
                    },
                },
            },
        });

        const mappedOrders = orders.map(mapOrderForBuyerView);
        const totalItemsBought = mappedOrders.reduce((sum, order) => sum + order.quantity, 0);
        const totalAmountSpent = mappedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.json({
            summary: {
                totalOrders: mappedOrders.length,
                totalItemsBought,
                totalAmountSpent,
            },
            orders: mappedOrders,
        });
    } catch (err) {
        console.error('Get buyer order history error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
