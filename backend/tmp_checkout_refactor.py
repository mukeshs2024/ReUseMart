from pathlib import Path
import re

path = Path(r'c:\ReUseMart-\backend\src\controllers\seller.controller.ts')
text = path.read_text(encoding='utf-8')

head_pattern = re.compile(r"(?s)const createOrderSchema = z\.object\(\{.*?export const activateSeller = async \(req: AuthRequest, res: Response\): Promise<void> => \{")
head_replacement = '''const checkoutItemSchema = z.object({
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

export const activateSeller = async (req: AuthRequest, res: Response): Promise<void> => {'''
text, count = head_pattern.subn(head_replacement, text, count=1)
if count != 1:
    raise SystemExit(f'head replacement count={count}')

tail_pattern = re.compile(r"(?s)/\*\*\n \* POST /seller/orders.*\Z")
tail_replacement = '''/**
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
'''
text, count = tail_pattern.subn(tail_replacement, text, count=1)
if count != 1:
    raise SystemExit(f'tail replacement count={count}')

path.write_text(text, encoding='utf-8')
print('updated', path)
