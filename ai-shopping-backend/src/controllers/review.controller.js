import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'
import { paginate } from '../utils/pagination.js'

/**
 * Recalculate and update product rating after a review change.
 */
const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'active' } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ])

  const avgRating = result[0] ? Math.round(result[0].avgRating * 10) / 10 : 0
  const reviewCount = result[0] ? result[0].totalReviews : 0

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    reviewCount,
  })

  return { avgRating, reviewCount }
}

/**
 * @route   GET /api/v1/reviews/:productId
 * @desc    Get all active reviews for a product (paginated)
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid product ID format.')
  }

  const { page, limit, sort } = req.query

  let sortOptions = { createdAt: -1 }
  if (sort === 'helpful') sortOptions = { helpfulCount: -1, createdAt: -1 }
  if (sort === 'highest') sortOptions = { rating: -1, createdAt: -1 }
  if (sort === 'lowest') sortOptions = { rating: 1, createdAt: -1 }

  const query = { productId, status: 'active' }

  const result = await paginate(
    Review,
    query,
    page,
    limit,
    { path: 'userId', select: 'name createdAt' },
    sortOptions
  )

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'active' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ])

  const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  distribution.forEach(d => { ratingDist[d._id] = d.count })

  return successResponse(res, 200, 'Reviews retrieved.', {
    reviews: result.data,
    pagination: result.pagination,
    ratingDistribution: ratingDist,
  })
})

/**
 * @route   POST /api/v1/reviews/:productId
 * @desc    Create a review (authenticated users only)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params
  const userId = req.user.id
  const { rating, title, body } = req.body

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid product ID format.')
  }

  // Validate rating
  const numRating = Number(rating)
  if (!numRating || numRating < 1 || numRating > 5) {
    return errorResponse(res, 400, 'Rating must be a number between 1 and 5.')
  }

  // Check product exists and is active
  const product = await Product.findById(productId).lean()
  if (!product || product.status !== 'active') {
    return errorResponse(res, 404, 'Product not found.')
  }

  // Check if user already reviewed this product
  const existing = await Review.findOne({ productId, userId })
  if (existing) {
    return errorResponse(res, 409, 'You have already reviewed this product.')
  }

  const review = await Review.create({
    productId,
    userId,
    rating: numRating,
    title: title?.trim() || '',
    body: body?.trim() || '',
  })

  // Update product rating
  await recalculateProductRating(productId)

  // Populate user info before returning
  await review.populate('userId', 'name')

  return successResponse(res, 201, 'Review submitted successfully.', { review })
})

/**
 * @route   PUT /api/v1/reviews/:productId
 * @desc    Update own review
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { productId } = req.params
  const userId = req.user.id
  const { rating, title, body } = req.body

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid product ID format.')
  }

  const review = await Review.findOne({ productId, userId })
  if (!review) {
    return errorResponse(res, 404, 'Review not found.')
  }

  if (rating !== undefined) {
    const numRating = Number(rating)
    if (numRating < 1 || numRating > 5) {
      return errorResponse(res, 400, 'Rating must be between 1 and 5.')
    }
    review.rating = numRating
  }
  if (title !== undefined) review.title = title.trim()
  if (body !== undefined) review.body = body.trim()

  await review.save()
  await recalculateProductRating(productId)
  await review.populate('userId', 'name')

  return successResponse(res, 200, 'Review updated successfully.', { review })
})

/**
 * @route   DELETE /api/v1/reviews/:productId
 * @desc    Delete own review
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { productId } = req.params
  const userId = req.user.id

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid product ID format.')
  }

  const review = await Review.findOne({ productId, userId })
  if (!review) {
    return errorResponse(res, 404, 'Review not found.')
  }

  await review.deleteOne()
  await recalculateProductRating(productId)

  return successResponse(res, 200, 'Review deleted successfully.')
})

/**
 * @route   PATCH /api/v1/reviews/:reviewId/helpful
 * @desc    Mark a review as helpful (any authenticated user)
 */
export const markHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return errorResponse(res, 400, 'Invalid review ID format.')
  }

  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $inc: { helpfulCount: 1 } },
    { new: true }
  )

  if (!review) {
    return errorResponse(res, 404, 'Review not found.')
  }

  return successResponse(res, 200, 'Marked as helpful.', { helpfulCount: review.helpfulCount })
})

/**
 * @route   GET /api/v1/reviews/:productId/my-review
 * @desc    Get current user's review for a product
 */
export const getMyReview = asyncHandler(async (req, res) => {
  const { productId } = req.params
  const userId = req.user.id

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid product ID format.')
  }

  const review = await Review.findOne({ productId, userId })
    .populate('userId', 'name')
    .lean()

  return successResponse(res, 200, 'My review retrieved.', { review: review || null })
})
