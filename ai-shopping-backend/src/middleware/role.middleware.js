import { errorResponse } from '../utils/apiResponse.js';

/**
 * Role-based access control middleware.
 * Usage: requireRole('admin') or requireRole('admin', 'editor')
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Not authorized.');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Insufficient permissions.');
    }

    next();
  };
};

export default requireRole;
