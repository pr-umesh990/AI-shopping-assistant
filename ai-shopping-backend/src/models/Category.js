import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    featuredImageUrl: {
      type: String,
    },
    aiInsight: {
      type: String,
    },
    aiInsightUpdatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });

// Virtual: populate subcategories for this category
categorySchema.virtual('subcategoryList', {
  ref: 'Subcategory',
  localField: '_id',
  foreignField: 'categoryId',
  match: { isActive: true },
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
