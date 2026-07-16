import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Search, Users, Heart, Package, BarChart2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import RevenueChart from '../../components/admin/RevenueChart.jsx'
import TrafficChart from '../../components/admin/TrafficChart.jsx'
import AdminLineChart from '../../components/admin/LineChart.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import {
  getRevenueByCategory,
  getTrafficChannels,
  getAffiliateMilestone,
  getSearchTrends,
  getUserRegistrations,
  getMostWishlisted,
  getProductsOverTime,
} from '../../api/axios.js'

// ── Section Card wrapper ──────────────────────────────────
const ChartCard = ({ title, subtitle, icon: Icon, children, loading, color = 'var(--primary)' }) => (
  <div className="card" style={{ padding: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <div style={{ width: 32, height: 32, background: `${color}18`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{subtitle}</div>}
      </div>
    </div>
    {loading ? <LoadingSpinner size="sm" /> : children}
  </div>
)

const AdminAnalytics = () => {
  const [loading, setLoading] = useState({
    revenue: true, traffic: true, milestone: true,
    trends: true, registrations: true, wishlisted: true, products: true,
  })

  const [data, setData] = useState({
    revenue: [],
    traffic: [],
    milestone: null,
    trends: [],
    registrations: [],
    wishlisted: [],
    products: [],
  })

  const setL = (key, val) => setLoading(p => ({ ...p, [key]: val }))
  const setD = (key, val) => setData(p => ({ ...p, [key]: val }))

  const fetchAll = useCallback(async () => {
    // Reset loading
    setLoading({ revenue: true, traffic: true, milestone: true, trends: true, registrations: true, wishlisted: true, products: true })

    const safe = async (fn, key, dataKey) => {
      try {
        const res = await fn()
        const d = res.data?.data
        setD(key, dataKey ? d?.[dataKey] : d)
      } catch {
        // silent — chart shows empty state
      } finally {
        setL(key, false)
      }
    }

    Promise.all([
      safe(getRevenueByCategory, 'revenue', 'data'),
      safe(getTrafficChannels, 'traffic', 'data'),
      safe(getAffiliateMilestone, 'milestone', null),
      safe(getSearchTrends, 'trends', 'data'),
      safe(getUserRegistrations, 'registrations', 'data'),
      safe(getMostWishlisted, 'wishlisted', 'data'),
      safe(getProductsOverTime, 'products', 'data'),
    ])
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--gray-900)' }}>Analytics</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Real-time data from the last 30 days</p>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={fetchAll}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Milestone Banner */}
      {!loading.milestone && data.milestone && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                Monthly Affiliate Goal
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{data.milestone.message}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: '1.75rem', lineHeight: 1 }}>
                {data.milestone.percentage}%
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                {data.milestone.currentClicks?.toLocaleString()} / {data.milestone.goalClicks?.toLocaleString()} clicks
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: '0.85rem', background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 8 }}>
            <div style={{
              width: `${Math.min(data.milestone.percentage || 0, 100)}%`,
              background: 'white', borderRadius: 999, height: '100%',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Row 1: Revenue + Traffic */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <ChartCard
          title="Revenue by Category"
          subtitle="Affiliate clicks & estimated revenue"
          icon={BarChart2}
          loading={loading.revenue}
          color="#6366f1"
        >
          <RevenueChart data={data.revenue} />
        </ChartCard>

        <ChartCard
          title="Traffic Breakdown"
          subtitle="Activity sources last 30 days"
          icon={TrendingUp}
          loading={loading.traffic}
          color="#8b5cf6"
        >
          <TrafficChart data={data.traffic} />
        </ChartCard>
      </div>

      {/* Row 2: User Registrations + Products Over Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <ChartCard
          title="User Registrations"
          subtitle="New signups per day (last 30 days)"
          icon={Users}
          loading={loading.registrations}
          color="#10b981"
        >
          <AdminLineChart
            data={data.registrations}
            color="#10b981"
            valueLabel="Registrations"
          />
        </ChartCard>

        <ChartCard
          title="Products Added"
          subtitle="Catalog growth per day (last 30 days)"
          icon={Package}
          loading={loading.products}
          color="#f59e0b"
        >
          <AdminLineChart
            data={data.products}
            color="#f59e0b"
            valueLabel="Products"
          />
        </ChartCard>
      </div>

      {/* Row 3: Search Trends + Most Wishlisted */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Search Trends Table */}
        <ChartCard
          title="Top Search Queries"
          subtitle="Most searched in last 30 days"
          icon={Search}
          loading={loading.trends}
          color="#6366f1"
        >
          {data.trends?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.trends.map((t, i) => (
                <div key={t.query} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: i < 3 ? 'var(--primary)' : 'var(--gray-100)',
                    color: i < 3 ? 'white' : 'var(--gray-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--gray-700)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.query}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', flexShrink: 0 }}>
                    {t.count}×
                  </span>
                  <div style={{ width: 60, background: 'var(--gray-100)', borderRadius: 999, height: 4, flexShrink: 0 }}>
                    <div style={{
                      width: `${Math.round((t.count / (data.trends[0]?.count || 1)) * 100)}%`,
                      background: 'var(--primary)', borderRadius: 999, height: '100%',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', margin: 0 }}>
              No searches recorded yet.
            </p>
          )}
        </ChartCard>

        {/* Most Wishlisted */}
        <ChartCard
          title="Most Wishlisted Products"
          subtitle="Top 5 saved by users"
          icon={Heart}
          loading={loading.wishlisted}
          color="#ef4444"
        >
          {data.wishlisted?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.wishlisted.map((p, i) => (
                <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: i === 0 ? '#ef4444' : 'var(--gray-100)',
                    color: i === 0 ? 'white' : 'var(--gray-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  {p.image ? (
                    <img src={p.image} alt={p.name}
                      style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)', flexShrink: 0 }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: 32, height: 32, background: 'var(--gray-100)', borderRadius: 'var(--radius)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.brand}</div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Heart size={11} fill="currentColor" /> {p.wishlistCount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', margin: 0 }}>
              No wishlisted products yet.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

export default AdminAnalytics
