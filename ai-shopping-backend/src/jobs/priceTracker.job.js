import cron from 'node-cron';
import Product from '../models/Product.js';
import PriceHistory from '../models/PriceHistory.js';
import { checkAndTriggerAlerts } from '../services/price.service.js';
import { PRICE_TRACKER } from '../utils/constants.js';

/**
 * Price Tracker Job
 * Runs every hour: "0 * * * *"
 *
 * For MVP: simulates small price variations (±2% random change)
 * on all active products, records new price history, and triggers
 * wishlist alerts on price drops.
 */
const startPriceTrackerJob = () => {
  cron.schedule('0 * * * *', async () => {
    const startTime = Date.now();
    console.log(`[PriceTracker] Job started at ${new Date().toISOString()}`);

    let processedCount = 0;
    let errorCount = 0;

    try {
      const batchSize = PRICE_TRACKER.BATCH_SIZE;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const products = await Product.find({ status: 'active' })
          .select('_id currentPrice')
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (products.length === 0) { hasMore = false; break; }

        // Build bulk write operations
        const bulkOps = [];
        const priceHistoryDocs = [];
        const alertChecks = []; // { productId, newPrice, oldPrice }

        for (const product of products) {
          const oldPrice = product.currentPrice;
          const changePercent = (Math.random() * 4 - 2) / 100;
          const newPrice = Math.max(PRICE_TRACKER.MIN_PRICE, Math.round(oldPrice * (1 + changePercent) * 100) / 100);

          if (newPrice !== oldPrice) {
            // Bulk update product price
            bulkOps.push({
              updateOne: {
                filter: { _id: product._id },
                update: { $set: { currentPrice: newPrice } }
              }
            });

            // Collect price history entries
            priceHistoryDocs.push({
              productId: product._id,
              price: newPrice,
              source: 'tracker',
              recordedAt: new Date()
            });

            // Collect for alert checking (only price drops)
            if (newPrice < oldPrice) {
              alertChecks.push({ productId: product._id, newPrice, oldPrice });
            }

            processedCount++;
          }
        }

        // Execute bulk operations
        if (bulkOps.length > 0) {
          await Product.bulkWrite(bulkOps);
        }

        // Insert all price history in one call
        if (priceHistoryDocs.length > 0) {
          await PriceHistory.insertMany(priceHistoryDocs);
        }

        // Check alerts (these still need to be individual — email per user)
        for (const { productId, newPrice, oldPrice } of alertChecks) {
          await checkAndTriggerAlerts(productId, newPrice, oldPrice);
        }

        skip += batchSize;
        if (products.length < batchSize) hasMore = false;
      }
    } catch (error) {
      errorCount++;
      console.error(`[PriceTracker] Fatal job error: ${error.message}`);
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[PriceTracker] Job completed: ${processedCount} products processed, ${errorCount} errors, ${elapsed}ms elapsed`
    );
  });

  console.log(' Price Tracker job scheduled (every hour)');
};

export default startPriceTrackerJob;
