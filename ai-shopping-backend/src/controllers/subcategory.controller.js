import mongoose from 'mongoose';
import Subcategory from '../models/Subcategory.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @route   GET /api/v1/subcategories?categoryId=xxx
 * @desc    Get subcategories for a given category (public)
 */
export const getSubcategories = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;

  // If no categoryId provided, return empty array
  if (!categoryId) {
    return successResponse(res, 200, 'Subcategories retrieved.', { subcategories: [] });
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const subcategories = await Subcategory.find({ categoryId, isActive: true })
    .sort({ name: 1 })
    .lean();

  return successResponse(res, 200, 'Subcategories retrieved.', { subcategories });
});

/**
 * @route   GET /api/v1/subcategories/:id
 * @desc    Get a single subcategory by ID (public)
 */
export const getSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const subcategory = await Subcategory.findOne({ _id: id, isActive: true })
    .populate('categoryId', 'name slug')
    .lean();

  if (!subcategory) {
    return errorResponse(res, 404, 'Subcategory not found.');
  }

  return successResponse(res, 200, 'Subcategory retrieved.', { subcategory });
});
