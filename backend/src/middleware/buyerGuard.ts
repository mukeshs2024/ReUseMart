import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireBuyerMode = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void => {
    const canActAsBuyer = Boolean(
        req.user && (
            req.user.userType === 'BUYER'
            || req.user.userType === 'BOTH'
            || !req.user.isSeller
        )
    );

    if (!req.user || !canActAsBuyer || req.user.activeMode !== 'BUYER') {
        res.status(403).json({ error: 'Forbidden: Buyer mode required. Please switch to buyer mode first.' });
        return;
    }

    next();
};