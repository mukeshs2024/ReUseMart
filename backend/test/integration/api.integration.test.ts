import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

type AuthTokens = {
    admin: string;
    seller: string;
    buyer: string;
};

const testTag = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testPassword = 'ReuseTest@123';
const adminEmail = `${testTag}.admin@reusemart.test`;
const sellerEmail = `${testTag}.seller@reusemart.test`;
const buyerEmail = `${testTag}.buyer@reusemart.test`;
const cleanupEmails = [adminEmail, sellerEmail, buyerEmail];

let authTokens: AuthTokens;
let electronicsProductId: string;
let furnitureProductId: string;
let testSellerUserId: string;

beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    const adminUser = await prisma.user.create({
        data: {
            name: `${testTag}-admin`,
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    const sellerUser = await prisma.user.create({
        data: {
            name: `${testTag}-seller`,
            email: sellerEmail,
            password: hashedPassword,
            userType: 'BOTH',
            isSeller: true,
            isPhoneVerified: true,
            sellerLevel: 'TRUSTED',
            trustScore: 80,
            activeMode: 'SELLER',
        },
    });
    testSellerUserId = sellerUser.id;

    const buyerUser = await prisma.user.create({
        data: {
            name: `${testTag}-buyer`,
            email: buyerEmail,
            password: hashedPassword,
            userType: 'BUYER',
            isSeller: false,
            activeMode: 'BUYER',
        },
    });

    const electronics = await prisma.product.create({
        data: {
            title: `${testTag} electronics product`,
            description: `${testTag} product used for category filter integration tests`,
            price: 199,
            category: 'ELECTRONICS',
            condition: 'LIKE_NEW',
            imageUrl: 'https://example.com/electronics.jpg',
            sellerId: sellerUser.id,
        },
        select: {
            id: true,
        },
    });

    const furniture = await prisma.product.create({
        data: {
            title: `${testTag} furniture product`,
            description: `${testTag} product used for category filter integration tests`,
            price: 299,
            category: 'FURNITURE',
            condition: 'USED',
            imageUrl: 'https://example.com/furniture.jpg',
            sellerId: sellerUser.id,
        },
        select: {
            id: true,
        },
    });

    electronicsProductId = electronics.id;
    furnitureProductId = furniture.id;

    const adminLoginResponse = await request(app).post('/api/auth/login').send({
        email: adminUser.email,
        password: testPassword,
    });

    const sellerLoginResponse = await request(app).post('/api/auth/login').send({
        email: sellerUser.email,
        password: testPassword,
    });

    const buyerLoginResponse = await request(app).post('/api/auth/login').send({
        email: buyerUser.email,
        password: testPassword,
    });

    if (adminLoginResponse.status !== 200 || !adminLoginResponse.body.token) {
        throw new Error(`Admin login failed during setup: ${adminLoginResponse.status}`);
    }

    if (sellerLoginResponse.status !== 200 || !sellerLoginResponse.body.token) {
        throw new Error(`Seller login failed during setup: ${sellerLoginResponse.status}`);
    }

    if (buyerLoginResponse.status !== 200 || !buyerLoginResponse.body.token) {
        throw new Error(`Buyer login failed during setup: ${buyerLoginResponse.status}`);
    }

    authTokens = {
        admin: adminLoginResponse.body.token as string,
        seller: sellerLoginResponse.body.token as string,
        buyer: buyerLoginResponse.body.token as string,
    };
}, 30_000);

afterAll(async () => {
    await prisma.user.deleteMany({
        where: {
            email: {
                in: cleanupEmails,
            },
        },
    });

    await prisma.$disconnect();
}, 20_000);

describe('products category filtering', () => {
    it('supports label and enum category filters on list endpoint', async () => {
        const labelResponse = await request(app)
            .get('/api/products')
            .query({ category: 'Electronics' })
            .expect(200);

        const enumResponse = await request(app)
            .get('/api/products')
            .query({ category: 'ELECTRONICS' })
            .expect(200);

        expect(Array.isArray(labelResponse.body)).toBe(true);
        expect(Array.isArray(enumResponse.body)).toBe(true);

        expect(labelResponse.body.length).toBeGreaterThan(0);
        expect(enumResponse.body.length).toBeGreaterThan(0);

        expect(labelResponse.body.every((product: { category: string }) => product.category === 'ELECTRONICS')).toBe(true);
        expect(enumResponse.body.every((product: { category: string }) => product.category === 'ELECTRONICS')).toBe(true);

        expect(labelResponse.body.some((product: { id: string }) => product.id === electronicsProductId)).toBe(true);
        expect(enumResponse.body.some((product: { id: string }) => product.id === electronicsProductId)).toBe(true);
    });

    it('applies category filters on search endpoint', async () => {
        const searchResponse = await request(app)
            .get('/api/products/search')
            .query({ q: testTag, category: 'FURNITURE' })
            .expect(200);

        expect(Array.isArray(searchResponse.body)).toBe(true);
        expect(searchResponse.body).toHaveLength(1);
        expect(searchResponse.body[0].id).toBe(furnitureProductId);
        expect(searchResponse.body[0].category).toBe('FURNITURE');
    });

    it('rejects invalid category filters with HTTP 400', async () => {
        const response = await request(app)
            .get('/api/products')
            .query({ category: 'INVALID_CATEGORY' })
            .expect(400);

        expect(response.body.error).toContain('Invalid category filter');
    });
});

describe('guarded id routes', () => {
    it('returns 400 when admin delete receives an invalid user id', async () => {
        const response = await request(app)
            .delete('/api/admin/users/%20')
            .set('Authorization', `Bearer ${authTokens.admin}`)
            .expect(400);

        expect(response.body.error).toBe('Invalid user id');
    });

    it('returns 400 for invalid product id on seller update, delete, and generate-qr routes', async () => {
        const updateResponse = await request(app)
            .put('/api/seller/products/%20')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({})
            .expect(400);

        const deleteResponse = await request(app)
            .delete('/api/seller/products/%20')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .expect(400);

        const qrResponse = await request(app)
            .post('/api/seller/products/%20/generate-qr')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({})
            .expect(400);

        expect(updateResponse.body.error).toBe('Invalid product id');
        expect(deleteResponse.body.error).toBe('Invalid product id');
        expect(qrResponse.body.error).toBe('Invalid product id');
    });

    it('keeps valid seller id routes working after id-guard changes', async () => {
        const response = await request(app)
            .post(`/api/seller/products/${electronicsProductId}/generate-qr`)
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({})
            .expect(200);

        expect(response.body.productId).toBe(electronicsProductId);
        expect(response.body.paymentQrCode).toBeTruthy();
    });

    it('blocks seller-only routes when seller account is switched to buyer mode', async () => {
        const switchToBuyer = await request(app)
            .patch('/api/auth/mode')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({ mode: 'BUYER' })
            .expect(200);

        expect(switchToBuyer.body.activeMode).toBe('BUYER');

        const blocked = await request(app)
            .get('/api/seller/products')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .expect(403);

        expect(blocked.body.error).toContain('Seller mode required');

        const switchToSeller = await request(app)
            .patch('/api/auth/mode')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({ mode: 'SELLER' })
            .expect(200);

        expect(switchToSeller.body.activeMode).toBe('SELLER');
    });
});

describe('mode-based route protection', () => {
    it('blocks buyer-only routes while in seller mode', async () => {
        const messageAttempt = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({
                content: 'Can I buy this listing today?',
                productId: electronicsProductId,
            })
            .expect(403);

        const orderAttempt = await request(app)
            .post('/api/seller/orders')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({ productId: electronicsProductId, quantity: 1 })
            .expect(403);

        expect(messageAttempt.body.error).toContain('Buyer mode required');
        expect(orderAttempt.body.error).toContain('Buyer mode required');
    });

    it('allows buyer-mode routes for buyer accounts and blocks seller inbox access', async () => {
        const messageSent = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .send({
                content: 'Hello seller, I am interested in this product.',
                productId: electronicsProductId,
            })
            .expect(201);

        expect(messageSent.body.productId).toBe(electronicsProductId);
        expect(messageSent.body.buyerId).toBeTruthy();

        const sentMessages = await request(app)
            .get('/api/messages/sent')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .expect(200);

        expect(Array.isArray(sentMessages.body)).toBe(true);
        expect(sentMessages.body.length).toBeGreaterThan(0);

        const sellerInboxBlocked = await request(app)
            .get('/api/messages/inbox')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .expect(403);

        expect(sellerInboxBlocked.body.error).toContain('Seller mode required');
    });

    it('creates buyer orders and reflects them in seller analytics totals', async () => {
        const createOrderResponse = await request(app)
            .post('/api/seller/orders')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .send({
                productId: electronicsProductId,
                quantity: 2,
            })
            .expect(201);

        expect(createOrderResponse.body.status).toBe('COMPLETED');
        expect(createOrderResponse.body.message).toContain('Order placed');

        const analyticsResponse = await request(app)
            .get('/api/seller/analytics')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .expect(200);

        expect(analyticsResponse.body.totalRevenue).toBeGreaterThanOrEqual(398);
        expect(analyticsResponse.body.totalCompletedSales).toBeGreaterThanOrEqual(2);
    });
});

describe('two-way chat conversations', () => {
    it('allows buyer and seller to reply in the same conversation thread', async () => {
        const firstMessage = await request(app)
            .post('/api/messages')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .send({
                content: 'Hi seller, can we discuss this laptop?',
                productId: electronicsProductId,
            })
            .expect(201);

        const buyerId = firstMessage.body.buyer.id as string;
        expect(buyerId).toBeTruthy();

        const sellerConversations = await request(app)
            .get('/api/messages/conversations')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .expect(200);

        expect(Array.isArray(sellerConversations.body)).toBe(true);
        expect(
            sellerConversations.body.some(
                (conversation: { productId: string; counterpartyId: string }) =>
                    conversation.productId === electronicsProductId && conversation.counterpartyId === buyerId
            )
        ).toBe(true);

        await request(app)
            .post('/api/messages/reply')
            .set('Authorization', `Bearer ${authTokens.seller}`)
            .send({
                content: 'Yes, it is available. You can place the order now.',
                productId: electronicsProductId,
                otherUserId: buyerId,
            })
            .expect(201);

        const unreadBeforeReading = await request(app)
            .get('/api/messages/unread-count')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .expect(200);

        expect(unreadBeforeReading.body.count).toBeGreaterThan(0);

        const buyerThread = await request(app)
            .get(`/api/messages/conversations/${electronicsProductId}/${testSellerUserId}`)
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .expect(200);

        expect(Array.isArray(buyerThread.body.messages)).toBe(true);
        expect(
            buyerThread.body.messages.some((message: { senderType: string; content: string }) =>
                message.senderType === 'SELLER' && message.content.includes('available')
            )
        ).toBe(true);

        const unreadAfterReading = await request(app)
            .get('/api/messages/unread-count')
            .set('Authorization', `Bearer ${authTokens.buyer}`)
            .expect(200);

        expect(unreadAfterReading.body.count).toBe(0);
    });
});

describe('user type account behavior', () => {
    it('creates all newly registered users as buyer accounts regardless of requested type', async () => {
        const registrationScenarios = [
            { suffix: 'both', requestedUserType: 'BOTH' },
            { suffix: 'buyer-only', requestedUserType: 'BUYER' },
            { suffix: 'seller-only', requestedUserType: 'SELLER' },
        ] as const;

        for (const scenario of registrationScenarios) {
            const email = `${testTag}.${scenario.suffix}@reusemart.test`;
            cleanupEmails.push(email);

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    name: `${testTag}-${scenario.suffix}`,
                    email,
                    password: testPassword,
                    userType: scenario.requestedUserType,
                })
                .expect(201);

            expect(registerResponse.body.user.userType).toBe('BUYER');
            expect(registerResponse.body.user.isSeller).toBe(false);
            expect(registerResponse.body.user.activeMode).toBe('BUYER');

            const sellerSwitchAttempt = await request(app)
                .patch('/api/auth/mode')
                .set('Authorization', `Bearer ${registerResponse.body.token}`)
                .send({ mode: 'SELLER' })
                .expect(403);

            expect(sellerSwitchAttempt.body.error).toContain('not a seller');
        }
    });
});
