import { useNavigate } from 'react-router-dom'
import { GitCompare, X, Plus } from 'lucide-react'
import { useCompare } from '../../hooks/useCompare.js'

const PLACEHOLDER = 'https://placehold.co/52x52/eef2ff/6366f1?text=+'

const ComparisonTray = () => {
  const navigate = useNavigate()
  const { items, remove, clear } = useCompare()

  if (items.length < 2) return null

  return (
    <div className="comparison-tray">
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
        <GitCompare size={18} style={{ color:'var(--primary)' }} />
        <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--gray-800)', whiteSpace:'nowrap' }}>
          Compare ({items.length})
        </span>
      </div>

      <div className="tray-items">
        {items.map(p => (
          <div key={p._id} className="tray-item">
            <img
              src={p.images?.[0] || PLACEHOLDER}
              alt={p.name}
              onError={e => { e.target.src = PLACEHOLDER }}
            />
            <button className="tray-remove" onClick={() => remove(p._id)}>×</button>
          </div>
        ))}
        {items.length < 4 && (
          <div className="tray-placeholder">
            <Plus size={18} />
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:'0.75rem', flexShrink:0 }}>
        <button className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/compare?ids=${items.map(p=>p._id).join(',')}`)}
        >
          <GitCompare size={15} /> Compare Now
        </button>
      </div>
    </div>
  )
}

export default ComparisonTray
