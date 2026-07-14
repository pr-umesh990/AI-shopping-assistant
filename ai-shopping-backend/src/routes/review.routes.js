import { Router } from 'express'
import { getProductReviews, createReview, updateReview, deleteReview, markHelpful, getMyReview} from '../controllers/review.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// Public
router.get('/:productId', getProductReviews)

// Protected
router.post('/:productId', protect, createReview)
router.put('/:productId', protect, updateReview)
router.delete('/:productId', protect, deleteReview)
router.get('/:productId/my-review', protect, getMyReview)
router.patch('/:reviewId/helpful', protect, markHelpful)

export default router