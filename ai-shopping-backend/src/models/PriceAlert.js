import mongoose from 'mongoose';

const priceAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required.'],
    },
    targetPrice: {
      type: Number,
    },
    triggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

priceAlertSchema.index({ userId: 1, productId: 1 });
priceAlertSchema.index({ triggered: 1 });

const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);

export default PriceAlert;
