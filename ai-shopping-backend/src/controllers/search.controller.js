import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SearchQuery from '../models/SearchQuery.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { paginate } from '../utils/pagination.js';
import { interpretSearchQuery, generateSearchExpertSummary } from '../services/ai.service.js';

/**
 * @route   POST /api/v1/search
 * @desc    AI-powered product search
 */
export const search = asyncHandler(async (req, res) => {
  const { query: rawQuery, page, limit } = req.body;

  if (!rawQuery || rawQuery.length < 2 || rawQuery.length > 500) {
    return errorResponse(res, 400, 'Search query must be between 2 and 500 characters.');
  }

  // Get AI interpretation of the search query
  const interpretation = await interpretSearchQuery(rawQuery);

  // Build MongoDB query from AI-extracted filters
  const mongoQuery = { status: 'active' };
  const filters = interpretation.filters || {};

  // Category filter
  if (filters.category) {
    const cat = await Category.findOne({
      $or: [
        { slug: filters.category.toLowerCase() },
        { name: { $regex: filters.category, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();

    if (cat) {
      mongoQuery.categoryId = cat._id;
    }
  }

  // Brands filter
  if (filters.brands && Array.isArray(filters.brands) && filters.brands.length > 0) {
    mongoQuery.brand = { $in: filters.brands.map((b) => new RegExp(b, 'i')) };
  }

  // Price range
  if (filters.priceMin || filters.priceMax) {
    mongoQuery.currentPrice = {};
    if (filters.priceMin) mongoQuery.currentPrice.$gte = filters.priceMin;
    if (filters.priceMax) mongoQuery.currentPrice.$lte = filters.priceMax;
  }

  // RAM filter (in specs)
  if (filters.ramMin) {
    mongoQuery['specs.ram'] = { $gte: filters.ramMin };
  }

  // Battery filter (in specs)
  if (filters.batteryMin) {
    mongoQuery['specs.battery'] = { $gte: filters.batteryMin };
  }

  // Features filter using useCaseTags or text search
  if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
    mongoQuery.useCaseTags = { $in: filters.features.map((f) => new RegExp(f, 'i')) };
  }

  // Also apply text search on the raw query for broader matching
  if (!mongoQuery.categoryId && !mongoQuery.brand) {
    mongoQuery.$text = { $search: rawQuery };
  }

  let sortOptions = { rating: -1 };
  const result = await paginate(Product, mongoQuery, page, limit, { path: 'categoryId', select: 'name slug' }, sortOptions);

  // Save search query asynchronously (fire-and-forget)
  SearchQuery.create({
    userId: req.user?.id || null,
    rawQuery,
    interpretedFilters: filters,
    resultsCount: result.pagination.total,
  }).catch((err) => console.error(`[Search] Failed to save search query: ${err.message}`));

  return successResponse(res, 200, 'Search results.', {
    interpretation: {
      summary: interpretation.summary,
      filterTags: interpretation.filterTags || [],
    },
    results: result.data,
    totalCount: result.pagination.total,
    pagination: result.pagination,
  });
});

/**
 * @route   GET /api/v1/search/ai-summary
 * @desc    Get an AI expert summary for search results
 */
export const getAiSummary = asyncHandler(async (req, res) => {
  const { q, productIds } = req.query;

  if (!q) {
    return errorResponse(res, 400, 'Query parameter "q" is required.');
  }

  let products = [];
  if (productIds) {
    const ids = productIds.split(',').filter((id) => id.trim());
    products = await Product.find({ _id: { $in: ids } })
      .select('name brand currentPrice rating')
      .lean();
  }

  const summary = await generateSearchExpertSummary(q, products);
  const badgeTags = products
    .slice(0, 3)
    .map((p) => `${p.brand} ${p.name}`)
    .filter(Boolean);

  return successResponse(res, 200, 'AI summary generated.', {
    summary: summary || 'AI summary is currently unavailable.',
    badgeTags,
  });
});

/**
 * @route   GET /api/v1/search/suggestions
 * @desc    Get search suggestions from partial text
 */
export const getSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 1) {
    return successResponse(res, 200, 'Suggestions.', { suggestions: [] });
  }

  const regex = new RegExp(q, 'i');

  const products = await Product.find({
    status: 'active',
    $or: [{ name: regex }, { brand: regex }],
  })
    .select('name brand')
    .limit(6)
    .lean();

  const suggestions = products.map((p) => ({
    id: p._id,
    text: `${p.brand} ${p.name}`,
    name: p.name,
    brand: p.brand,
  }));

  return successResponse(res, 200, 'Suggestions.', { suggestions });
});
