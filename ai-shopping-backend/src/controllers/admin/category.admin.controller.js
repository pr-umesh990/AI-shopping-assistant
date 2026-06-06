import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { paginate } from '../../utils/pagination.js';
import slugify from '../../utils/slugify.js';

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Get all categories with pagination (Admin)
 */
export const getAdminCategories = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await paginate(Category, {}, page, limit, null, { name: 1 });

  return successResponse(res, 200, 'Admin categories retrieved.', {
    categories: result.data,
    pagination: result.pagination,
  });
});

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create a new category (Admin)
 */
export const createAdminCategory = asyncHandler(async (req, res) => {
  const { name, icon, description } = req.body;

  if (!name) {
    return errorResponse(res, 400, 'Category name is required.');
  }

  const slug = slugify(name);
  
  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    return errorResponse(res, 400, 'Category with this name already exists.');
  }

  const category = await Category.create({
    name,
    slug,
    icon: icon || '📦',
    description,
  });

  return successResponse(res, 201, 'Category created successfully.', { category });
});

/**
 * @route   PUT /api/v1/admin/categories/:id
 * @desc    Update a category (Admin)
 */
export const updateAdminCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, icon, description } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    return errorResponse(res, 404, 'Category not found.');
  }

  if (name) {
    category.name = name;
    category.slug = slugify(name);
    
    // Check if new slug conflicts with another category
    const conflict = await Category.findOne({ slug: category.slug, _id: { $ne: id } });
    if (conflict) {
      return errorResponse(res, 400, 'Category name conflicts with an existing category.');
    }
  }

  if (icon !== undefined) category.icon = icon;
  if (description !== undefined) category.description = description;

  await category.save();

  return successResponse(res, 200, 'Category updated successfully.', { category });
});

/**
 * @route   DELETE /api/v1/admin/categories/:id
 * @desc    Delete a category (Admin)
 */
export const deleteAdminCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    return errorResponse(res, 404, 'Category not found.');
  }

  // Check if any products exist in this category
  const productCount = await Product.countDocuments({ categoryId: id });
  if (productCount > 0) {
    return errorResponse(res, 400, `Cannot delete category. It contains ${productCount} active products.`);
  }

  await category.deleteOne();

  return successResponse(res, 200, 'Category deleted successfully.');
});
