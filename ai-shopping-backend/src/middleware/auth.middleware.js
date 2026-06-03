import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';

/**
 * Protect middleware — verifies JWT from Authorization header,
 * attaches req.user with { id, role } from decoded token.
 */
export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized. No token provided.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Session expired, please log in again.');
      }
      return errorResponse(res, 401, 'Invalid token.');
    }

    // Verify user still exists in DB
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return errorResponse(res, 401, 'User belonging to this token no longer exists.');
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return errorResponse(res, 401, 'Not authorized.');
  }
};

export default protect;
