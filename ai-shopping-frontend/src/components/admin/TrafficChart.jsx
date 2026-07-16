import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: 'white', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)', padding: '0.6rem 0.85rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 700, color: d.payload.color, marginBottom: '0.2rem' }}>{d.name}</p>
      <p style={{ color: 'var(--gray-600)' }}>
        {d.value}%
        {d.payload.count > 0 && ` (${d.payload.count.toLocaleString()})`}
      </p>
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const TrafficChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
        No traffic data yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="percentage"
          nameKey="channel"
          labelLine={false}
          label={renderLabel}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default TrafficChart
