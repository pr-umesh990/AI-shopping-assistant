import { useSelector, useDispatch } from 'react-redux'
import { addToCompare, removeFromCompare, clearCompare } from '../store/compareSlice.js'

export const useCompare = () => {
  const dispatch = useDispatch()
  const { items } = useSelector(s => s.compare)

  const add = (product) => dispatch(addToCompare(product))
  const remove = (id) => dispatch(removeFromCompare(id))
  const clear = () => dispatch(clearCompare())
  const isInCompare = (id) => items.some(p => p._id === id)

  return { items, add, remove, clear, isInCompare }
}

export default useCompare
