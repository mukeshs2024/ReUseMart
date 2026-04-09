import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminGuard';
import {
    getDashboard,
    getUsers,
    deleteUser,
    getAdminProducts,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/products', getAdminProducts);

export default router;
