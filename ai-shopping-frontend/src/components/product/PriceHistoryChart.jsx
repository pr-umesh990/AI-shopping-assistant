import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { TrendingDown } from 'lucide-react'

const fmt = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding:'0.65rem 0.85rem', fontSize:'0.8rem' }}>
      <div style={{ color:'var(--gray-500)' }}>{label}</div>
      <div style={{ fontWeight:700, color:'var(--primary)' }}>${payload[0]?.value?.toFixed(2)}</div>
    </div>
  )
}

const PriceHistoryChart = ({ history = [], currentPrice }) => {
  const data = history.map(h => ({
    date: fmt(h.recordedAt),
    price: h.price,
  }))

  if (data.length === 0) {
    return (
      <div className="price-history-card">
        <h3 style={{ fontWeight:700, marginBottom:'0.5rem' }}>Price History</h3>
        <p style={{ color:'var(--gray-500)', fontSize:'0.875rem' }}>No price history available yet.</p>
      </div>
    )
  }

  const prices = history.map(h => h.price)
  const lowestPrice = Math.min(...prices)
  const highestPrice = Math.max(...prices)
  const savings = highestPrice - currentPrice

  return (
    <div className="price-history-card">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <h3 style={{ fontWeight:700 }}>Price History (180 days)</h3>
        {savings > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', background:'var(--success-light)', color:'#065f46', padding:'0.25rem 0.6rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:700 }}>
            <TrendingDown size={13} />
            ${savings.toFixed(2)} cheaper than peak
          </div>
        )}
      </div>

      <div className="price-stats">
        <div className="price-stat">
          <div className="price-stat-label">Current</div>
          <div className="price-stat-value" style={{ color:'var(--primary)' }}>${currentPrice}</div>
        </div>
        <div className="price-stat">
          <div className="price-stat-label">Lowest</div>
          <div className="price-stat-value" style={{ color:'var(--success)' }}>${lowestPrice}</div>
        </div>
        <div className="price-stat">
          <div className="price-stat-label">Highest</div>
          <div className="price-stat-value" style={{ color:'var(--danger)' }}>${highestPrice}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--gray-500)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--gray-500)' }} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          {currentPrice && (
            <ReferenceLine y={currentPrice} stroke="var(--primary)" strokeDasharray="4 2" />
          )}
          <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--primary)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceHistoryChart
