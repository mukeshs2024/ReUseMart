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
    category: z.enum(['ELECTRONICS', 'MOBILES', 'FURNITURE', 'FASHION', 'ACCESSORIES']),
    condition: z.enum(['LIKE_NEW', 'USED', 'OLD', 'TOO_OLD']),
    imageUrl: z.string().url('Image URL must be a valid URL'),
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

const createOrderSchema = z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.number().int().min(1).max(20).optional(),
});

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

        const badge = {
            userType: user.userType,
            verified: user.isPhoneVerified,
            trustScore: user.trustScore,
            level: user.sellerLevel,
            badges: [] as string[],
        };

        // Determine badges based on trust score and level
        if (user.isPhoneVerified) {
            badge.badges.push('verified');
        }

        if (user.sellerLevel === 'TRUSTED' && user.trustScore >= 50) {
            badge.badges.push('trusted-seller');
        }

        if (user.sellerLevel === 'PRO' && user.trustScore >= 80) {
            badge.badges.push('pro-seller');
        }

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
                where: { sellerId, status: { not: 'CANCELLED' }, createdAt: { gte: sixMonthsAgo } },
                select: { amount: true, createdAt: true },
            }),
            prisma.order.findMany({
                where: { sellerId, status: { not: 'CANCELLED' } },
                select: {
                    amount: true,
                    quantity: true,
                    buyer: { select: { id: true, name: true } },
                },
            }),
            prisma.order.findMany({
                where: { sellerId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    quantity: true,
                    status: true,
                    createdAt: true,
                    product: { select: { id: true, title: true, imageUrl: true } },
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
            if (entry) entry.revenue += order.amount;
        }

        const totalRevenue = allCompletedOrders.reduce((sum, o) => sum + o.amount, 0);
        const totalCompletedSales = allCompletedOrders.reduce((sum, o) => sum + o.quantity, 0);

        const buyerStatsMap = new Map<string, { buyerId: string; buyerName: string; totalQuantity: number; totalSpent: number }>();
        for (const order of allCompletedOrders) {
            const existing = buyerStatsMap.get(order.buyer.id);
            if (existing) {
                existing.totalQuantity += order.quantity;
                existing.totalSpent += order.amount;
            } else {
                buyerStatsMap.set(order.buyer.id, {
                    buyerId: order.buyer.id,
                    buyerName: order.buyer.name,
                    totalQuantity: order.quantity,
                    totalSpent: order.amount,
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
 * Create a buyer order for a product.
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    const buyerId = req.user!.id;
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const { productId, quantity = 1 } = parsed.data;

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, price: true, sellerId: true, stock: true },
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        if (product.sellerId === buyerId) {
            res.status(400).json({ error: 'You cannot order your own product' });
            return;
        }

        if (product.stock < quantity) {
            res.status(400).json({ error: `Only ${product.stock} item(s) left in stock` });
            return;
        }

        const order = await prisma.$transaction(async (tx) => {
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

            return tx.order.create({
                data: {
                    productId: product.id,
                    buyerId,
                    sellerId: product.sellerId,
                    quantity,
                    amount: product.price * quantity,
                    // Payment is confirmed client-side before placing the order,
                    // so this order should contribute to seller revenue immediately.
                    status: 'COMPLETED',
                },
            });
        });

        emitOrderPlaced({
            id: order.id,
            productId: order.productId,
            buyerId: order.buyerId,
            sellerId: order.sellerId,
            amount: order.amount,
            quantity: order.quantity,
            status: order.status,
            createdAt: order.createdAt.toISOString(),
        });

        res.status(201).json({
            ...order,
            message: 'Order placed successfully',
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
            select: {
                id: true,
                quantity: true,
                amount: true,
                status: true,
                createdAt: true,
                product: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        price: true,
                    },
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const totalItemsBought = orders.reduce((sum, order) => sum + order.quantity, 0);
        const totalAmountSpent = orders.reduce((sum, order) => sum + order.amount, 0);

        res.json({
            summary: {
                totalOrders: orders.length,
                totalItemsBought,
                totalAmountSpent,
            },
            orders,
        });
    } catch (err) {
        console.error('Get buyer order history error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
