import { Sparkles } from 'lucide-react'

const AIQueryBanner = ({ interpretation }) => {
  if (!interpretation?.summary) return null

  return (
    <div className="ai-query-banner">
      <div className="ai-query-icon">
        <Sparkles size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.35rem' }}>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            AI Interpretation
          </span>
        </div>
        <div className="ai-query-summary">
          {interpretation.summary}
        </div>
        {interpretation.filterTags?.length > 0 && (
          <div className="ai-filter-tags">
            {interpretation.filterTags.map((tag, i) => (
              <span key={i} className="ai-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIQueryBanner
