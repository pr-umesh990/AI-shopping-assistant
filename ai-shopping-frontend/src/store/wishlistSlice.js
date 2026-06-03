import { createSlice } from '@reduxjs/toolkit'

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { count: 0 },
  reducers: {
    setWishlistCount: (state, action) => { state.count = action.payload },
    incrementWishlist: (state) => { state.count += 1 },
    decrementWishlist: (state) => { state.count = Math.max(0, state.count - 1) },
  },
})

export const { setWishlistCount, incrementWishlist, decrementWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
