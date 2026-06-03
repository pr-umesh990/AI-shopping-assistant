import PriceHistory from '../models/PriceHistory.js';
import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';
import User from '../models/User.js';
import { sendPriceDropAlert } from './email.service.js';

/**
 * Record a new price point for a product and update Product.currentPrice if changed.
 * @param {string} productId
 * @param {number} price
 * @param {string} source - e.g. 'manual', 'tracker', 'admin'
 * @returns {Object} PriceHistory document
 */
export const recordPrice = async (productId, price, source = 'manual') => {
  const priceEntry = await PriceHistory.create({
    productId,
    price,
    source,
    recordedAt: new Date(),
  });

  // Update the product's current price if it has changed
  await Product.findByIdAndUpdate(productId, { currentPrice: price });

  return priceEntry;
};

/**
 * Check wishlist entries with notifyEnabled and trigger price drop alerts.
 * @param {string} productId
 * @param {number} newPrice
 * @param {number} oldPrice
 */
export const checkAndTriggerAlerts = async (productId, newPrice, oldPrice) => {
  if (newPrice >= oldPrice) return;

  try {
    // Find wishlist entries for this product where the user has notifications enabled
    // and the price at save / current tracked price is greater than the new price
    const wishlistEntries = await Wishlist.find({
      productId,
      notifyEnabled: true,
      $or: [
        { currentPrice: { $gt: newPrice } },
        { currentPrice: { $exists: false } },
      ],
    });

    for (const entry of wishlistEntries) {
      try {
        // Update the current price on the wishlist entry
        entry.currentPrice = newPrice;
        await entry.save();

        // Fetch user and send email
        const user = await User.findById(entry.userId).select('name email').lean();
        const product = await Product.findById(productId).select('name _id').lean();

        if (user && product) {
          sendPriceDropAlert(user, product, oldPrice, newPrice);
        }
      } catch (err) {
        console.error(`[Price Service] Alert trigger failed for wishlist entry ${entry._id}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`[Price Service] checkAndTriggerAlerts error: ${error.message}`);
  }
};

/**
 * Calculate price drop percentage.
 * @param {number} priceAtSave
 * @param {number} currentPrice
 * @returns {number} Percentage drop (positive = price went down)
 */
export const getPriceDrop = (priceAtSave, currentPrice) => {
  if (!priceAtSave || priceAtSave === 0) return 0;
  const drop = ((priceAtSave - currentPrice) / priceAtSave) * 100;
  return Math.round(drop * 100) / 100; // Round to 2 decimal places
};
