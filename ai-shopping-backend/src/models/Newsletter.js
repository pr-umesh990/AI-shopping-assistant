import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
});

newsletterSchema.index({ email: 1 }, { unique: true });

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;
