import { Router } from 'express';
import {
  getProducts,
  getTrending,
  getProduct,
  getPriceHistory,
  getAiReview,
  getAlternatives,
} from '../controllers/product.controller.js';
import { cache } from '../middleware/cache.middleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/trending', cache(1800), getTrending); // 30 min cache
router.get('/:id', getProduct);
router.get('/:id/price-history', getPriceHistory);
router.get('/:id/ai-review', getAiReview);
router.get('/:id/alternatives', getAlternatives);

export default router;
