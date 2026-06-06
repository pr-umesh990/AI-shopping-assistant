import mongoose from 'mongoose';
import Subcategory from '../../models/Subcategory.js';
import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import slugify from '../../utils/slugify.js';

/**
 * @route   GET /api/v1/admin/subcategories?categoryId=xxx
 * @desc    Get all active subcategories for a given category (Admin)
 */
export const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;

  if (!categoryId) {
    return errorResponse(res, 400, 'categoryId query parameter is required.');
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
 * @route   POST /api/v1/admin/subcategories
 * @desc    Create a new subcategory (Admin)
 */
export const createSubcategory = asyncHandler(async (req, res) => {
  const { name, categoryId, icon, description } = req.body;

  if (!name || name.trim().length < 2) {
    return errorResponse(res, 400, 'Name is required and must be at least 2 characters.');
  }

  if (!categoryId) {
    return errorResponse(res, 400, 'categoryId is required.');
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  // Verify parent category exists
  const category = await Category.findById(categoryId).lean();
  if (!category) {
    return errorResponse(res, 404, 'Parent category not found.');
  }

  const slug = slugify(name.trim());

  // Check compound uniqueness: same slug cannot exist in same category
  const existing = await Subcategory.findOne({ categoryId, slug });
  if (existing) {
    return errorResponse(res, 409, 'A subcategory with this name already exists in this category.');
  }

  const subcategory = await Subcategory.create({
    name: name.trim(),
    slug,
    categoryId,
    icon: icon || '',
    description: description || '',
  });

  return successResponse(res, 201, 'Subcategory created successfully.', { subcategory });
});

/**
 * @route   PUT /api/v1/admin/subcategories/:id
 * @desc    Update a subcategory (Admin)
 */
export const updateSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const subcategory = await Subcategory.findById(id);
  if (!subcategory) {
    return errorResponse(res, 404, 'Subcategory not found.');
  }

  const { name, icon, description, isActive } = req.body;

  if (name !== undefined) {
    if (name.trim().length < 2) {
      return errorResponse(res, 400, 'Name must be at least 2 characters.');
    }

    const newSlug = slugify(name.trim());

    // Only check uniqueness if name actually changed
    if (newSlug !== subcategory.slug) {
      const conflict = await Subcategory.findOne({
        categoryId: subcategory.categoryId,
        slug: newSlug,
        _id: { $ne: id },
      });
      if (conflict) {
        return errorResponse(res, 409, 'A subcategory with this name already exists in this category.');
      }
      subcategory.name = name.trim();
      subcategory.slug = newSlug;
    } else {
      subcategory.name = name.trim();
    }
  }

  if (icon !== undefined) subcategory.icon = icon;
  if (description !== undefined) subcategory.description = description;
  if (isActive !== undefined) subcategory.isActive = isActive;

  await subcategory.save();

  return successResponse(res, 200, 'Subcategory updated successfully.', { subcategory });
});

/**
 * @route   DELETE /api/v1/admin/subcategories/:id
 * @desc    Soft-delete a subcategory (Admin) — sets isActive = false
 */
export const deleteSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const subcategory = await Subcategory.findById(id);
  if (!subcategory) {
    return errorResponse(res, 404, 'Subcategory not found.');
  }

  // Block deletion if active products reference this subcategory
  const productCount = await Product.countDocuments({
    subcategoryId: id,
    status: { $ne: 'disabled' },
  });

  if (productCount > 0) {
    return errorResponse(
      res,
      400,
      `Cannot delete: ${productCount} product${productCount !== 1 ? 's' : ''} use this subcategory.`
    );
  }

  subcategory.isActive = false;
  await subcategory.save();

  return successResponse(res, 200, 'Subcategory deactivated successfully.');
});

/**
 * @route   PATCH /api/v1/admin/subcategories/reorder
 * @desc    Reorder subcategories (MVP: just acknowledge)
 */
export const reorderSubcategories = asyncHandler(async (req, res) => {
  // MVP: ordering stored in frontend; backend just acknowledges
  return successResponse(res, 200, 'Subcategory order updated successfully.');
});
