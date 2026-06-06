import { Router } from 'express';
import {
  getSubcategories,
  getSubcategory,
} from '../controllers/subcategory.controller.js';

const router = Router();

// Public routes
router.get('/', getSubcategories);
router.get('/:id', getSubcategory);

export default router;
