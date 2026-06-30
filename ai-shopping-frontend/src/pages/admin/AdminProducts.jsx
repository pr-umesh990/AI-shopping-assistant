import { useState, useEffect, useRef } from 'react'
import { Search, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import ProductTable from '../../components/admin/ProductTable.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct } from '../../api/axios.js'
import ProductModal from './ProductModal.jsx'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, product: null })
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [page, setPage] = useState(1)
  const searchTimerRef = useRef(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getAdminProducts({ page, limit: 15, ...filters })
      setProducts(res.data?.data?.products || [])
      setPagination(res.data?.data?.pagination || null)
    } catch { toast.error('Could not load products.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [page, filters.status, filters.search])

  const handleSearchChange = (val) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val }))
      setPage(1)
    }, 400)
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
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await deleteAdminProduct(id)
      toast.success('Product deleted.')
      fetch()
    } catch { toast.error('Could not delete.') }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <h1 style={{ fontWeight:800, fontSize:'1.5rem' }}>Product Management</h1>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, product: null })}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={15} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)' }} />
          <input
            className="form-input"
            placeholder="Search products…"
            style={{ paddingLeft:'2.25rem' }}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width:'auto' }}
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="review">In Review</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="chart-card">
          <ProductTable
            products={products}
            onEdit={p => setModal({ open: true, product: p })}
            onDelete={handleDelete}
            pagination={pagination}
            onPageChange={setPage}
          />
        </div>
      )}

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

export default AdminProducts
