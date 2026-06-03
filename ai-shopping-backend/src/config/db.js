import mongoose from 'mongoose';
import config from './env.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      console.log(` MongoDB connection attempt ${attempt}/${MAX_RETRIES}...`);

      await mongoose.connect(config.MONGODB_URI, {
        autoIndex: true,
      });

      console.log(` MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      console.error(` MongoDB connection attempt ${attempt} failed: ${error.message}`);

      if (attempt >= MAX_RETRIES) {
        console.error('FATAL: All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
};

export default connectDB;
