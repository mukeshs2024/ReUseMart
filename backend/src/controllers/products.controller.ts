import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

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

const PRODUCT_CATEGORIES = ['ELECTRONICS', 'MOBILES', 'FURNITURE', 'FASHION', 'ACCESSORIES'] as const;
type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const CATEGORY_ALIASES: Record<string, ProductCategory> = {
    ELECTRONICS: 'ELECTRONICS',
    ELECTRONIC: 'ELECTRONICS',
    MOBILES: 'MOBILES',
    MOBILE: 'MOBILES',
    FURNITURE: 'FURNITURE',
    FASHION: 'FASHION',
    ACCESSORIES: 'ACCESSORIES',
    ACCESSORY: 'ACCESSORIES',
};

function parseCategoryQuery(rawCategory: unknown): { category?: ProductCategory; error?: string } {
    if (rawCategory === undefined || rawCategory === null) {
        return {};
    }

    if (Array.isArray(rawCategory)) {
        if (rawCategory.length === 0) {
            return {};
        }
        return parseCategoryQuery(rawCategory[0]);
    }

    if (typeof rawCategory !== 'string') {
        return {
            error: `Invalid category filter. Use one of: ${PRODUCT_CATEGORIES.join(', ')}`,
        };
    }

    const trimmed = rawCategory.trim();
    if (!trimmed || trimmed.toLowerCase() === 'all') {
        return {};
    }

    const normalized = trimmed.toUpperCase().replace(/\s+/g, '_');
    const category = CATEGORY_ALIASES[normalized];

    if (!category) {
        return {
            error: `Invalid category filter. Use one of: ${PRODUCT_CATEGORIES.join(', ')}`,
        };
    }

    return { category };
}

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, error } = parseCategoryQuery(req.query.category);
        if (error) {
            res.status(400).json({ error });
            return;
        }

        const where: Prisma.ProductWhereInput = category ? { category } : {};

        let products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: { id: true, name: true },
                },
            },
        });

        // Ensure all products have QR codes (async but don't wait)
        // This happens in background to not block the response
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
        console.error('Get products error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
        res.status(400).json({ error: 'Product ID is required' });
        return;
    }

    try {
        let product = await prisma.product.findUnique({
            where: { id },
            include: {
                seller: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        console.log(`[getProductById] Found product: ${product.id}, hasQR: ${Boolean(product.paymentQrCode)}`);

        // Ensure product has QR code - auto-generate if missing
        if (!product.paymentQrCode) {
            try {
                const paymentText = generatePaymentText(product.id, product.sellerId, product.price, product.title);
                const qrCodeUrl = buildQrCodeUrl(paymentText);
                
                console.log(`[getProductById] Generating QR for ${product.id}, URL: ${qrCodeUrl.substring(0, 50)}...`);
                
                // Update product with QR code
                const updated = await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        paymentQrText: paymentText,
                        paymentQrCode: qrCodeUrl,
                    },
                });
                
                console.log(`[getProductById] Update successful, paymentQrCode saved: ${Boolean(updated.paymentQrCode)}`);
                
                // Re-fetch to get seller relation
                product = await prisma.product.findUnique({
                    where: { id: product.id },
                    include: {
                        seller: {
                            select: { id: true, name: true },
                        },
                    },
                });
                
                console.log(`[getProductById] Refetched product confirmation, hasQR: ${Boolean(product?.paymentQrCode)}`);
            } catch (err) {
                console.error('[getProductById] Error generating QR:', err);
                // Continue even if QR generation fails
            }
        }

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json({
            ...product,
            hasPaymentQr: Boolean(product.paymentQrCode),
            paymentQrCodeUrl: product.paymentQrCode,
        });
    } catch (err) {
        console.error('[getProductById] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    const q = (req.query.q as string) || '';

    try {
        const { category, error } = parseCategoryQuery(req.query.category);
        if (error) {
            res.status(400).json({ error });
            return;
        }

        const where: Prisma.ProductWhereInput = {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ],
            ...(category ? { category } : {}),
        };

        let products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                seller: {
                    select: { id: true, name: true },
                },
            },
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
        console.error('Search products error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
