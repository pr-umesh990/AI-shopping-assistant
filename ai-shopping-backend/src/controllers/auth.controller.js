import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service.js';

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

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex')
  user.emailVerificationToken = hashedToken
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await user.save({ validateBeforeSave: false })

  // Send verification email (fire and forget)
  sendVerificationEmail({ name: user.name, email: user.email }, verificationToken)

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

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify user email with token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  if (!token) {
    return errorResponse(res, 400, 'Verification token is required.')
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  })

  if (!user) {
    return errorResponse(res, 400, 'Invalid or expired verification token.')
  }

  user.emailVerified = true
  user.emailVerificationToken = null
  user.emailVerificationExpires = null
  await user.save({ validateBeforeSave: false })

  return successResponse(res, 200, 'Email verified successfully. You can now login.')
})

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification link
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    return errorResponse(res, 400, 'Email is required.')
  }

  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    return successResponse(res, 200, 'If this email is registered, a verification link has been sent.')
  }

  if (user.emailVerified) {
    return errorResponse(res, 400, 'This email is already verified.')
  }

  const verificationToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex')

  user.emailVerificationToken = hashedToken
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await user.save({ validateBeforeSave: false })

  sendVerificationEmail({ name: user.name, email: user.email }, verificationToken)

  return successResponse(res, 200, 'Verification email sent. Please check your inbox.')
})

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    return errorResponse(res, 400, 'Email is required.')
  }

  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    return successResponse(res, 200, 'If this email is registered, a reset link has been sent.')
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  user.passwordResetToken = hashedToken
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
  await user.save({ validateBeforeSave: false })

  sendPasswordResetEmail({ name: user.name, email: user.email }, resetToken)

  return successResponse(res, 200, 'Password reset link sent. Please check your inbox.')
})

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password using token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  if (!token || !password) {
    return errorResponse(res, 400, 'Token and new password are required.')
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return errorResponse(res, 400, 'Password must be at least 8 characters with 1 uppercase letter and 1 number.')
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  if (!user) {
    return errorResponse(res, 400, 'Invalid or expired reset token.')
  }

  user.passwordHash = password
  user.passwordResetToken = null
  user.passwordResetExpires = null
  await user.save()

  return successResponse(res, 200, 'Password reset successful. You can now login with your new password.')
})

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Change password (authenticated user)
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return errorResponse(res, 400, 'Current password and new password are required.')
  }

  if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return errorResponse(res, 400, 'New password must be at least 8 characters with 1 uppercase letter and 1 number.')
  }

  const user = await User.findById(req.user.id)
  if (!user) {
    return errorResponse(res, 404, 'User not found.')
  }

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    return errorResponse(res, 401, 'Current password is incorrect.')
  }

  if (currentPassword === newPassword) {
    return errorResponse(res, 400, 'New password must be different from current password.')
  }

  user.passwordHash = newPassword
  await user.save()

  return successResponse(res, 200, 'Password changed successfully.')
})

