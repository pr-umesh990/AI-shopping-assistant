import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },
    slug: {
      type: String,
      required: [true, 'Subcategory slug is required.'],
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Parent category is required.'],
    },
    icon: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    productCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: same slug allowed in different categories
subcategorySchema.index({ categoryId: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ categoryId: 1, isActive: 1 });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

export default Subcategory;
