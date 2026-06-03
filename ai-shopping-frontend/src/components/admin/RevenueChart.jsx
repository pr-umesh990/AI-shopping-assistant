import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding:'0.65rem 0.85rem', fontSize:'0.8rem' }}>
      <div style={{ fontWeight:700, color:'var(--gray-800)', marginBottom:'0.25rem' }}>{label}</div>
      <div style={{ color:'var(--primary)' }}>{payload[0]?.value?.toLocaleString()} clicks</div>
      <div style={{ color:'var(--success)', fontWeight:700 }}>${payload[1]?.value?.toFixed(2)} revenue</div>
    </div>
  )
}

const RevenueChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, color:'var(--gray-400)', fontSize:'0.875rem' }}>
        No revenue data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: 'var(--gray-500)' }}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: 'var(--gray-500)' }} tickFormatter={v => `$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="clicks" name="Clicks" fill="var(--primary-100)" radius={[4,4,0,0]} barSize={22} />
        <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4,4,0,0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default RevenueChart
