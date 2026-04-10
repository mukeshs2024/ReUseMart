import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import sellerRoutes from './routes/seller';
import adminRoutes from './routes/admin';
import messageRoutes from './routes/messages';

const app = express();

const getAllowedOrigins = (): string[] => {
    return [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
    ].filter((origin): origin is string => Boolean(origin));
};

const isVercelPreviewOrigin = (origin: string): boolean => {
    try {
        const { hostname } = new URL(origin);
        return hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
};

// --- Middleware ---
app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();
    const isAllowedOrigin = !origin || allowedOrigins.includes(origin) || isVercelPreviewOrigin(origin);

    if (origin && isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (!isAllowedOrigin && origin) {
        res.status(403).json({ error: 'Origin not allowed' });
        return;
    }

    next();
});

app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// --- Health check ---
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- 404 handler ---
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// --- Global error handler ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

export default app;