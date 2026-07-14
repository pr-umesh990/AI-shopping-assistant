import { useNavigate } from 'react-router-dom'
import PriceTag from '../common/PriceTag.jsx'
import StarRating from '../common/StarRating.jsx'

const PLACEHOLDER = 'https://placehold.co/200x140/eef2ff/6366f1?text=No+Image'

const RecentlyViewed = ({ excludeId }) => {
  const navigate = useNavigate()

  let items = []
  try {
    items = JSON.parse(localStorage.getItem('smartshop_recently_viewed') || '[]')
  } catch { items = [] }

  // Exclude current product
  const filtered = items.filter(p => p._id !== excludeId)

  if (filtered.length === 0) return null

  return (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--gray-900)' }}>
        Recently Viewed
      </h3>
      <div className="scroll-row">
        {filtered.map(p => (
          <div
            key={p._id}
            className="card"
            style={{ width: 180, flexShrink: 0, cursor: 'pointer', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
            onClick={() => navigate(`/product/${p._id}`)}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = ''}
          >
            <img
              src={p.images?.[0] || PLACEHOLDER}
              alt={p.name}
              style={{ width: '100%', height: 120, objectFit: 'cover', background: 'var(--gray-100)' }}
              onError={e => { e.target.src = PLACEHOLDER }}
            />
            <div style={{ padding: '0.65rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem' }}>
                {p.brand}
              </div>
              <div style={{
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.35rem',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {p.name}
              </div>
              <PriceTag current={p.currentPrice} original={p.originalPrice} />
              {p.rating > 0 && <StarRating rating={p.rating} size={11} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentlyViewed