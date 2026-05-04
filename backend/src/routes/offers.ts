import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import offersController from '../controllers/offers.controller';

const router = Router();

// Create offer (authenticated buyer)
router.post('/', authenticate, offersController.createOffer);

export default router;
