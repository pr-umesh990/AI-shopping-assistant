import mongoose from 'mongoose';

const aiReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required.'],
    unique: true,
  },
  pros: {
    type: [String],
    default: [],
  },
  cons: {
    type: [String],
    default: [],
  },
  expertSummary: {
    type: String,
  },
  reviewsAnalyzed: {
    type: Number,
    default: 0,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
});

aiReviewSchema.index({ productId: 1 }, { unique: true });

const AiReview = mongoose.model('AiReview', aiReviewSchema);

export default AiReview;
