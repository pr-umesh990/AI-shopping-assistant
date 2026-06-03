import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import ProductCard from '../components/common/ProductCard.jsx'
import Pagination from '../components/common/Pagination.jsx'
import ComparisonTray from '../components/search/ComparisonTray.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import { getCategoryProducts, getCategoryInsight } from '../api/axios.js'

const CategoryPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [insight, setInsight] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCategoryProducts(slug, { page, limit: 12 }),
      getCategoryInsight(slug).catch(() => null),
    ]).then(([catRes, insightRes]) => {
      const data = catRes.data?.data
      setProducts(data?.products || [])
      setCategoryInfo(data?.category || null)
      setPagination(data?.pagination || null)
      setInsight(insightRes?.data?.data || null)
    }).catch(() => {
      toast.error('Could not load category.')
    }).finally(() => setLoading(false))
  }, [slug, page])

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, var(--primary-50), #f5f3ff)', padding:'2.5rem 0', borderBottom:'1px solid var(--gray-200)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--gray-500)', fontSize:'0.875rem', marginBottom:'0.5rem' }}>
            <span style={{ cursor:'pointer', color:'var(--primary)' }} onClick={() => navigate('/')}>Home</span>
            <span>/</span>
            <span>{categoryInfo?.name || slug}</span>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, color:'var(--gray-900)' }}>
            {categoryInfo?.name || slug}
          </h1>
          {categoryInfo?.description && (
            <p style={{ color:'var(--gray-600)', marginTop:'0.4rem', maxWidth:600 }}>{categoryInfo.description}</p>
          )}
          {pagination?.total > 0 && (
            <p style={{ color:'var(--gray-500)', fontSize:'0.875rem', marginTop:'0.5rem' }}>
              {pagination.total} products
            </p>
          )}
        </div>
      </div>

      <div className="container" style={{ padding:'2rem 1rem' }}>
        {products.length > 0 ? (
          <>
            <div className="products-grid">
              {products.map(p => (
                <ProductCard key={p._id} product={p} showCompare showWishlist />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={Package}
            title="No products in this category"
            description="Products are being added. Check back soon!"
            actionLabel="Browse All"
            onAction={() => navigate('/')}
          />
        )}

        {/* AI Insight */}
        {insight?.insight && (
          <div style={{ marginTop:'3rem', background:'linear-gradient(135deg, var(--primary-50), #f5f3ff)', border:'1px solid var(--primary-100)', borderRadius:'var(--radius-xl)', padding:'1.75rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
              <div style={{ width:32, height:32, background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={16} color="white" />
              </div>
              <span style={{ fontWeight:700, color:'var(--primary)' }}>AI Market Insight</span>
            </div>
            <p style={{ color:'var(--gray-700)', lineHeight:1.7, fontSize:'0.9rem' }}>{insight.insight}</p>
            {insight.trends?.length > 0 && (
              <div style={{ marginTop:'0.75rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                {insight.trends.map((t, i) => (
                  <span key={i} className="badge badge-primary">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ComparisonTray />
    </div>
  )
}

export default CategoryPage
