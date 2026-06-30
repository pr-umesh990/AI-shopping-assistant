import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, GitCompare } from 'lucide-react'
import toast from 'react-hot-toast'
import WishlistCard from '../components/wishlist/WishlistCard.jsx'
import WishlistStats from '../components/wishlist/WishlistStats.jsx'
import ProductCard from '../components/common/ProductCard.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import { getWishlist, removeFromWishlist, toggleWishlistAlert, getWishlistRecommendations } from '../api/axios.js'
import { useWishlist } from '../hooks/useWishlist.js'

const TABS = [
  { label: 'All Items', value: 'all' },
  { label: 'Price Drops', value: 'drops' },
  { label: 'In Stock', value: 'available' },
]

const WishlistPage = () => {
  const navigate = useNavigate()
  const { setWishlistItems, removeFromWishlistLocal } = useWishlist()
  const [items, setItems] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  const stats = {
    totalTracked: items.length,
    potentialSavings: items.reduce((acc, i) => {
      const save = (i.priceAtSave || 0) - (i.productId?.currentPrice || i.priceAtSave || 0)
      return acc + Math.max(0, save)
    }, 0),
    activeAlerts: items.filter(i => i.notifyEnabled).length,
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getWishlist({ limit: 50 }),
      getWishlistRecommendations().catch(() => null),
    ]).then(([wRes, rRes]) => {
      const list = wRes.data?.data?.items || wRes.data?.data?.wishlist || []
      setItems(list)
      setWishlistItems(list)
      setRecommendations(rRes?.data?.data?.recommendations || [])
    }).catch(() => {
      toast.error('Could not load wishlist.')
    }).finally(() => setLoading(false))
  }, [])

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId)
      setItems(prev => prev.filter(i => (i.productId?._id || i.productId) !== productId))
      removeFromWishlistLocal(productId)
      toast.success('Removed from wishlist.')
    } catch {
      toast.error('Could not remove item.')
    }
  }

  const handleToggleAlert = async (productId, enabled) => {
    try {
      await toggleWishlistAlert(productId, enabled)
      setItems(prev => prev.map(i =>
        (i.productId?._id || i.productId) === productId ? { ...i, notifyEnabled: enabled } : i
      ))
      toast.success(enabled ? 'Price alert enabled.' : 'Price alert disabled.')
    } catch {
      toast.error('Could not update alert.')
    }
  }

  const filteredItems = items.filter(item => {
    if (tab === 'drops') return (item.priceDrop || 0) > 0
    if (tab === 'available') return item.productId?.stock > 0
    return true
  })

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="container" style={{ padding:'2rem 1rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:'1.75rem', color:'var(--gray-900)' }}>My Wishlist</h1>
          <p style={{ color:'var(--gray-500)' }}>{items.length} saved {items.length === 1 ? 'product' : 'products'}</p>
        </div>
      </div>

      {/* Stats */}
      <WishlistStats stats={stats} />

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.value}
            className={`tab-btn ${tab === t.value ? 'active' : ''}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="wishlist-grid">
          {filteredItems.map(item => (
            <WishlistCard
              key={item._id}
              item={item}
              onRemove={handleRemove}
              onToggleAlert={handleToggleAlert}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={tab === 'all' ? 'Your wishlist is empty' : 'No items in this filter'}
          description={tab === 'all' ? 'Browse products and tap the heart icon to save them here.' : 'Try another filter tab.'}
          actionLabel={tab === 'all' ? 'Browse Products' : undefined}
          onAction={tab === 'all' ? () => navigate('/') : undefined}
        />
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginTop:'3rem' }}>
          <h2 style={{ fontWeight:700, fontSize:'1.25rem', marginBottom:'1.25rem' }}>
            You Might Also Like
          </h2>
          <div className="scroll-row">
            {recommendations.map(p => (
              <ProductCard key={p._id} product={p} showCompare showWishlist />
            ))}
          </div>
        </div>
      )}

      {/* Compare sticky bar */}
      {filteredItems.length >= 2 && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'2px solid var(--primary)', padding:'0.85rem 1.5rem', display:'flex', justifyContent:'center', zIndex:80 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              const ids = filteredItems.slice(0, 4).map(i => i.productId?._id || i.productId).join(',')
              navigate(`/compare?ids=${ids}`)
            }}
          >
            <GitCompare size={15} /> Compare Wishlist Items
          </button>
        </div>
      )}
    </div>
  )
}

export default WishlistPage
