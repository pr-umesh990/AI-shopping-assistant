import { useSelector, useDispatch } from 'react-redux'
import { setWishlistCount, incrementWishlist, decrementWishlist } from '../store/wishlistSlice.js'

export const useWishlist = () => {
  const dispatch = useDispatch()
  const { count } = useSelector(s => s.wishlist)

  const setCount = (n) => dispatch(setWishlistCount(n))
  const increment = () => dispatch(incrementWishlist())
  const decrement = () => dispatch(decrementWishlist())

  return { count, setCount, increment, decrement }
}

export default useWishlist
