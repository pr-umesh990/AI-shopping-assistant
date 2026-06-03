import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendWelcomeEmail } from '../services/email.service.js';

/**
 * Sign a JWT for a given user.
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return errorResponse(res, 409, 'A user with this email already exists.');
  }

  // Create user (password gets hashed via pre-save hook)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
  });

  const token = signToken(user);

  // Fire-and-forget welcome email
  sendWelcomeEmail({ name: user.name, email: user.email });

  return successResponse(res, 201, 'User registered successfully.', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      newsletterSubscribed: user.newsletterSubscribed,
    },
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 400, 'Please provide email and password.');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return errorResponse(res, 401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 401, 'Invalid email or password.');
  }

  const token = signToken(user);

  return successResponse(res, 200, 'Login successful.', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      newsletterSubscribed: user.newsletterSubscribed,
    },
  });
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (protected)
 */
export const logout = asyncHandler(async (req, res) => {
  return successResponse(res, 200, 'Logged out successfully.');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile (protected)
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash').lean();

  if (!user) {
    return errorResponse(res, 404, 'User not found.');
  }

  return successResponse(res, 200, 'User profile retrieved.', { user });
});

/**
 * @route   PATCH /api/v1/auth/me
 * @desc    Update current user profile (protected)
 * @fields  name, avatar, newsletterSubscribed
 */
export const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'avatar', 'newsletterSubscribed'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(res, 400, 'No valid fields provided for update.');
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select('-passwordHash');

  if (!user) {
    return errorResponse(res, 404, 'User not found.');
  }

  return successResponse(res, 200, 'Profile updated successfully.', { user });
});
