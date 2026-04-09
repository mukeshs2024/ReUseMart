import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../config/jwt';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    verifyTokenAndAttachUser(token, req, res, next);
};

async function verifyTokenAndAttachUser(
    token: string,
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const decoded = verifyToken(token);

        // Prevent stale-token issues when users were deleted/recreated (e.g. after reseeding).
        const existingUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, userType: true, isSeller: true, activeMode: true },
        });

        if (!existingUser) {
            res.status(401).json({ error: 'Unauthorized: User no longer exists. Please log in again.' });
            return;
        }

        req.user = {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            userType: existingUser.userType,
            isSeller: existingUser.isSeller,
            activeMode: existingUser.activeMode,
        } as JwtPayload;

        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
}
