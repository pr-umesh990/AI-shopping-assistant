import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import PriceAlert from '../models/PriceAlert.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { getPriceDrop } from '../services/price.service.js';
import { getWishlistRecommendations } from '../services/recommendation.service.js';

/**
 * @route   GET /api/v1/wishlist
 * @desc    Get user's wishlist with stats
 */
export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { filter } = req.query;

  const query = { userId };

  const wishlistItems = await Wishlist.find(query)
    .populate({
      path: 'productId',
      select: 'name brand images currentPrice originalPrice rating status categoryId',
      populate: { path: 'categoryId', select: 'name slug' },
    })
    .sort({ savedAt: -1 })
    .lean();

  // Filter out and delete dangling wishlist items (where productId has been deleted)
  const validWishlistItems = [];
  const danglingIds = [];
  for (const item of wishlistItems) {
    if (item.productId) {
      validWishlistItems.push(item);
    } else {
      danglingIds.push(item._id);
    }
  }

  if (danglingIds.length > 0) {
    await Wishlist.deleteMany({ _id: { $in: danglingIds } });
  }

  // Calculate price drop for each item and apply filter
  let items = validWishlistItems.map((item) => {
    const currentPrice = item.productId.currentPrice || item.currentPrice || item.priceAtSave;
    const priceDrop = getPriceDrop(item.priceAtSave, currentPrice);

    return {
      ...item,
      priceDrop,
      currentProductPrice: currentPrice,
    };
  });

  // Apply filter
  if (filter === 'price-drop') {
    items = items.filter((item) => item.priceDrop > 0);
  } else if (filter === 'alerts-enabled') {
    items = items.filter((item) => item.notifyEnabled);
  }

  // Aggregate stats
  const totalTracked = validWishlistItems.length;
  const potentialSavings = validWishlistItems.reduce((sum, item) => {
    const currentPrice = item.productId.currentPrice || item.priceAtSave;
    const savings = item.priceAtSave - currentPrice;
    return sum + (savings > 0 ? savings : 0);
  }, 0);

  const activeAlerts = await PriceAlert.countDocuments({ userId, triggered: false });

  return successResponse(res, 200, 'Wishlist retrieved.', {
    items,
    wishlist: items,
    stats: {
      totalTracked,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      activeAlerts,
    },
  });
});

/**
 * @route   POST /api/v1/wishlist
 * @desc    Add product to wishlist
 */
export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Valid product ID is required.');
  }

  const product = await Product.findById(productId).select('currentPrice status').lean();
  if (!product || product.status === 'disabled') {
    return errorResponse(res, 404, 'Product not found.');
  }

  // Check for duplicate
  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) {
    return errorResponse(res, 409, 'Product already in wishlist.');
  }

  const wishlistItem = await Wishlist.create({
    userId,
    productId,
    priceAtSave: product.currentPrice,
    currentPrice: product.currentPrice,
  });

  return successResponse(res, 201, 'Product added to wishlist.', { wishlistItem });
});

/**
 * @route   DELETE /api/v1/wishlist/:productId
 * @desc    Remove product from wishlist
 */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const result = await Wishlist.findOneAndDelete({ userId, productId });

  if (!result) {
    return errorResponse(res, 404, 'Product not found in wishlist.');
  }

  return successResponse(res, 200, 'Product removed from wishlist.');
});

/**
 * @route   PATCH /api/v1/wishlist/:productId/alert
 * @desc    Toggle price alert notifications
 */
export const toggleAlert = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { enabled, targetPrice } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  if (typeof enabled !== 'boolean') {
    return errorResponse(res, 400, 'Field "enabled" must be a boolean.');
  }

  const product = await Product.findById(productId).select('currentPrice').lean();
  if (!product) {
    return errorResponse(res, 404, 'Product not found.');
  }

  const wishlistItem = await Wishlist.findOneAndUpdate(
    { userId, productId },
    { notifyEnabled: enabled },
    { new: true }
  );

  if (!wishlistItem) {
    return errorResponse(res, 404, 'Product not found in wishlist.');
  }

  // Manage target PriceAlert records
  if (enabled) {
    const target = targetPrice !== undefined && targetPrice !== '' ? Number(targetPrice) : product.currentPrice;
    await PriceAlert.findOneAndUpdate(
      { userId, productId },
      { targetPrice: target, triggered: false },
      { upsert: true, new: true }
    );
  } else {
    await PriceAlert.deleteOne({ userId, productId });
  }

  return successResponse(res, 200, `Price alert ${enabled ? 'enabled' : 'disabled'}.`, { wishlistItem });
});

/**
 * @route   GET /api/v1/wishlist/recommendations
 * @desc    Get product recommendations based on wishlist
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const recommendations = await getWishlistRecommendations(userId);

  return successResponse(res, 200, 'Recommendations retrieved.', { recommendations });
});
