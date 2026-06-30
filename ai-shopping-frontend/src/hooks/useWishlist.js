import { useSelector, useDispatch } from 'react-redux'
import {
  setWishlist,
  addToWishlistState,
  removeFromWishlistState,
  setWishlistCount,
  incrementWishlist,
  decrementWishlist
} from '../store/wishlistSlice.js'

export const useWishlist = () => {
  const dispatch = useDispatch()
  const { count, items } = useSelector(s => s.wishlist)

  const setCount = (n) => dispatch(setWishlistCount(n))
  const increment = () => dispatch(incrementWishlist())
  const decrement = () => dispatch(decrementWishlist())

  const setWishlistItems = (arr) => dispatch(setWishlist(arr))
  const addToWishlistLocal = (item) => dispatch(addToWishlistState(item))
  const removeFromWishlistLocal = (productId) => dispatch(removeFromWishlistState(productId))

  return {
    count,
    items,
    setCount,
    increment,
    decrement,
    setWishlistItems,
    addToWishlistLocal,
    removeFromWishlistLocal
  }
}

export default useWishlist
