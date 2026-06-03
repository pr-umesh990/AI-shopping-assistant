import mongoose from 'mongoose';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { generateComparisonVerdict } from '../services/ai.service.js';
import { redisClient, redisAvailable } from '../middleware/cache.middleware.js';

/**
 * Build a comparison spec row with winner flag.
 */
const buildSpecRow = (label, getter, products, lowerIsBetter = false) => {
  const values = products.map((p) => {
    const val = getter(p);
    return { productId: p._id, value: val };
  });

  // Find winner
  const numericValues = values.filter((v) => typeof v.value === 'number');
  let winnerId = null;

  if (numericValues.length > 0) {
    const sorted = [...numericValues].sort((a, b) =>
      lowerIsBetter ? a.value - b.value : b.value - a.value
    );
    winnerId = sorted[0].productId;
  }

  return {
    label,
    values: values.map((v) => ({
      productId: v.productId,
      value: v.value != null ? v.value : 'N/A',
      isWinner: winnerId && v.productId.toString() === winnerId.toString(),
    })),
  };
};

/**
 * @route   GET /api/v1/compare
 * @desc    Compare 2-4 products
 */
export const compare = asyncHandler(async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return errorResponse(res, 400, 'Please provide product IDs via the "ids" query parameter.');
  }

  const idArray = ids.split(',').map((id) => id.trim()).filter(Boolean);

  if (idArray.length < 2 || idArray.length > 4) {
    return errorResponse(res, 400, 'Please provide between 2 and 4 product IDs.');
  }

  // Validate all IDs
  for (const id of idArray) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, `Invalid ID format: ${id}`);
    }
  }

  const products = await Product.find({
    _id: { $in: idArray },
    status: 'active',
  })
    .populate('categoryId', 'name slug')
    .lean();

  if (products.length < 2) {
    return errorResponse(res, 404, 'Not enough valid products found for comparison.');
  }

  // Build comparison matrix
  const specRows = [
    buildSpecRow('Price', (p) => p.currentPrice, products, true),
    buildSpecRow('User Rating', (p) => p.rating, products),
    buildSpecRow('Processor', (p) => p.specs?.processor || p.specs?.cpu, products),
    buildSpecRow('Memory', (p) => {
      const ram = p.specs?.ram || p.specs?.memory;
      return typeof ram === 'number' ? ram : ram;
    }, products),
    buildSpecRow('Storage', (p) => p.specs?.storage, products),
    buildSpecRow('Battery Life', (p) => p.specs?.battery || p.specs?.batteryLife, products),
    buildSpecRow('Weight', (p) => {
      const w = p.specs?.weight;
      return typeof w === 'number' ? w : w;
    }, products, true),
  ];

  // Add winner fields to each product
  const productsWithWinners = products.map((p) => {
    const winnerFields = specRows
      .filter((row) => row.values.some((v) => v.productId.toString() === p._id.toString() && v.isWinner))
      .map((row) => row.label);
    return { ...p, winnerFields };
  });

  return successResponse(res, 200, 'Comparison results.', {
    products: productsWithWinners,
    specRows,
  });
});

/**
 * @route   GET /api/v1/compare/ai-verdict
 * @desc    Get AI verdict for compared products (cached 1 hour)
 */
export const getAiVerdict = asyncHandler(async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return errorResponse(res, 400, 'Please provide product IDs.');
  }

  const idArray = ids.split(',').map((id) => id.trim()).filter(Boolean);

  if (idArray.length < 2 || idArray.length > 4) {
    return errorResponse(res, 400, 'Please provide between 2 and 4 product IDs.');
  }

  const cacheKey = `compare:verdict:${idArray.sort().join(',')}`;

  // Check Redis cache
  if (redisAvailable && redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return successResponse(res, 200, 'AI verdict retrieved (cached).', JSON.parse(cached));
      }
    } catch (err) {
      console.warn(`[Compare] Redis cache read failed: ${err.message}`);
    }
  }

  const products = await Product.find({
    _id: { $in: idArray },
    status: 'active',
  }).lean();

  if (products.length < 2) {
    return errorResponse(res, 404, 'Not enough valid products found.');
  }

  const verdict = await generateComparisonVerdict(products);

  if (!verdict) {
    return errorResponse(res, 503, 'AI service temporarily unavailable.');
  }

  const responseData = {
    narrative: verdict.narrative,
    proPick: verdict.proPick,
    budgetPick: verdict.budgetPick,
  };

  // Cache for 1 hour
  if (redisAvailable && redisClient) {
    redisClient
      .setex(cacheKey, 3600, JSON.stringify(responseData))
      .catch((err) => console.warn(`[Compare] Redis cache write failed: ${err.message}`));
  }

  return successResponse(res, 200, 'AI verdict generated.', responseData);
});
