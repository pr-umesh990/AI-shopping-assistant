import mongoose from 'mongoose';

const searchQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rawQuery: {
    type: String,
    required: [true, 'Search query is required.'],
  },
  interpretedFilters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  resultsCount: {
    type: Number,
    default: 0,
  },
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

searchQuerySchema.index({ searchedAt: -1 });

const SearchQuery = mongoose.model('SearchQuery', searchQuerySchema);

export default SearchQuery;
