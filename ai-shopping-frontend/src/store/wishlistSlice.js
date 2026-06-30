import { createSlice } from '@reduxjs/toolkit'

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { count: 0, items: [] },
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload || []
      state.count = (action.payload || []).length
    },
    addToWishlistState: (state, action) => {
      const itemId = typeof action.payload === 'string' ? action.payload : action.payload?.productId?._id || action.payload?.productId || action.payload?._id;
      if (itemId && !state.items.some(i => (i.productId?._id || i.productId || i._id || i) === itemId)) {
        state.items.push(action.payload)
        state.count = state.items.length
      }
    },
    removeFromWishlistState: (state, action) => {
      state.items = state.items.filter(i => (i.productId?._id || i.productId || i._id || i) !== action.payload)
      state.count = state.items.length
    },
    setWishlistCount: (state, action) => { state.count = action.payload },
    incrementWishlist: (state) => { state.count += 1 },
    decrementWishlist: (state) => { state.count = Math.max(0, state.count - 1) },
  },
})

export const {
  setWishlist,
  addToWishlistState,
  removeFromWishlistState,
  setWishlistCount,
  incrementWishlist,
  decrementWishlist,
} = wishlistSlice.actions
export default wishlistSlice.reducer
