import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import Pagination from '../common/Pagination.jsx'

const PLACEHOLDER = 'https://placehold.co/44x44/eef2ff/6366f1?text=?'

const ProductTable = ({ products = [], onEdit, onDelete, pagination, onPageChange }) => {
  const statusClass = (s) => {
    if (s === 'active') return 'status-badge status-active'
    if (s === 'review') return 'status-badge status-review'
    return 'status-badge status-disabled'
  }

  return (
    <div>
      <div style={{ overflowX:'auto' }}>
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <img
                      src={p.images?.[0] || PLACEHOLDER}
                      alt={p.name}
                      className="product-thumb"
                      onError={e => { e.target.src = PLACEHOLDER }}
                    />
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--gray-800)' }}>{p.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--gray-500)' }}>SKU: {p.sku}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {p.categoryId?.name && (
                    <span className="badge badge-gray">{p.categoryId.name}</span>
                  )}
                </td>
                <td style={{ fontWeight:700, color:'var(--gray-900)' }}>${p.currentPrice?.toLocaleString()}</td>
                <td>
                  <span style={{ fontWeight:600, color: p.stock === 0 ? 'var(--danger)' : 'var(--gray-800)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                    {p.stock === 0 && <AlertTriangle size={13} />}
                    {p.stock}
                  </span>
                </td>
                <td><span className={statusClass(p.status)}>{p.status}</span></td>
                <td>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.4rem' }}>
                    <button className="icon-btn" onClick={() => onEdit?.(p)} title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button className="icon-btn" style={{ color:'var(--danger)', borderColor:'var(--danger-light)' }} onClick={() => onDelete?.(p._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign:'center', color:'var(--gray-500)', padding:'2rem' }}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  )
}

export default ProductTable
