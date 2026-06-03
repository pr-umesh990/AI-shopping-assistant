import { Sparkles, CheckCircle, XCircle } from 'lucide-react'

const AIReviewCard = ({ review }) => {
  if (!review) return null

  return (
    <div className="ai-review-card">
      <div className="ai-review-header">
        <div style={{ width:36, height:36, background:'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Sparkles size={18} color="white" />
        </div>
        <div>
          <h3 style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--gray-900)' }}>AI Review Summary</h3>
        </div>
      </div>
      <p className="ai-review-subtext">
        Synthesized from {review.reviewsAnalyzed > 0 ? `${review.reviewsAnalyzed.toLocaleString()}+` : 'multiple'} verified reviews
      </p>

      <div className="pros-cons">
        <div>
          <h4 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--success)', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <CheckCircle size={15} /> What's Great
          </h4>
          <div className="pros-list">
            {review.pros?.map((p, i) => (
              <div key={i} className="pros-item">
                <CheckCircle size={14} className="pros-icon" />
                {p}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--danger)', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <XCircle size={15} /> Watch Out For
          </h4>
          <div className="cons-list">
            {review.cons?.map((c, i) => (
              <div key={i} className="pros-item">
                <XCircle size={14} className="cons-icon" />
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {review.expertSummary && (
        <div className="expert-summary">
          "{review.expertSummary}"
        </div>
      )}
    </div>
  )
}

export default AIReviewCard
