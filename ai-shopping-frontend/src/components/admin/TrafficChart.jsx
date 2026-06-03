import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']

const TrafficChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, color:'var(--gray-400)', fontSize:'0.875rem' }}>
        No traffic data.
      </div>
    )
  }

  const chartData = data.map(d => ({ name: d.channel, value: d.percentage }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend
          formatter={(value) => <span style={{ fontSize:'0.8rem', color:'var(--gray-700)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default TrafficChart
