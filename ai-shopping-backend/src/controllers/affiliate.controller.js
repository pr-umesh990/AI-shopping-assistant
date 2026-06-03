import mongoose from 'mongoose';
import Product from '../models/Product.js';
import AffiliateClick from '../models/AffiliateClick.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { generateTrackedUrl } from '../services/affiliate.service.js';

/**
 * @route   POST /api/v1/affiliate/click
 * @desc    Track an affiliate click and return tracked redirect URL
 */
export const trackClick = asyncHandler(async (req, res) => {
  const { productId, retailer, sessionId } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return errorResponse(res, 400, 'Valid product ID is required.');
  }

  if (!retailer) {
    return errorResponse(res, 400, 'Retailer is required.');
  }

  const product = await Product.findById(productId).select('affiliateLinks').lean();
  if (!product) {
    return errorResponse(res, 404, 'Product not found.');
  }

  // Find matching affiliate link for the retailer
  const affiliateLink = product.affiliateLinks?.find(
    (link) => link.retailer?.toLowerCase() === retailer.toLowerCase()
  );

  if (!affiliateLink || !affiliateLink.url) {
    return errorResponse(res, 404, 'No affiliate link found for this retailer.');
  }

  // Record the click
  await AffiliateClick.create({
    productId,
    userId: req.user?.id || null,
    retailer,
    sessionId: sessionId || null,
    clickedAt: new Date(),
  });

  // Generate tracked URL
  const redirectUrl = generateTrackedUrl(
    affiliateLink.url,
    productId,
    retailer,
    req.user?.id || null,
    sessionId || null
  );

  return successResponse(res, 200, 'Affiliate click tracked.', { redirectUrl });
});
