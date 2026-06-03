import { TrendingUp, TrendingDown } from 'lucide-react'

const KPICard = ({ title, value, change, icon: Icon, prefix = '', suffix = '', iconBg = '#eef2ff', iconColor = 'var(--primary)' }) => {
  const isPositive = change > 0
  const isZero = change === 0

  const fmt = (v) => {
    if (typeof v === 'number') return v.toLocaleString()
    return v
  }

  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: iconBg }}>
        {Icon && <Icon size={20} style={{ color: iconColor }} />}
      </div>
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{prefix}{fmt(value)}{suffix}</div>
      {change !== undefined && !isZero && (
        <div className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change)}% {isPositive ? 'increase' : 'decrease'} vs last month
        </div>
      )}
      {isZero && (
        <div className="kpi-change" style={{ color:'var(--gray-400)' }}>No change vs last month</div>
      )}
    </div>
  )
}

export default KPICard
