import Category from '../models/Category.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { paginate } from '../utils/pagination.js';
import { generateCategoryInsight } from '../services/ai.service.js';

/**
 * @route   GET /api/v1/categories
 * @desc    Get all top-level categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parentCategory: null })
    .sort({ name: 1 })
    .lean();

  return successResponse(res, 200, 'Categories retrieved.', { categories });
});

/**
 * @route   GET /api/v1/categories/:slug
 * @desc    Get single category by slug
 */
export const getCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug })
    .populate('parentCategory', 'name slug')
    .lean();

  if (!category) {
    return errorResponse(res, 404, 'Category not found.');
  }

  return successResponse(res, 200, 'Category retrieved.', { category });
});

/**
 * @route   GET /api/v1/categories/:slug/products
 * @desc    Get products in a category with filtering
 */
export const getCategoryProducts = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { subcategory, sort, page, limit } = req.query;

  const category = await Category.findOne({ slug }).select('_id').lean();
  if (!category) {
    return errorResponse(res, 404, 'Category not found.');
  }

  const query = { categoryId: category._id, status: 'active' };

  if (subcategory) {
    query.subcategory = subcategory;
  }

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
      default:
        sortOptions = { createdAt: -1 };
    }
  }

  const result = await paginate(Product, query, page, limit, { path: 'categoryId', select: 'name slug' }, sortOptions);

  return successResponse(res, 200, 'Category products retrieved.', result);
});

/**
 * @route   GET /api/v1/categories/:slug/ai-insight
 * @desc    Get AI insight for a category (refresh if older than 24h)
 */
export const getCategoryInsight = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug }).lean();
  if (!category) {
    return errorResponse(res, 404, 'Category not found.');
  }

  let insight = category.aiInsight;
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const isStale = !category.aiInsightUpdatedAt || new Date(category.aiInsightUpdatedAt) < twentyFourHoursAgo;

  if (isStale) {
    // Trigger background refresh
    generateCategoryInsight(slug).catch((err) => {
      console.error(`[Category Controller] Background insight refresh failed: ${err.message}`);
    });
  }

  if (!insight) {
    // No existing insight — try to generate one synchronously
    const generated = await generateCategoryInsight(slug);
    insight = generated || 'AI insight is currently being generated. Please check back shortly.';
  }

  return successResponse(res, 200, 'Category insight retrieved.', {
    category: category.name,
    slug: category.slug,
    insight,
    lastUpdated: category.aiInsightUpdatedAt,
  });
});
