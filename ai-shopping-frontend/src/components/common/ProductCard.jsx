import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, GitCompare, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import StarRating from './StarRating.jsx'
import PriceTag from './PriceTag.jsx'
import AIBadge from './AIBadge.jsx'
import { addToWishlist } from '../../api/axios.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useCompare } from '../../hooks/useCompare.js'
import { useWishlist } from '../../hooks/useWishlist.js'

const PLACEHOLDER = 'https://placehold.co/400x300/eef2ff/6366f1?text=No+Image'

const ProductCard = ({ product, showCompare = true, showWishlist = true, fullWidth = false }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { add: addCompare, isInCompare } = useCompare()
  const { increment } = useWishlist()
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  if (!product) return null

  const imgSrc = product.images?.[0] || PLACEHOLDER
  const inCompare = isInCompare(product._id)

  const handleWishlist = async (e) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please login to save products.')
      navigate('/login')
      return
    }
    if (wishlisted) return
    setWishlistLoading(true)
    try {
      await addToWishlist(product._id)
      setWishlisted(true)
      increment()
      toast.success('Added to wishlist!')
    } catch (err) {
      if (err.response?.status === 409) {
        setWishlisted(true)
        toast('Already in your wishlist.', { icon: '💙' })
      } else {
        toast.error('Could not add to wishlist.')
      }
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleCompare = (e) => {
    e.stopPropagation()
    addCompare(product)
  }

  return (
    <div
      className={`product-card card-hover ${fullWidth ? 'full-width' : ''}`}
      style={{ cursor: 'pointer', width: fullWidth ? '100%' : undefined }}
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={imgSrc}
          alt={product.name}
          className="product-card-img"
          onError={e => { e.target.src = PLACEHOLDER }}
        />
        {showWishlist && (
          <button
            className={`icon-btn ${wishlisted ? 'active' : ''}`}
            style={{ position: 'absolute', top: 8, right: 8, background: 'white' }}
            onClick={handleWishlist}
            disabled={wishlistLoading}
            title="Save to Wishlist"
          >
            <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="product-card-body">
        <div className="product-brand">{product.brand}</div>
        <div className="product-name">{product.name}</div>

        {product.rating > 0 && (
          <StarRating rating={product.rating} count={product.reviewCount} size={12} />
        )}

        {product.badges?.length > 0 && (
          <div className="product-badges">
            {product.badges.slice(0, 2).map((b, i) => (
              <AIBadge key={i} label={b} variant={i === 0 ? 'primary' : 'success'} />
            ))}
          </div>
        )}

        <div className="product-footer">
          <PriceTag current={product.currentPrice} original={product.originalPrice} currency={product.currency} />
          <div className="product-card-actions">
            {showCompare && (
              <button
                className={`icon-btn ${inCompare ? 'active' : ''}`}
                onClick={handleCompare}
                title="Add to Compare"
              >
                <GitCompare size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
