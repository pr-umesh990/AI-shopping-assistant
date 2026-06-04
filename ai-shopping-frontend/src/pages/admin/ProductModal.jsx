import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getCategories } from '../../api/axios.js'

const STATUS_OPTIONS = ['active', 'review', 'disabled']

const ProductModal = ({ product, onSave, onClose }) => {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId?._id || product?.categoryId || '',
    description: product?.description || '',
    currentPrice: product?.currentPrice || '',
    originalPrice: product?.originalPrice || '',
    stock: product?.stock ?? '',
    status: product?.status || 'active',
    images: product?.images?.join('\n') || '',
  })

  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data?.data?.categories || []))
      .catch(() => setCategories([]))
  }, [])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    const payload = {
      ...form,
      currentPrice: Number(form.currentPrice),
      originalPrice: Number(form.originalPrice) || undefined,
      stock: Number(form.stock),
      images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
    }
    onSave(payload)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{product ? 'Edit Product' : 'Add New Product'}</span>
          <button onClick={onClose} style={{ color:'var(--gray-400)', padding:'0.25rem' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input name="name" className="form-input" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Brand *</label>
                <input name="brand" className="form-input" value={form.brand} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input name="sku" className="form-input" value={form.sku} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="categoryId" className="form-input" value={form.categoryId} onChange={handleChange} required>
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Current Price ($) *</label>
                <input name="currentPrice" type="number" className="form-input" value={form.currentPrice} onChange={handleChange} required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Original Price ($)</label>
                <input name="originalPrice" type="number" className="form-input" value={form.originalPrice} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input name="stock" type="number" className="form-input" value={form.stock} onChange={handleChange} min="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-input" rows={3} value={form.description} onChange={handleChange} style={{ resize:'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Image URLs (one per line)</label>
              <textarea name="images" className="form-input" rows={3} value={form.images} onChange={handleChange} placeholder="https://example.com/image1.jpg" style={{ resize:'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal

