import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

const CustomTooltip = ({ active, payload, label, valueLabel }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '0.6rem 0.85rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '0.8rem'}}>
      <p style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: '0.2rem' }}>{label}</p>
      <p style={{ color: '#6366f1' }}>{valueLabel || 'Count'}: <strong>{payload[0]?.value}</strong></p>
    </div>
  )
}

const AdminLineChart = ({ data = [], color = '#6366f1', valueLabel = 'Count', height = 180 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
        No data available yet.
      </div>
    )
  }

  // Show only every 5th label to avoid crowding
  const tickFormatter = (val, index) => index % 5 === 0 ? val : ''

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
          tickFormatter={tickFormatter}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip valueLabel={valueLabel} />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default AdminLineChart
