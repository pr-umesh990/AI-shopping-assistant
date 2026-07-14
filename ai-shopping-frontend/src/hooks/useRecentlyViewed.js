import { useCallback } from 'react'

const KEY = 'smartshop_recently_viewed'
const MAX = 6

export const useRecentlyViewed = () => {
  const getItems = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  }, [])

  const addItem = useCallback((product) => {
    if (!product?._id) return
    try {
      const existing = getItems()
      const filtered = existing.filter(p => p._id !== product._id)
      const slim = {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        currentPrice: product.currentPrice,
        originalPrice: product.originalPrice,
        images: product.images?.slice(0, 1) || [],
        rating: product.rating,
        reviewCount: product.reviewCount,
      }
      const updated = [slim, ...filtered].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(updated))
    } catch { /* silent */ }
  }, [getItems])

  const removeItem = useCallback((productId) => {
    try {
      const updated = getItems().filter(p => p._id !== productId)
      localStorage.setItem(KEY, JSON.stringify(updated))
    } catch { /* silent */ }
  }, [getItems])

  const clearAll = useCallback(() => {
    localStorage.removeItem(KEY)
  }, [])

  return { getItems, addItem, removeItem, clearAll }
}

export default useRecentlyViewed