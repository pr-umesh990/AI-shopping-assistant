import { useNavigate } from 'react-router-dom'
import { GitCompare } from 'lucide-react'
import StarRating from '../common/StarRating.jsx'
import PriceTag from '../common/PriceTag.jsx'
import { useCompare } from '../../hooks/useCompare.js'

const PLACEHOLDER = 'https://placehold.co/200x160/eef2ff/6366f1?text=No+Image'

const AlternativesRow = ({ alternatives = [] }) => {
  const navigate = useNavigate()
  const { add, isInCompare } = useCompare()

  if (!alternatives.length) return null

  return (
    <div>
      <h3 style={{ fontWeight:700, fontSize:'1.05rem', marginBottom:'1rem' }}>You Might Also Like</h3>
      <div className="scroll-row">
        {alternatives.map(p => (
          <div
            key={p._id}
            className="card card-hover"
            style={{ width:200, flexShrink:0, cursor:'pointer', overflow:'hidden' }}
            onClick={() => navigate(`/product/${p._id}`)}
          >
            <img
              src={p.images?.[0] || PLACEHOLDER}
              alt={p.name}
              style={{ width:'100%', height:130, objectFit:'cover', background:'var(--gray-100)' }}
              onError={e => { e.target.src = PLACEHOLDER }}
            />
            <div style={{ padding:'0.75rem' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--primary)', marginBottom:'0.25rem' }}>{p.brand}</div>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--gray-800)', marginBottom:'0.4rem',
                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {p.name}
              </div>
              <PriceTag current={p.currentPrice} original={p.originalPrice} />
              <StarRating rating={p.rating} size={11} />
              <button
                className="btn btn-ghost btn-sm"
                style={{ width:'100%', marginTop:'0.5rem', fontSize:'0.75rem' }}
                onClick={e => { e.stopPropagation(); add(p) }}
              >
                <GitCompare size={12} /> {isInCompare(p._id) ? 'In Compare' : 'Compare'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlternativesRow
