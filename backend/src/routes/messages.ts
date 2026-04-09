import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSeller } from '../middleware/sellerGuard';
import { requireBuyerMode } from '../middleware/buyerGuard';
import {
    sendMessage,
    getInbox,
    getUnreadCount,
    getSent,
    replyMessage,
    getConversations,
    getConversationMessages,
    getUnreadCountForUser,
} from '../controllers/messages.controller';

const router = Router();

router.use(authenticate);

// Buyer mode routes
router.post('/', requireBuyerMode, sendMessage);
router.get('/sent', requireBuyerMode, getSent);

// Seller mode routes
router.get('/inbox', requireSeller, getInbox);
router.get('/inbox/unread-count', requireSeller, getUnreadCount);

// Shared chat routes (buyer and seller)
router.post('/reply', replyMessage);
router.get('/conversations', getConversations);
router.get('/conversations/:productId/:otherUserId', getConversationMessages);
router.get('/unread-count', getUnreadCountForUser);

export default router;
