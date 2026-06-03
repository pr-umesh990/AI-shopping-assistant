import config from '../config/env.js';

/**
 * Global error-handling middleware (4-parameter signature).
 * Handles Mongoose errors, JWT errors, and generic server errors.
 */
const errorMiddleware = (err, req, res, _next) => {
  const timestamp = new Date().toISOString();
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error.';
  let errors = null;

  // ── Mongoose ValidationError ──
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed.';
    errors = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
  }

  // ── Mongoose CastError (Invalid ObjectId) ──
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
  }

  // ── Mongoose Duplicate Key (code 11000) ──
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for "${field}". This ${field} already exists.`;
  }

  // ── JWT Errors ──
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again.';
  }

  // Log full error server-side
  console.error(`[${timestamp}] ERROR ${statusCode}: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace only in development
  if (config.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorMiddleware;
