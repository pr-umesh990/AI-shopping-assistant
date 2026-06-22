/**
 * Application-wide constants.
 * Import from here instead of using magic numbers in code.
 */

export const CACHE_TTL = {
  CATEGORIES: 3600,       // 1 hour
  TRENDING: 1800,         // 30 minutes
  AI_VERDICT: 3600,       // 1 hour
  AI_SEARCH: 3600,        // 1 hour
  CATEGORY_INSIGHT: 86400 // 24 hours
}

export const STALENESS = {
  AI_REVIEW_DAYS: 7,
  CATEGORY_INSIGHT_HOURS: 24,
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
}

export const PRICE_TRACKER = {
  BATCH_SIZE: 100,
  MAX_CHANGE_PERCENT: 2,   // ±2%
  MIN_PRICE: 1,
}

export const COMPARE = {
  MIN_PRODUCTS: 2,
  MAX_PRODUCTS: 4,
}

export const AI = {
  MAX_TOKENS: 1000,
  SEARCH_TEMPERATURE: 0.3,
  REVIEW_TEMPERATURE: 0.5,
  INSIGHT_TEMPERATURE: 0.6,
  MAX_RETRIES: 3,
}
