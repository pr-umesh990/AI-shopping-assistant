import { createSlice } from '@reduxjs/toolkit'
import toast from 'react-hot-toast'

const stored = sessionStorage.getItem('compare')
let initialItems = []
try { initialItems = stored ? JSON.parse(stored) : [] } catch { initialItems = [] }

const compareSlice = createSlice({
  name: 'compare',
  initialState: { items: initialItems },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload
      if (state.items.length >= 4) {
        toast.error('You can compare up to 4 products only.')
        return
      }
      const exists = state.items.find(p => p._id === product._id)
      if (exists) {
        toast('Already in compare list.', { icon: 'i' })
        return
      }
      state.items.push(product)
      sessionStorage.setItem('compare', JSON.stringify(state.items))
      toast.success(`${product.name} added to compare.`)
    },
    removeFromCompare: (state, action) => {
      state.items = state.items.filter(p => p._id !== action.payload)
      sessionStorage.setItem('compare', JSON.stringify(state.items))
    },
    clearCompare: (state) => {
      state.items = []
      sessionStorage.removeItem('compare')
    },
  },
})

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions
export default compareSlice.reducer
