import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

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

export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [totalUsers, totalProducts, recentUsers, recentProducts] = await Promise.all([
            prisma.user.count(),
            prisma.product.count(),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, userType: true, isSeller: true, createdAt: true },
            }),
            prisma.product.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { seller: { select: { name: true } } },
            }),
        ]);

        const totalSellers = await prisma.user.count({
            where: {
                OR: [
                    { userType: { in: ['SELLER', 'BOTH'] } },
                    { isSeller: true },
                ],
            },
        });

        res.json({
            stats: {
                totalUsers,
                totalProducts,
                totalSellers,
            },
            recentUsers,
            recentProducts,
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                userType: true,
                isSeller: true,
                createdAt: true,
                _count: { select: { products: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const id = resolveParamId(req.params.id);

    if (!id) {
        res.status(400).json({ error: 'Invalid user id' });
        return;
    }

    if (id === req.user!.id) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAdminProducts = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                seller: { select: { id: true, name: true, email: true } },
            },
        });
        res.json(products);
    } catch (err) {
        console.error('Get admin products error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
