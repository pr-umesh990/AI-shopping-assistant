import cron from 'node-cron';
import PriceAlert from '../models/PriceAlert.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendPriceDropAlert } from '../services/email.service.js';

/**
 * Alert Notifier Job
 * Runs every 15 minutes: 
 *
 * Finds untriggered PriceAlert documents where the target price
 * has been reached, sends notification emails, and marks them triggered.
 */
const startAlertNotifierJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    const startTime = Date.now();
    console.log(`[AlertNotifier] Job started at ${new Date().toISOString()}`);

    let triggeredCount = 0;
    let errorCount = 0;

    try {
      // Find all untriggered alerts that have a target price set
      const alerts = await PriceAlert.find({
        triggered: false,
        targetPrice: { $exists: true, $ne: null },
      })
        .populate('productId', '_id name currentPrice')
        .populate('userId', 'name email')
        .lean();

      for (const alert of alerts) {
        try {
          if (!alert.productId || !alert.userId) continue;

          const currentPrice = alert.productId.currentPrice;

          // Check if current price meets or beats the target
          if (currentPrice <= alert.targetPrice) {
            // Send price alert email
            await sendPriceDropAlert(
              alert.userId,
              alert.productId,
              alert.targetPrice,
              currentPrice
            );

            // Mark as triggered
            await PriceAlert.findByIdAndUpdate(alert._id, {
              triggered: true,
              triggeredAt: new Date(),
            });

            triggeredCount++;
          }
        } catch (err) {
          errorCount++;
          console.error(`[AlertNotifier] Error processing alert ${alert._id}: ${err.message}`);
        }
      }
    } catch (error) {
      console.error(`[AlertNotifier] Fatal job error: ${error.message}`);
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[AlertNotifier] Job completed: ${triggeredCount} alerts triggered, ${errorCount} errors, ${elapsed}ms elapsed`
    );
  });

  console.log('⏰ Alert Notifier job scheduled (every 15 minutes)');
};

export default startAlertNotifierJob;
