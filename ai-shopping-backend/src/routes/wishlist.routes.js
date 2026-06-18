import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, toggleAlert, getRecommendations,} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All wishlist routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.patch('/:productId/alert', toggleAlert);
router.get('/recommendations', getRecommendations);

export default router;
