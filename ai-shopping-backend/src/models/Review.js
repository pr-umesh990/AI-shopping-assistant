import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required.'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating cannot exceed 5.'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters.'],
      default: '',
    },
    body: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters.'],
      default: '',
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'hidden'],
      default: 'active',
    },
  },
  { timestamps: true }
)

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 })
reviewSchema.index({ userId: 1 })

const Review = mongoose.model('Review', reviewSchema)
export default Review
