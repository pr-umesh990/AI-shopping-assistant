import { Sparkles, Award, TrendingUp } from 'lucide-react'

const AIVerdict = ({ verdict }) => {
  if (!verdict) return null

  const findProductName = (pick) => pick?.reason || ''

  return (
    <div className="ai-verdict">
      <div className="ai-verdict-header">
        <div style={{ width:36, height:36, background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Sparkles size={18} />
        </div>
        <span className="ai-verdict-title">AI Shopping Recommendation</span>
      </div>

      <p className="ai-verdict-narrative">{verdict.narrative}</p>

      <div className="verdict-picks">
        {verdict.proPick && (
          <div className="verdict-pick">
            <div className="verdict-pick-label">
              <Award size={11} style={{ display:'inline', marginRight:4 }} />
              Best Overall
            </div>
            <div className="verdict-pick-name">{verdict.proPick.productId}</div>
            <div className="verdict-pick-reason">{verdict.proPick.reason}</div>
          </div>
        )}
        {verdict.budgetPick && (
          <div className="verdict-pick">
            <div className="verdict-pick-label">
              <TrendingUp size={11} style={{ display:'inline', marginRight:4 }} />
              Best Value
            </div>
            <div className="verdict-pick-name">{verdict.budgetPick.productId}</div>
            <div className="verdict-pick-reason">{verdict.budgetPick.reason}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIVerdict
