import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
    }
    next();
};
