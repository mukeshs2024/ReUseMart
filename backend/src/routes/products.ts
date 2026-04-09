import { Router } from 'express';
import {
    getProducts,
    getProductById,
    searchProducts,
} from '../controllers/products.controller';

const router = Router();

// Order matters: /search before /:id
router.get('/search', searchProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
