import config from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import startPriceTrackerJob from './jobs/priceTracker.job.js';
import startAlertNotifierJob from './jobs/alertNotifier.job.js';

const PORT = config.PORT;

// ── Unhandled Rejection Handler ──
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// ── Uncaught Exception Handler ──
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

// ── Start Server ──
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 SmartShop AI server running on port ${PORT} in ${config.NODE_ENV} mode`);
      console.log(`📡 API base: http://localhost:${PORT}/api/v1`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/v1/health`);
    });

    // Start background cron jobs after DB is connected
    startPriceTrackerJob();
    startAlertNotifierJob();

    // ── Graceful Shutdown ──
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('🔌 HTTP server closed.');

        try {
          const mongoose = await import('mongoose');
          await mongoose.default.connection.close();
          console.log('🔌 MongoDB connection closed.');
        } catch (err) {
          console.error('Error closing MongoDB connection:', err.message);
        }

        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
