/**
 * Wraps an async controller function to catch errors and forward them to Express error middleware.
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
