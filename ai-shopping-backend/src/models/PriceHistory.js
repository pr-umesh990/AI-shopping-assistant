import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required.'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required.'],
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    default: 'manual',
  },
});

priceHistorySchema.index({ productId: 1, recordedAt: -1 });

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

export default PriceHistory;
