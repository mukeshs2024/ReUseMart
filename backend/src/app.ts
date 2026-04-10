import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import sellerRoutes from './routes/seller';
import adminRoutes from './routes/admin';
import messageRoutes from './routes/messages';

const app = express();

// --- Middleware ---
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