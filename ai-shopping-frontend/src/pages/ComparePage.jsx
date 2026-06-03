import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, GitCompare } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import CompareTable from '../components/compare/CompareTable.jsx'
import AIVerdict from '../components/compare/AIVerdict.jsx'
import { compareProducts, getCompareVerdict } from '../api/axios.js'
import { useCompare } from '../hooks/useCompare.js'

const ComparePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items: storeItems, clear } = useCompare()
  const [products, setProducts] = useState([])
  const [verdict, setVerdict] = useState(null)
  const [loading, setLoading] = useState(false)
  const [specRows, setSpecRows] = useState([])

  // Get IDs from URL or Redux store
  const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const storeIds = storeItems.map(p => p._id)
  const ids = urlIds.length > 0 ? urlIds : storeIds

  useEffect(() => {
    if (ids.length < 2) return
    setLoading(true)
    Promise.all([
      compareProducts(ids),
      getCompareVerdict(ids).catch(() => null),
    ]).then(([cRes, vRes]) => {
      const data = cRes.data?.data
      setProducts(data?.products || [])
      setSpecRows(data?.specRows || [])
      setVerdict(vRes?.data?.data?.verdict || null)
    }).catch(() => {
      toast.error('Could not load comparison.')
    }).finally(() => setLoading(false))
  }, [ids.join(',')])

  if (ids.length < 2) {
    return (
      <div className="container" style={{ padding:'3rem 1rem' }}>
        <EmptyState
          icon={GitCompare}
          title="Add products to compare"
          description="Browse products and click the compare icon to add them here. You can compare 2 to 4 products side-by-side."
          actionLabel="Browse Products"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  return (
    <div className="container" style={{ padding:'2rem 1rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:'1.75rem', color:'var(--gray-900)' }}>Product Comparison</h1>
          <p style={{ color:'var(--gray-500)' }}>Comparing {ids.length} products side-by-side</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn btn-ghost" style={{ border:'1px solid var(--gray-300)' }} onClick={() => navigate('/')}>
            <Plus size={15} /> Add Product
          </button>
          <button className="btn btn-ghost" style={{ border:'1px solid var(--danger-light)', color:'var(--danger)' }} onClick={() => { clear(); navigate('/') }}>
            <Trash2 size={15} /> Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          {verdict && <AIVerdict verdict={verdict} />}
          {products.length > 0 && <CompareTable products={products} specRows={specRows} />}
        </>
      )}
    </div>
  )
}

export default ComparePage
