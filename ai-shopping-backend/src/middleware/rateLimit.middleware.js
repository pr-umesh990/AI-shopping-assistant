import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const isDev = config.NODE_ENV === 'development';

/**
 * General rate limiter: 100 requests per 15 minutes per IP (1000 in dev).
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/**
 * Search rate limiter: 20 requests per 1 minute per IP (200 in dev).
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many search requests. Please slow down.' },
});

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP (100 in dev).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});
