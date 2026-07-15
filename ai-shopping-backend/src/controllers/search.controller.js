import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SearchQuery from '../models/SearchQuery.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { paginate } from '../utils/pagination.js';
import { interpretSearchQuery, generateSearchExpertSummary } from '../services/ai.service.js';

// Helper to escape regex special characters
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * @route   POST /api/v1/search
 * @desc    AI-powered product search
 */
export const search = asyncHandler(async (req, res) => {
  const { query: rawQuery, page, limit, sort, brands, priceMin, priceMax, rating } = req.body;

  if (!rawQuery || rawQuery.length < 2 || rawQuery.length > 500) {
    return errorResponse(res, 400, 'Search query must be between 2 and 500 characters.');
  }

  // Get AI interpretation of the search query
  const interpretation = await interpretSearchQuery(rawQuery);

  // Build MongoDB query from AI-extracted and manual filters
  const mongoQuery = { status: 'active' };
  const filters = interpretation.filters || {};

  // Category filter
  if (filters.category) {
    const cat = await Category.findOne({
      $or: [
        { slug: filters.category.toLowerCase() },
        { name: { $regex: escapeRegex(filters.category), $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();

    if (cat) {
      mongoQuery.categoryId = cat._id;
    }
  }

  // Brands filter (Manual overrides AI)
  const finalBrands = (brands && Array.isArray(brands) && brands.length > 0)
    ? brands
    : (filters.brands && Array.isArray(filters.brands) && filters.brands.length > 0 ? filters.brands : []);

  if (finalBrands.length > 0) {
    mongoQuery.brand = { $in: finalBrands.map((b) => new RegExp(escapeRegex(b), 'i')) };
  }

  // Price range (Manual overrides AI)
  const minPrice = priceMin !== undefined && priceMin !== '' ? parseFloat(priceMin) : filters.priceMin;
  const maxPrice = priceMax !== undefined && maxPrice !== '' ? parseFloat(priceMax) : filters.priceMax;

  if (minPrice || maxPrice) {
    mongoQuery.currentPrice = {};
    if (minPrice) mongoQuery.currentPrice.$gte = Number(minPrice);
    if (maxPrice) mongoQuery.currentPrice.$lte = Number(maxPrice);
  }

  // Minimum rating filter (Manual only)
  const minRating = rating !== undefined && rating !== '' ? parseFloat(rating) : undefined;
  if (minRating && minRating >= 1 && minRating <= 5) {
    mongoQuery.rating = { $gte: minRating };
  }

  // RAM filter (in specs)
  if (filters.ramMin) {
    mongoQuery['specs.ram'] = { $gte: filters.ramMin };
  }

  // Battery filter (in specs)
  if (filters.batteryMin) {
    mongoQuery['specs.battery'] = { $gte: filters.batteryMin };
  }

  // Features filter using useCaseTags
  if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
    mongoQuery.useCaseTags = { $in: filters.features.map((f) => new RegExp(escapeRegex(f), 'i')) };
  }

  // Always apply text search on raw query if present to preserve keyword specificity
  if (rawQuery) {
    mongoQuery.$text = { $search: rawQuery };
  }

  // Sort options
  let sortOptions = { rating: -1 };
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
        sortOptions = { rating: -1 };
    }
  }

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

  const regex = new RegExp(escapeRegex(q), 'i');

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

/**
 * @route   GET /api/v1/search/filter-options
 * @desc    Get available filter options (brands, price range) from active products
 * @query   category (slug, optional) — scope filters to a category
 */
export const getFilterOptions = asyncHandler(async (req, res) => {
  const { category } = req.query

  const matchStage = { status: 'active' }

  // If category slug provided, scope to that category
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id').lean()
    if (cat) {
      matchStage.categoryId = cat._id
    }
  }

  const [brandsResult, priceResult] = await Promise.all([
    // Distinct brands sorted alphabetically
    Product.aggregate([
      { $match: matchStage },
      { $group: { _id: '$brand' } },
      { $sort: { _id: 1 } },
      { $limit: 50 },
      { $project: { _id: 0, brand: '$_id' } },
    ]),
    // Min and max price
    Product.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$currentPrice' },
          maxPrice: { $max: '$currentPrice' },
        },
      },
    ]),
  ])

  const brands = brandsResult.map(b => b.brand).filter(Boolean)
  const priceRange = {
    min: priceResult[0]?.minPrice ? Math.floor(priceResult[0].minPrice) : 0,
    max: priceResult[0]?.maxPrice ? Math.ceil(priceResult[0].maxPrice) : 10000,
  }

  return successResponse(res, 200, 'Filter options retrieved.', {
    brands,
    priceRange,
    ratings: [4, 3, 2],
  })
})

