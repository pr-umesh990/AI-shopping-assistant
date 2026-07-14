import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import subcategoryRoutes from './subcategory.routes.js';
import searchRoutes from './search.routes.js';
import compareRoutes from './compare.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import affiliateRoutes from './affiliate.routes.js';
import newsletterRoutes from './newsletter.routes.js';
import adminRoutes from './admin.routes.js';
import reviewRoutes from './review.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/search', searchRoutes);
router.use('/compare', compareRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/affiliate', affiliateRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

export default router;
