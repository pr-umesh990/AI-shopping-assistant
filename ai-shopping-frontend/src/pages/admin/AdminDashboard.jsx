import { useState, useEffect } from 'react'
import { Users, ShoppingBag, MousePointerClick, DollarSign, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import KPICard from '../../components/admin/KPICard.jsx'
import ProductTable from '../../components/admin/ProductTable.jsx'
import RevenueChart from '../../components/admin/RevenueChart.jsx'
import TrafficChart from '../../components/admin/TrafficChart.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { getAdminStats, getAdminProducts, getRevenueByCategory, getTrafficChannels, createAdminProduct, updateAdminProduct, deleteAdminProduct } from '../../api/axios.js'
import ProductModal from './ProductModal.jsx'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [trafficData, setTrafficData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, product: null })
  const [page, setPage] = useState(1)

  const fetchAll = async () => {
    try {
      const [sRes, pRes, rRes, tRes] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminProducts({ page, limit: 8 }),
        getRevenueByCategory().catch(() => null),
        getTrafficChannels().catch(() => null),
      ])
      setStats(sRes?.data?.data || {})
      setProducts(pRes.data?.data?.products || [])
      setPagination(pRes.data?.data?.pagination || null)
      setRevenueData(rRes?.data?.data?.categories || [])
      setTrafficData(tRes?.data?.data?.channels || [])
    } catch {
      toast.error('Could not load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [page])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await deleteAdminProduct(id)
      toast.success('Product deleted.')
      fetchAll()
    } catch { toast.error('Could not delete product.') }
  }

  const handleSave = async (data) => {
    try {
      if (modal.product) {
        await updateAdminProduct(modal.product._id, data)
        toast.success('Product updated.')
      } else {
        await createAdminProduct(data)
        toast.success('Product created.')
      }
      setModal({ open: false, product: null })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.')
    }
  }

  const KPIs = [
    { title: 'Total Revenue', value: stats?.totalRevenue || 0, change: stats?.revenueChange, icon: DollarSign, prefix: '$', iconBg: '#d1fae5', iconColor: '#059669' },
    { title: 'Affiliate Clicks', value: stats?.totalClicks || 0, change: stats?.clicksChange, icon: MousePointerClick, iconBg: '#ede9fe', iconColor: 'var(--secondary)' },
    { title: 'Active Users', value: stats?.activeUsers || 0, change: stats?.usersChange, icon: Users, iconBg: '#dbeafe', iconColor: '#2563eb' },
    { title: 'Catalog Size', value: stats?.totalProducts || 0, change: stats?.productsChange, icon: ShoppingBag, iconBg: '#fef3c7', iconColor: '#d97706' },
  ]

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontWeight:800, fontSize:'1.5rem', color:'var(--gray-900)' }}>Dashboard Overview</h1>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, product: null })}>
          <Plus size={15} /> Add New Product
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {KPIs.map(k => <KPICard key={k.title} {...k} />)}
      </div>

      {/* Products Table */}
      <div className="chart-card" style={{ marginTop:'2rem' }}>
        <h3>Product Catalog</h3>
        <ProductTable
          products={products}
          onEdit={p => setModal({ open: true, product: p })}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>

      {/* Charts */}
      <div className="admin-charts-row">
        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <RevenueChart data={revenueData} />
        </div>
        <div className="chart-card">
          <h3>Traffic Channels</h3>
          <TrafficChart data={trafficData} />
          {stats?.affiliateMilestone != null && (
            <div style={{ marginTop:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontSize:'0.825rem', fontWeight:600, color:'var(--gray-700)' }}>
                <span>Revenue Milestone</span>
                <span>${stats.affiliateMilestone?.current?.toLocaleString()} / ${stats.affiliateMilestone?.target?.toLocaleString()}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width:`${Math.min(100, (stats.affiliateMilestone?.current / stats.affiliateMilestone?.target) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <ProductModal
          product={modal.product}
          onSave={handleSave}
          onClose={() => setModal({ open: false, product: null })}
        />
      )}
    </div>
  )
}

export default AdminDashboard
