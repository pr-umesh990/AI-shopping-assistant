import mongoose from 'mongoose';

const affiliateClickSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required.'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  retailer: {
    type: String,
    required: [true, 'Retailer is required.'],
  },
  clickedAt: {
    type: Date,
    default: Date.now,
  },
  sessionId: {
    type: String,
  },
});

affiliateClickSchema.index({ productId: 1, clickedAt: -1 });
affiliateClickSchema.index({ clickedAt: -1 });

const AffiliateClick = mongoose.model('AffiliateClick', affiliateClickSchema);

export default AffiliateClick;
