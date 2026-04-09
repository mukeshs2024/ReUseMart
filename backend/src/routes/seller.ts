import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSeller } from '../middleware/sellerGuard';
import { requireBuyerMode } from '../middleware/buyerGuard';
import {
    activateSeller,
    initiateSeller,
    verifySellerOtp,
    completeSellerProfile,
    getSellerProfile,
    getTrustBadge,
    getSellerProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getSellerAnalytics,
    createOrder,
    generateProductPaymentQr,
} from '../controllers/seller.controller';

const router = Router();

// ==================== PUBLIC ONBOARDING ROUTES ====================
// These are available to authenticated users who want to become sellers

// Step 1: Initiate seller onboarding (provide name & phone)
router.post('/onboard/initiate', authenticate, initiateSeller);

// Step 2: Verify OTP
router.post('/onboard/verify-otp', authenticate, verifySellerOtp);

// Step 3: Complete seller profile
router.post('/onboard/complete-profile', authenticate, completeSellerProfile);

// Get seller profile and trust info
router.get('/profile', authenticate, getSellerProfile);

// Get trust badge info
router.get('/trust-badge', authenticate, getTrustBadge);

// ==================== SELLER PRODUCT MANAGEMENT ====================
// All seller product routes require authentication and seller status

// All seller routes require authentication
router.use(authenticate);

// Activate seller mode (legacy, kept for backward compatibility)
router.post('/activate', activateSeller);

// Protected seller CRUD
router.get('/products', requireSeller, getSellerProducts);
router.post('/products', requireSeller, createProduct);
router.put('/products/:id', requireSeller, updateProduct);
router.delete('/products/:id', requireSeller, deleteProduct);
router.post('/products/:id/generate-qr', requireSeller, generateProductPaymentQr);

// Analytics (seller-only)
router.get('/analytics', requireSeller, getSellerAnalytics);

// Orders
router.post('/orders', requireBuyerMode, createOrder);

export default router;
