import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#eef2ff']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 700, color: 'var(--gray-800)', marginBottom: '0.35rem' }}>{label}</p>
      <p style={{ color: '#6366f1' }}>Clicks: <strong>{payload[0]?.value?.toLocaleString()}</strong></p>
      {payload[1] && (
        <p style={{ color: '#10b981' }}>Revenue: <strong>${payload[1]?.value?.toFixed(2)}</strong></p>
      )}
    </div>
  )
}

const RevenueChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
        No data yet — affiliate clicks will appear here.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: 'var(--gray-500)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--gray-500)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RevenueChart
