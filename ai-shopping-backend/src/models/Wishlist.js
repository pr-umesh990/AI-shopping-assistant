import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
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
  priceAtSave: {
    type: Number,
    required: [true, 'Price at save is required.'],
  },
  currentPrice: {
    type: Number,
  },
  notifyEnabled: {
    type: Boolean,
    default: false,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: one wishlist entry per user-product pair
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
wishlistSchema.index({ productId: 1, notifyEnabled: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
