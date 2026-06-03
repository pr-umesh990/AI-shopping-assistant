import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

/**
 * Get product recommendations based on a user's wishlist categories.
 * Finds 4 highly rated, active, trending products from the same categories
 * that the user hasn't already wishlisted.
 *
 * @param {string} userId
 * @returns {Array} Array of recommended product objects
 */
export const getWishlistRecommendations = async (userId) => {
  try {
    // Get all wishlist items for the user
    const wishlistItems = await Wishlist.find({ userId }).select('productId').lean();
    const wishlistProductIds = wishlistItems.map((w) => w.productId);

    if (wishlistProductIds.length === 0) {
      // No wishlist items — return top trending products instead
      const trending = await Product.find({ status: 'active', isTrending: true })
        .sort({ rating: -1 })
        .limit(4)
        .lean();
      return trending;
    }

    // Get category IDs from wishlisted products
    const wishlistProducts = await Product.find({
      _id: { $in: wishlistProductIds },
    })
      .select('categoryId')
      .lean();

    const categoryIds = [...new Set(wishlistProducts.map((p) => p.categoryId.toString()))];

    // Find highly rated active products from the same categories, excluding wishlisted ones
    const recommendations = await Product.find({
      status: 'active',
      categoryId: { $in: categoryIds },
      _id: { $nin: wishlistProductIds },
    })
      .sort({ rating: -1, isTrending: -1 })
      .limit(4)
      .lean();

    return recommendations;
  } catch (error) {
    console.error(`[Recommendation Service] getWishlistRecommendations error: ${error.message}`);
    return [];
  }
};
