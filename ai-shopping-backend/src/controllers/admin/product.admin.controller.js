import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import Subcategory from '../../models/Subcategory.js';
import PriceHistory from '../../models/PriceHistory.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { paginate } from '../../utils/pagination.js';
import { recordPrice } from '../../services/price.service.js';

/**
 * @route   GET /api/v1/admin/products
 * @desc    Get paginated product table for admin with filters
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, status, page, limit } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.categoryId = category;
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  const result = await paginate(
    Product,
    query,
    page,
    limit,
    [
      { path: 'categoryId', select: 'name slug' },
      { path: 'subcategoryId', select: 'name slug' },
    ],
    { createdAt: -1 }
  );

  return successResponse(res, 200, 'Admin products retrieved.', {
    products: result.data,
    pagination: result.pagination,
  });
});

/**
 * @route   POST /api/v1/admin/products
 * @desc    Create a new product
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    sku,
    categoryId,
    subcategoryId,
    description,
    images,
    currentPrice,
    originalPrice,
    currency,
    rating,
    reviewCount,
    specs,
    badges,
    useCaseTags,
    affiliateLinks,
    stock,
    status,
    isTrending,
    aiHighlights,
  } = req.body;

  if (!name || !brand || !sku || !categoryId || currentPrice === undefined) {
    return errorResponse(res, 400, 'Required fields: name, brand, sku, categoryId, currentPrice.');
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return errorResponse(res, 400, 'Invalid category ID format.');
  }

  // Validate subcategoryId if provided
  let resolvedSubcategoryId = null;
  if (subcategoryId) {
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return errorResponse(res, 400, 'Invalid subcategory ID format.');
    }

    const subcategory = await Subcategory.findById(subcategoryId).lean();
    if (!subcategory) {
      return errorResponse(res, 400, 'Subcategory not found.');
    }

    if (subcategory.categoryId.toString() !== categoryId.toString()) {
      return errorResponse(res, 400, 'Subcategory does not belong to selected category.');
    }

    resolvedSubcategoryId = subcategoryId;
  }

  // Auto-generate tracked URLs for affiliate links
  const processedLinks = (affiliateLinks || []).map((link) => ({
    retailer: link.retailer,
    url: link.url,
    trackedUrl: link.url ? `${link.url}${link.url.includes('?') ? '&' : '?'}ref=smartshop` : '',
  }));

  const product = await Product.create({
    name,
    brand,
    sku: sku.toUpperCase(),
    categoryId,
    subcategoryId: resolvedSubcategoryId,
    description,
    images: images || [],
    currentPrice,
    originalPrice,
    currency,
    rating,
    reviewCount,
    specs: specs || {},
    badges: badges || [],
    useCaseTags: useCaseTags || [],
    affiliateLinks: processedLinks,
    stock: stock || 0,
    status: status || 'active',
    isTrending: isTrending || false,
    aiHighlights: aiHighlights || [],
  });

  // Create initial price history record
  await recordPrice(product._id, currentPrice, 'admin');

  // Increment category productCount
  await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });

  // Increment subcategory productCount if applicable
  if (resolvedSubcategoryId) {
    await Subcategory.findByIdAndUpdate(resolvedSubcategoryId, { $inc: { productCount: 1 } });
  }

  return successResponse(res, 201, 'Product created successfully.', { product });
});

/**
 * @route   PUT /api/v1/admin/products/:id
 * @desc    Update a product (partial update)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    return errorResponse(res, 404, 'Product not found.');
  }

  const oldPrice = existingProduct.currentPrice;
  const oldCategoryId = existingProduct.categoryId?.toString();
  const oldSubcategoryId = existingProduct.subcategoryId?.toString() || null;

  // Handle subcategoryId change if included in request body
  if (req.body.subcategoryId !== undefined) {
    const newSubcategoryId = req.body.subcategoryId || null;

    if (newSubcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(newSubcategoryId)) {
        return errorResponse(res, 400, 'Invalid subcategory ID format.');
      }

      const newCategoryId = req.body.categoryId || existingProduct.categoryId;
      const subcategory = await Subcategory.findById(newSubcategoryId).lean();

      if (!subcategory) {
        return errorResponse(res, 400, 'Subcategory not found.');
      }

      if (subcategory.categoryId.toString() !== newCategoryId.toString()) {
        return errorResponse(res, 400, 'Subcategory does not belong to selected category.');
      }
    }

    // Decrement old subcategory productCount
    if (oldSubcategoryId && oldSubcategoryId !== (newSubcategoryId || null)?.toString()) {
      await Subcategory.findByIdAndUpdate(oldSubcategoryId, {
        $inc: { productCount: -1 },
      });
    }

    // Increment new subcategory productCount
    if (newSubcategoryId && oldSubcategoryId !== newSubcategoryId) {
      await Subcategory.findByIdAndUpdate(newSubcategoryId, {
        $inc: { productCount: 1 },
      });
    }

    existingProduct.subcategoryId = newSubcategoryId;
  }

  // Handle categoryId change
  if (req.body.categoryId !== undefined && req.body.categoryId !== oldCategoryId) {
    if (!mongoose.Types.ObjectId.isValid(req.body.categoryId)) {
      return errorResponse(res, 400, 'Invalid category ID format.');
    }
    await Category.findByIdAndUpdate(oldCategoryId, { $inc: { productCount: -1 } });
    await Category.findByIdAndUpdate(req.body.categoryId, { $inc: { productCount: 1 } });
    existingProduct.categoryId = req.body.categoryId;
  }

  // Apply remaining allowed field updates
  const allowedFields = [
    'name', 'brand', 'sku', 'description',
    'images', 'currentPrice', 'originalPrice', 'currency', 'rating',
    'reviewCount', 'specs', 'badges', 'useCaseTags', 'affiliateLinks',
    'stock', 'status', 'isTrending', 'aiHighlights',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === 'sku') {
        existingProduct[field] = req.body[field].toUpperCase();
      } else if (field === 'affiliateLinks') {
        existingProduct[field] = (req.body[field] || []).map((link) => ({
          retailer: link.retailer,
          url: link.url,
          trackedUrl: link.url ? `${link.url}${link.url.includes('?') ? '&' : '?'}ref=smartshop` : '',
        }));
      } else {
        existingProduct[field] = req.body[field];
      }
    }
  }

  await existingProduct.save();

  // Record new price history if price changed
  if (req.body.currentPrice !== undefined && req.body.currentPrice !== oldPrice) {
    await recordPrice(existingProduct._id, req.body.currentPrice, 'admin');
  }

  return successResponse(res, 200, 'Product updated successfully.', { product: existingProduct });
});

/**
 * @route   DELETE /api/v1/admin/products/:id
 * @desc    Soft delete a product (set status to disabled)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, 400, 'Invalid ID format.');
  }

  const product = await Product.findById(id);
  if (!product) {
    return errorResponse(res, 404, 'Product not found.');
  }

  product.status = 'disabled';
  await product.save();

  // Decrement category productCount
  if (product.categoryId) {
    await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } });
  }

  // Decrement subcategory productCount (floor at 0)
  if (product.subcategoryId) {
    const sub = await Subcategory.findById(product.subcategoryId);
    if (sub) {
      sub.productCount = Math.max(0, (sub.productCount || 0) - 1);
      await sub.save();
    }
  }

  return successResponse(res, 200, 'Product disabled successfully.');
});
