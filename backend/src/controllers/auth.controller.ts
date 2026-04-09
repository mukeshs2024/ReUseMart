import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const { name, email, password } = parsed.data;

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'An account with this email already exists' });
            return;
        }

        const hashed = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                userType: 'BUYER',
                isSeller: false,
                activeMode: 'BUYER',
            },
        });

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            userType: user.userType,
            isSeller: user.isSeller,
            activeMode: user.activeMode,
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.userType,
                isSeller: user.isSeller,
                activeMode: user.activeMode,
            },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const { email, password } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            userType: user.userType,
            isSeller: user.isSeller,
            activeMode: user.activeMode,
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.userType,
                isSeller: user.isSeller,
                activeMode: user.activeMode,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PATCH /auth/mode  — persist lastActiveMode for the logged-in user
export const switchMode = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { mode } = req.body as { mode?: 'BUYER' | 'SELLER' };
    if (mode !== 'BUYER' && mode !== 'SELLER') {
        res.status(400).json({ error: 'mode must be BUYER or SELLER' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }

        const canUseSellerMode = user.userType === 'SELLER' || user.userType === 'BOTH' || user.isSeller;
        const canUseBuyerMode = user.userType === 'BUYER' || user.userType === 'BOTH' || !user.isSeller;

        if (mode === 'SELLER' && !canUseSellerMode) {
            res.status(403).json({ error: 'User is not a seller' });
            return;
        }

        if (mode === 'BUYER' && !canUseBuyerMode) {
            res.status(403).json({ error: 'User is not a buyer' });
            return;
        }

        // Backward compatibility: promote legacy seller accounts to BOTH when they switch into seller mode.
        const nextUserType = mode === 'SELLER' && user.userType === 'BUYER' && user.isSeller
            ? 'BOTH'
            : user.userType;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                activeMode: mode,
                userType: nextUserType,
            },
        });

        res.json({ activeMode: updated.activeMode, userType: updated.userType });
    } catch (err) {
        console.error('switchMode error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// In-memory password reset code store (in production, use Redis or database)
const resetCodeStore: Record<string, { code: string; expiresAt: number }> = {};

// Generate a random reset code
function generateResetCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /auth/forgot-password — Request password reset
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = z
        .object({ email: z.string().email('Invalid email address') })
        .safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const { email } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if email exists (security)
            res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
            return;
        }

        // Generate reset code (valid for 10 minutes)
        const code = generateResetCode();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        resetCodeStore[email] = { code, expiresAt };

        // Integrate your email provider here to deliver the reset code.
        res.json({
            message: 'If an account exists with that email, a reset code has been sent.',
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /auth/reset-password — Reset password with code
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = z
        .object({
            email: z.string().email('Invalid email address'),
            resetCode: z.string().length(6, 'Reset code must be 6 characters'),
            newPassword: z
                .string()
                .min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .regex(/[0-9]/, 'Password must contain at least one number'),
        })
        .safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
        return;
    }

    const { email, resetCode, newPassword } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or reset code' });
            return;
        }

        // Verify reset code
        const stored = resetCodeStore[email];
        if (!stored || stored.code !== resetCode || stored.expiresAt < Date.now()) {
            res.status(401).json({ error: 'Invalid or expired reset code' });
            return;
        }

        // Hash new password
        const hashed = await bcrypt.hash(newPassword, 12);

        // Update user password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed },
        });

        // Delete reset code
        delete resetCodeStore[email];

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
