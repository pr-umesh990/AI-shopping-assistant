import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice.js'
import compareReducer from './compareSlice.js'
import wishlistReducer from './wishlistSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    compare: compareReducer,
    wishlist: wishlistReducer,
  },
})

export default store
