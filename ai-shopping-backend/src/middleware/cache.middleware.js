import Redis from 'ioredis';
import config from '../config/env.js';

let redisClient = null;
let redisAvailable = false;

try {
  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redisClient.on('connect', () => {
    redisAvailable = true;
    console.log(' Redis connected');
  });

  redisClient.on('error', (err) => {
    redisAvailable = false;
    console.warn(`Redis error: ${err.message}. Caching disabled.`);
  });

  redisClient.on('close', () => {
    redisAvailable = false;
  });

  // Attempt connection but don't block startup
  redisClient.connect().catch(() => {
    redisAvailable = false;
    console.warn('Redis unavailable. Caching will be skipped.');
  });
} catch (err) {
  console.warn('Redis initialization failed. Caching will be skipped.');
}

/**
 * Cache middleware with configurable TTL.
 * If Redis is unavailable, silently passes through.
 *
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @returns {Function} Express middleware
 */
export const cache = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Skip cache if Redis unavailable or non-GET request
    if (!redisAvailable || !redisClient || req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(200).json(parsed);
      }
    } catch (err) {
      // Cache read failed — proceed without cache
      console.warn(`Redis cache read error: ${err.message}`);
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Cache the response asynchronously
      if (redisAvailable && redisClient) {
        redisClient
          .setex(cacheKey, ttlSeconds, JSON.stringify(body))
          .catch((err) => console.warn(`Redis cache write error: ${err.message}`));
      }

      return originalJson(body);
    };

    next();
  };
};

export { redisClient, redisAvailable };
export default cache;
