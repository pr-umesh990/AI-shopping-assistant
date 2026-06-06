import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import ProductCard from '../components/common/ProductCard.jsx'
import Pagination from '../components/common/Pagination.jsx'
import ComparisonTray from '../components/search/ComparisonTray.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import { getCategoryProducts, getCategoryInsight, getSubcategories } from '../api/axios.js'

const CategoryPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [insight, setInsight] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [activeSubcat, setActiveSubcat] = useState(null) // null = "All"
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Initial load: fetch products + insight in parallel
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

      // Fetch subcategories once we have the categoryId
      const catId = data?.category?._id
      if (catId) {
        getSubcategories(catId)
          .then(r => setSubcategories(r.data?.data?.subcategories || []))
          .catch(() => {})
      }
    }).catch(() => {
      toast.error('Could not load category.')
    }).finally(() => setLoading(false))
  }, [slug])

  // Re-fetch products when page or active subcategory changes
  useEffect(() => {
    if (loading) return // Don't double-fetch on initial mount
    setLoading(true)
    getCategoryProducts(slug, {
      page,
      limit: 12,
      subcategoryId: activeSubcat || undefined,
    }).then(res => {
      const data = res.data?.data
      setProducts(data?.products || [])
      setPagination(data?.pagination || null)
    }).catch(() => {
      toast.error('Could not load products.')
    }).finally(() => setLoading(false))
  }, [page, activeSubcat])

  const handleSubcatChange = (subcatId) => {
    setActiveSubcat(subcatId)
    setPage(1)
  }

  if (loading && !categoryInfo) return <LoadingSpinner fullPage />

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

          {/* Subcategory Filter Tabs */}
          {subcategories.length > 0 && (
            <div className="tab-bar" style={{ marginTop:'1.25rem', borderBottom:'none', gap:'0.5rem', flexWrap:'wrap' }}>
              <button
                className={`tab-btn${!activeSubcat ? ' active' : ''}`}
                onClick={() => handleSubcatChange(null)}
              >
                All
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub._id}
                  className={`tab-btn${activeSubcat === sub._id ? ' active' : ''}`}
                  onClick={() => handleSubcatChange(sub._id)}
                >
                  {sub.icon && `${sub.icon} `}{sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ padding:'2rem 1rem' }}>
        {loading ? (
          <LoadingSpinner />
        ) : products.length > 0 ? (
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
            title={activeSubcat ? 'No products in this subcategory' : 'No products in this category'}
            description={activeSubcat ? 'Try selecting "All" or another subcategory.' : 'Products are being added. Check back soon!'}
            actionLabel={activeSubcat ? 'View All' : 'Browse All'}
            onAction={() => activeSubcat ? handleSubcatChange(null) : navigate('/')}
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
