import { useNavigate } from 'react-router-dom'
import { Trash2, ExternalLink } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/400x200/eef2ff/6366f1?text=No+Image'

const WishlistCard = ({ item, onRemove, onToggleAlert }) => {
  const navigate = useNavigate()
  if (!item || !item.productId) return null

  const product = item.productId
  const priceDrop = item.priceDrop || 0
  const priceWentDown = priceDrop > 0
  const priceWentUp = priceDrop < 0

  const currentPrice = product.currentPrice || item.currentPrice || item.priceAtSave
  const originalSaved = item.priceAtSave
  const savings = originalSaved - currentPrice

  const daysAgo = item.savedAt
    ? Math.floor((Date.now() - new Date(item.savedAt)) / 86400000)
    : null

  return (
    <div className="wishlist-card">
      <div className="wishlist-card-img">
        <img
          src={product.images?.[0] || PLACEHOLDER}
          alt={product.name}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={e => { e.target.src = PLACEHOLDER }}
        />
        {priceWentDown && (
          <span className="price-drop-badge">↓ {priceDrop.toFixed(0)}% OFF</span>
        )}
        {priceWentUp && (
          <span className="price-drop-badge price-up-badge">↑ {Math.abs(priceDrop).toFixed(0)}% UP</span>
        )}
      </div>

      <div className="wishlist-card-body">
        {product.categoryId?.name && (
          <span className="badge badge-gray" style={{ marginBottom:'0.5rem' }}>
            {product.categoryId.name}
          </span>
        )}

        <h4 style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--gray-800)', marginBottom:'0.5rem',
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {product.name}
        </h4>

        <div style={{ display:'flex', alignItems:'baseline', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.3rem' }}>
          <span style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--gray-900)' }}>
            ${currentPrice?.toLocaleString()}
          </span>
          {originalSaved && originalSaved !== currentPrice && (
            <span style={{ fontSize:'0.82rem', textDecoration:'line-through', color:'var(--gray-400)' }}>
              ${originalSaved?.toLocaleString()}
            </span>
          )}
        </div>

        {savings > 0 && (
          <p style={{ fontSize:'0.78rem', color:'var(--success)', fontWeight:600, marginBottom:'0.3rem' }}>
            You're saving ${savings.toFixed(2)}
          </p>
        )}

        {daysAgo !== null && (
          <p style={{ fontSize:'0.75rem', color:'var(--gray-400)' }}>
            Saved {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
          </p>
        )}

        {/* Notify Toggle */}
        <div className="wishlist-notify">
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={item.notifyEnabled || false}
                onChange={e => onToggleAlert?.(item.productId._id || item.productId, e.target.checked)}
              />
              <div className="toggle-track">
                <div className="toggle-thumb" />
              </div>
            </label>
            <span style={{ fontSize:'0.78rem', color:'var(--gray-600)' }}>Notify</span>
          </div>
          <div style={{ display:'flex', gap:'0.4rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding:'0.35rem 0.5rem' }}
              onClick={() => navigate(`/product/${product._id || product}`)}
              title="View Product"
            >
              <ExternalLink size={13} />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding:'0.35rem 0.5rem', color:'var(--danger)' }}
              onClick={() => onRemove?.(product._id || product)}
              title="Remove"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WishlistCard
