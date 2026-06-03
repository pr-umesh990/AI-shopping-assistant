import { Heart, TrendingDown, Bell } from 'lucide-react'

const WishlistStats = ({ stats }) => {
  if (!stats) return null

  const cards = [
    { label: 'Tracked Products', value: stats.totalTracked ?? 0, icon: Heart, colorClass: 'indigo' },
    { label: 'Potential Savings', value: `$${(stats.potentialSavings ?? 0).toFixed(2)}`, icon: TrendingDown, colorClass: 'green' },
    { label: 'Active Alerts', value: stats.activeAlerts ?? 0, icon: Bell, colorClass: 'amber' },
  ]

  return (
    <div className="wishlist-stats">
      {cards.map(({ label, value, icon: Icon, colorClass }) => (
        <div key={label} className="stat-card">
          <div className={`stat-icon ${colorClass}`}>
            <Icon size={22} />
          </div>
          <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default WishlistStats
