import axiosLib from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

const axios = axiosLib.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    if (error.response?.status === 503) {
      toast.error('AI service temporarily unavailable.')
    }
    if (!error.response) {
      toast.error('Network error. Please check your connection.')
    }
    return Promise.reject(error)
  }
)

// Auth
export const registerUser = (data) => axios.post('/auth/register', data)
export const loginUser = (data) => axios.post('/auth/login', data)
export const getMe = () => axios.get('/auth/me')
export const updateMe = (data) => axios.patch('/auth/me', data)

// Products
export const getProducts = (params) => axios.get('/products', { params })
export const getTrendingProducts = () => axios.get('/products/trending')
export const getProduct = (id) => axios.get(`/products/${id}`)
export const getPriceHistory = (id) => axios.get(`/products/${id}/price-history`)
export const getAiReview = (id) => axios.get(`/products/${id}/ai-review`)
export const getAlternatives = (id) => axios.get(`/products/${id}/alternatives`)

// Categories
export const getCategories = () => axios.get('/categories')
export const getCategoryProducts = (slug, params) => axios.get(`/categories/${slug}/products`, { params })
export const getCategoryInsight = (slug) => axios.get(`/categories/${slug}/ai-insight`)

// Search
export const searchProducts = (data) => axios.post('/search', data)
export const getSearchSuggestions = (q) => axios.get('/search/suggestions', { params: { q } })

// Compare
export const compareProducts = (ids) => axios.get('/compare', { params: { ids: ids.join(',') } })
export const getCompareVerdict = (ids) => axios.get('/compare/ai-verdict', { params: { ids: ids.join(',') } })

//Wishlist
export const getWishlist = (params) => axios.get('/wishlist', { params })
export const addToWishlist = (productId) => axios.post('/wishlist', { productId })
export const removeFromWishlist = (productId) => axios.delete(`/wishlist/${productId}`)
export const toggleWishlistAlert = (productId, enabled) => axios.patch(`/wishlist/${productId}/alert`, { enabled })
export const getWishlistRecommendations = () => axios.get('/wishlist/recommendations')

//Affiliate
export const trackAffiliateClick = (data) => axios.post('/affiliate/click', data)

//Newsletter
export const subscribeNewsletter = (email) => axios.post('/newsletter/subscribe', { email })

//admin
export const getAdminStats = () => axios.get('/admin/stats')
export const getAdminProducts = (params) => axios.get('/admin/products', { params })
export const createAdminProduct = (data) => axios.post('/admin/products', data)
export const updateAdminProduct = (id, data) => axios.put(`/admin/products/${id}`, data)
export const deleteAdminProduct = (id) => axios.delete(`/admin/products/${id}`)
export const getRevenueByCategory = () => axios.get('/admin/analytics/revenue-by-category')
export const getTrafficChannels = () => axios.get('/admin/analytics/traffic-channels')
export const getAffiliateMilestone = () => axios.get('/admin/analytics/affiliate-milestone')

export const getAdminCategories = (params) => axios.get('/admin/categories', { params })
export const createAdminCategory = (data) => axios.post('/admin/categories', data)
export const updateAdminCategory = (id, data) => axios.put(`/admin/categories/${id}`, data)
export const deleteAdminCategory = (id) => axios.delete(`/admin/categories/${id}`)

//Subcategories (public)
export const getSubcategories = (categoryId) =>
  axios.get('/subcategories', { params: { categoryId } })
export const getSubcategory = (id) => axios.get(`/subcategories/${id}`)

//subcategories (admin)
export const getAdminSubcategories = (categoryId) =>
  axios.get('/admin/subcategories', { params: { categoryId } })
export const createAdminSubcategory = (data) =>
  axios.post('/admin/subcategories', data)
export const updateAdminSubcategory = (id, data) =>
  axios.put(`/admin/subcategories/${id}`, data)
export const deleteAdminSubcategory = (id) =>
  axios.delete(`/admin/subcategories/${id}`)

export default axios
