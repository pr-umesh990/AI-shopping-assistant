import Newsletter from '../models/Newsletter.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { sendNewsletterConfirmation } from '../services/email.service.js';

/**
 * @route   POST /api/v1/newsletter/subscribe
 * @desc    Subscribe to newsletter (idempotent)
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return errorResponse(res, 400, 'Email is required.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return errorResponse(res, 400, 'Please provide a valid email address.');
  }

  // Check if already subscribed (idempotent)
  const existing = await Newsletter.findOne({ email: normalizedEmail });
  if (existing) {
    return successResponse(res, 200, 'You are already subscribed to the newsletter.');
  }

  await Newsletter.create({ email: normalizedEmail });

  // Fire-and-forget confirmation email
  sendNewsletterConfirmation(normalizedEmail);

  return successResponse(res, 201, 'Successfully subscribed to the newsletter.');
});
