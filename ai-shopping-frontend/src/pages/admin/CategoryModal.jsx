import { useState } from 'react'
import { X } from 'lucide-react'

const CategoryModal = ({ category, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    icon: category?.icon || '📦',
    description: category?.description || '',
  })

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{category ? 'Edit Category' : 'Add New Category'}</span>
          <button onClick={onClose} style={{ color: 'var(--gray-400)', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Smartwatches"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Emoji Icon</label>
              <input
                name="icon"
                className="form-input"
                value={form.icon}
                onChange={handleChange}
                placeholder="e.g. ⌚"
                maxLength={4}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                Used in the navigation and category grids.
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                name="description"
                className="form-input"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Short description of this category..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoryModal
