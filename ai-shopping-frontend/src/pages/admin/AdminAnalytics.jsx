import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import RevenueChart from '../../components/admin/RevenueChart.jsx'
import TrafficChart from '../../components/admin/TrafficChart.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { getRevenueByCategory, getTrafficChannels, getAffiliateMilestone } from '../../api/axios.js'

const AdminAnalytics = () => {
  const [revenueData, setRevenueData] = useState([])
  const [trafficData, setTrafficData] = useState([])
  const [milestone, setMilestone] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getRevenueByCategory().catch(() => null),
      getTrafficChannels().catch(() => null),
      getAffiliateMilestone().catch(() => null),
    ]).then(([rRes, tRes, mRes]) => {
      setRevenueData(rRes?.data?.data?.categories || [])
      setTrafficData(tRes?.data?.data?.channels || [])
      setMilestone(mRes?.data?.data || null)
    }).catch(() => {
      toast.error('Could not load analytics.')
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <h1 style={{ fontWeight:800, fontSize:'1.5rem', marginBottom:'1.5rem' }}>Analytics</h1>

      {/* Revenue Chart (full width) */}
      <div className="chart-card" style={{ marginBottom:'1.5rem' }}>
        <h3>Revenue by Category</h3>
        <p style={{ color:'var(--gray-500)', fontSize:'0.875rem', marginBottom:'1rem' }}>Affiliate click revenue breakdown by product category.</p>
        <RevenueChart data={revenueData} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Traffic Channels */}
        <div className="chart-card">
          <h3>Traffic Channels</h3>
          <p style={{ color:'var(--gray-500)', fontSize:'0.875rem', marginBottom:'1rem' }}>Visitor source breakdown.</p>
          <TrafficChart data={trafficData} />
        </div>

        {/* Milestone */}
        <div className="chart-card">
          <h3>Affiliate Revenue Milestone</h3>
          {milestone ? (
            <div>
              <div style={{ marginBottom:'0.75rem' }}>
                <div style={{ fontSize:'2rem', fontWeight:900, color:'var(--primary)', fontFamily:'var(--font-display)' }}>
                  ${milestone.current?.toLocaleString()}
                </div>
                <div style={{ color:'var(--gray-500)', fontSize:'0.875rem' }}>
                  of ${milestone.target?.toLocaleString()} target
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom:'0.75rem' }}>
                <div
                  className="progress-fill"
                  style={{ width:`${Math.min(100, ((milestone.current || 0) / (milestone.target || 1)) * 100)}%` }}
                />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--gray-500)' }}>
                <span>Progress: {Math.round(((milestone.current || 0) / (milestone.target || 1)) * 100)}%</span>
                <span>Remaining: ${((milestone.target || 0) - (milestone.current || 0)).toLocaleString()}</span>
              </div>

              {milestone.breakdown?.length > 0 && (
                <div style={{ marginTop:'1.25rem' }}>
                  <h4 style={{ fontWeight:700, fontSize:'0.875rem', marginBottom:'0.75rem' }}>By Retailer</h4>
                  {milestone.breakdown.map((b, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--gray-100)', fontSize:'0.875rem' }}>
                      <span style={{ color:'var(--gray-700)' }}>{b.retailer}</span>
                      <span style={{ fontWeight:700 }}>${b.revenue?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color:'var(--gray-400)', fontSize:'0.875rem', padding:'2rem 0', textAlign:'center' }}>
              No milestone data available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
