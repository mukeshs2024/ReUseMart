import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const runtimeConnectionString = process.env.DATABASE_POOL_URL?.trim() || process.env.DATABASE_URL?.trim();
    if (!runtimeConnectionString) {
        throw new Error('DATABASE_POOL_URL or DATABASE_URL environment variable is required');
    }

    // PrismaClient reads DATABASE_URL from env, so map pool URL to DATABASE_URL when present.
    process.env.DATABASE_URL = runtimeConnectionString;

    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
