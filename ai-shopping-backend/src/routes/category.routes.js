import { Router } from 'express';
import {
  getCategories,
  getCategory,
  getCategoryProducts,
  getCategoryInsight,
} from '../controllers/category.controller.js';
import { cache } from '../middleware/cache.middleware.js';

const router = Router();

router.get('/', cache(3600), getCategories); // 1 hour cache
router.get('/:slug', getCategory);
router.get('/:slug/products', getCategoryProducts);
router.get('/:slug/ai-insight', getCategoryInsight);

export default router;
