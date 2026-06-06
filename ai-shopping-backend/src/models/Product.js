import mongoose from 'mongoose';

const affiliateLinkSchema = new mongoose.Schema(
  {
    retailer: { type: String },
    url: { type: String },
    trackedUrl: { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters.'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required.'],
      trim: true,
      minlength: [2, 'Brand must be at least 2 characters.'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required.'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required.'],
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    currentPrice: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    originalPrice: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative.'],
      max: [5, 'Rating cannot exceed 5.'],
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    specs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    badges: {
      type: [String],
      default: [],
    },
    useCaseTags: {
      type: [String],
      default: [],
    },
    affiliateLinks: {
      type: [affiliateLinkSchema],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'review', 'disabled'],
        message: 'Status must be "active", "review", or "disabled".',
      },
      default: 'active',
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    aiHighlights: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ categoryId: 1 });
productSchema.index({ subcategoryId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ currentPrice: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ sku: 1 }, { unique: true });

// Text index for search
productSchema.index(
  { name: 'text', brand: 'text', description: 'text' },
  { weights: { name: 10, brand: 5, description: 1 } }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
