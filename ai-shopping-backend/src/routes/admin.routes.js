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
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../controllers/admin/category.admin.controller.js';
import {
  getSubcategoriesByCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderSubcategories,
} from '../controllers/admin/subcategory.admin.controller.js';

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

// Category management
router.get('/categories', getAdminCategories);
router.post('/categories', createAdminCategory);
router.put('/categories/:id', updateAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

// Subcategory management
router.get('/subcategories', getSubcategoriesByCategory);
router.patch('/subcategories/reorder', reorderSubcategories);
router.post('/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

// Analytics
router.get('/analytics/revenue-by-category', getRevenueByCategory);
router.get('/analytics/traffic-channels', getTrafficChannels);
router.get('/analytics/affiliate-milestone', getAffiliateMilestone);

// Reports
router.get('/reports/export', exportReport);

export default router;
