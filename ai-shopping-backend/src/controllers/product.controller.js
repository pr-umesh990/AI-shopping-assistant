import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import PriceHistory from '../models/PriceHistory.js';
import AiReview from '../models/AiReview.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { paginate } from '../utils/pagination.js';
import { generateAiReview } from '../services/ai.service.js';

/**
 * @route   GET /api/v1/products
 * @desc    Get products with filtering, sorting, pagination
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    subcategory,
    brand,
    priceMin,
    priceMax,
    rating,
    sort,
    page,
    limit,
    search,
  } = req.query;

  const query = { status: 'active' };

  // Category filter by slug
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean();
    if (cat) {
      query.categoryId = cat._id;
    }
  }

  // Subcategory filter — param name kept as 'subcategory' for backwards compat
  // but now treated as an ObjectId (subcategoryId)
  if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) {
    query.subcategoryId = subcategory;
  }

  // Brand filter (comma-separated)
  if (brand) {
    const brands = brand.split(',').map((b) => b.trim());
    query.brand = { $in: brands };
  }

  // Price range
  if (priceMin || priceMax) {
    query.currentPrice = {};
    if (priceMin) query.currentPrice.$gte = parseFloat(priceMin);
    if (priceMax) query.currentPrice.$lte = parseFloat(priceMax);
  }

  // Minimum rating
  if (rating) {
    const minRating = parseFloat(rating);
    if (minRating >= 1 && minRating <= 5) {
      query.rating = { $gte: minRating };
    }
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Sort options
  let sortOptions = { createdAt: -1 };
  if (sort) {
    switch (sort) {
      case 'price_asc':
        sortOptions = { currentPrice: 1 };
        break;
      case 'price_desc':
        sortOptions = { currentPrice: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
  }

  const result = await paginate(
    Product,
    query,
    page,
    limit,
    [
      { path: 'categoryId', select: 'name slug' },
      { path: 'subcategoryId', select: 'name slug' },
    ],
    sortOptions
  );

  return successResponse(res, 200, 'Products retrieved.', result);
});

/**
 * @route   GET /api/v1/products/trending
 * @desc    Get trending products (up to 8)
 */
export const getTrending = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'active', isTrending: true })
    .sort({ rating: -1 })
    .limit(8)
    .populate('categoryId', 'name slug')
    .populate('subcategoryId', 'name slug')
    .lean();

  return successResponse(res, 200, 'Trending products retrieved.', { products });
});

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product by ID
 */
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const product = await Product.findById(id)
    .populate('categoryId', 'name slug')
    .populate('subcategoryId', 'name slug')
    .lean();

  if (!product || product.status === 'disabled') {
    return errorResponse(res, 404, 'Product not found.');
  }

  return successResponse(res, 200, 'Product retrieved.', { product });
});

/**
 * @route   GET /api/v1/products/:id/price-history
 * @desc    Get price history for last 180 days
 */
export const getPriceHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const product = await Product.findById(id).select('name currentPrice').lean();
  if (!product) {
    return errorResponse(res, 404, 'Product not found.');
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

  const history = await PriceHistory.find({
    productId: id,
    recordedAt: { $gte: sixMonthsAgo },
  })
    .sort({ recordedAt: 1 })
    .lean();

  let lowestPrice = null;
  let highestPrice = null;

  if (history.length > 0) {
    const prices = history.map((h) => h.price);
    lowestPrice = Math.min(...prices);
    highestPrice = Math.max(...prices);
  }

  return successResponse(res, 200, 'Price history retrieved.', {
    productName: product.name,
    currentPrice: product.currentPrice,
    history,
    stats: { lowestPrice, highestPrice, dataPoints: history.length },
  });
});

/**
 * @route   GET /api/v1/products/:id/ai-review
 * @desc    Get AI review for a product (generate if missing or stale)
 */
export const getAiReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const product = await Product.findById(id).lean();
  if (!product) {
    return errorResponse(res, 404, 'Product not found.');
  }

  let review = await AiReview.findOne({ productId: id }).lean();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (!review || (review.generatedAt && new Date(review.generatedAt) < sevenDaysAgo)) {
    // Trigger async generation — don't block response if we have an old review
    const generatePromise = generateAiReview(id);

    if (!review) {
      // No existing review — wait for generation
      const newReview = await generatePromise;
      if (newReview) {
        review = newReview.toObject ? newReview.toObject() : newReview;
      } else {
        return errorResponse(res, 503, 'AI service temporarily unavailable. Please try again later.');
      }
    }
    // If we have a stale review, return it and let the generation happen in the background
  }

  return successResponse(res, 200, 'AI review retrieved.', { review });
});

/**
 * @route   GET /api/v1/products/:id/alternatives
 * @desc    Get alternative products in the same category
 */
export const getAlternatives = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const product = await Product.findById(id).select('categoryId').lean();
  if (!product) {
    return errorResponse(res, 404, 'Product not found.');
  }

  const alternatives = await Product.find({
    status: 'active',
    categoryId: product.categoryId,
    _id: { $ne: id },
  })
    .sort({ rating: -1 })
    .limit(4)
    .populate('categoryId', 'name slug')
    .populate('subcategoryId', 'name slug')
    .lean();

  return successResponse(res, 200, 'Alternative products retrieved.', { alternatives });
});
