import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireSeller = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const canActAsSeller = Boolean(
        req.user && (
            req.user.userType === 'SELLER'
            || req.user.userType === 'BOTH'
            || req.user.isSeller
        )
    );

    if (!req.user || !canActAsSeller || req.user.activeMode !== 'SELLER') {
        res.status(403).json({ error: 'Forbidden: Seller mode required. Please activate seller mode first.' });
        return;
    }
    next();
};
