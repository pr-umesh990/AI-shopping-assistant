import cron from 'node-cron';
import Product from '../models/Product.js';
import { recordPrice, checkAndTriggerAlerts } from '../services/price.service.js';

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
      const batchSize = 100;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const products = await Product.find({ status: 'active' })
          .select('_id currentPrice')
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (products.length === 0) {
          hasMore = false;
          break;
        }

        for (const product of products) {
          try {
            const oldPrice = product.currentPrice;

            // Simulate ±2% price variation
            const changePercent = (Math.random() * 4 - 2) / 100; // -0.02 to +0.02
            const newPrice = Math.round(oldPrice * (1 + changePercent) * 100) / 100;

            // Ensure price doesn't go below $1
            const finalPrice = Math.max(1, newPrice);

            if (finalPrice !== oldPrice) {
              await recordPrice(product._id, finalPrice, 'tracker');
              await checkAndTriggerAlerts(product._id, finalPrice, oldPrice);
            }

            processedCount++;
          } catch (err) {
            errorCount++;
            console.error(`[PriceTracker] Error processing product ${product._id}: ${err.message}`);
          }
        }

        skip += batchSize;

        if (products.length < batchSize) {
          hasMore = false;
        }
      }
    } catch (error) {
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
