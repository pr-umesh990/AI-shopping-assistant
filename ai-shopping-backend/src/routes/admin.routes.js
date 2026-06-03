import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { getStats } from '../controllers/admin/dashboard.controller.js';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/admin/product.admin.controller.js';
import {
  getRevenueByCategory,
  getTrafficChannels,
  getAffiliateMilestone,
  exportReport,
} from '../controllers/admin/analytics.controller.js';

const router = Router();

// All admin routes require auth + admin role
router.use(protect, requireRole('admin'));

// Dashboard
router.get('/stats', getStats);

// Product management
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Analytics
router.get('/analytics/revenue-by-category', getRevenueByCategory);
router.get('/analytics/traffic-channels', getTrafficChannels);
router.get('/analytics/affiliate-milestone', getAffiliateMilestone);

// Reports
router.get('/reports/export', exportReport);

export default router;
