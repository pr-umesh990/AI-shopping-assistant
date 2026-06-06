import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import EmptyState from '../../components/common/EmptyState.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { getAdminCategories, getAdminSubcategories, createAdminSubcategory,updateAdminSubcategory,deleteAdminSubcategory, } from '../../api/axios.js'

const SubcategoryModal = ({ subcategory, categoryId, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: subcategory?.name || '',
    icon: subcategory?.icon || '',
    description: subcategory?.description || '',
    isActive: subcategory?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, categoryId }
      if (subcategory) {
        await updateAdminSubcategory(subcategory._id, payload)
        toast.success('Subcategory updated.')
      } else {
        await createAdminSubcategory(payload)
        toast.success('Subcategory created.')
      }
      onSave()
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">
            {subcategory ? 'Edit Subcategory' : 'Add Subcategory'}
          </span>
          <button onClick={onClose} style={{ color: 'var(--gray-400)', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Gaming Laptops"
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Icon (emoji, optional)</label>
              <input
                name="icon"
                className="form-input"
                value={form.icon}
                onChange={handleChange}
                placeholder="e.g. 🎮"
                maxLength={4}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                name="description"
                className="form-input"
                rows={3}
                value={form.description}
                onChange={handleChange}
                style={{ resize: 'vertical' }}
              />
            </div>
            {subcategory && (
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  <div className="toggle-track">
                    <div className="toggle-thumb" />
                  </div>
                </label>
                <span className="form-label" style={{ margin: 0 }}>Active</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : subcategory ? 'Save Changes' : 'Create Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main Page 
const AdminSubcategories = () => {
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, subcategory: null })

  // Fetch all categories on mount
  useEffect(() => {
    getAdminCategories()
      .then(res => setCategories(res.data?.data?.categories || []))
      .catch(() => toast.error('Could not load categories.'))
  }, [])

  // Fetch subcategories whenever selected category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([])
      return
    }
    setLoading(true)
    getAdminSubcategories(selectedCategoryId)
      .then(res => setSubcategories(res.data?.data?.subcategories || []))
      .catch(() => toast.error('Could not load subcategories.'))
      .finally(() => setLoading(false))
  }, [selectedCategoryId])

  const refetchSubcategories = () => {
    if (!selectedCategoryId) return
    setLoading(true)
    getAdminSubcategories(selectedCategoryId)
      .then(res => setSubcategories(res.data?.data?.subcategories || []))
      .catch(() => toast.error('Could not load subcategories.'))
      .finally(() => setLoading(false))
  }

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete "${sub.name}"? This cannot be undone.`)) return
    try {
      await deleteAdminSubcategory(sub._id)
      toast.success('Subcategory deactivated.')
      refetchSubcategories()
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not delete subcategory.'
      toast.error(msg)
    }
  }

  const handleModalSave = () => {
    setModal({ open: false, subcategory: null })
    refetchSubcategories()
  }

  const selectedCategoryName = categories.find(c => c._id === selectedCategoryId)?.name || ''

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--gray-900)' }}>
            Subcategory Management
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Organise products within categories
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedCategoryId}
          onClick={() => setModal({ open: true, subcategory: null })}
        >
          <Plus size={15} /> Add Subcategory
        </button>
      </div>

      {/* Category Filter */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <label className="form-label">Select Category</label>
        <select
          className="form-input"
          style={{ maxWidth: 340 }}
          value={selectedCategoryId}
          onChange={e => setSelectedCategoryId(e.target.value)}
        >
          <option value="">Choose a category…</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
          ))}
        </select>
      </div>

      {/* Content Area */}
      {!selectedCategoryId ? (
        <EmptyState
          icon={Tag}
          title="Select a category"
          description="Choose a category above to manage its subcategories."
        />
      ) : loading ? (
        <LoadingSpinner />
      ) : subcategories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={`No subcategories in "${selectedCategoryName}"`}
          description="Click 'Add Subcategory' to create the first one."
          actionLabel="Add Subcategory"
          onAction={() => setModal({ open: true, subcategory: null })}
        />
      ) : (
        <div className="chart-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="product-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subcategories.map(sub => (
                  <tr key={sub._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {sub.icon && (
                          <span style={{ fontSize: '1.1rem' }}>{sub.icon}</span>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>
                            {sub.name}
                          </div>
                          {sub.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>
                              {sub.description.length > 60 ? `${sub.description.slice(0, 60)}…` : sub.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', background: 'var(--gray-100)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                        {sub.slug}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-gray">{sub.productCount || 0}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${sub.isActive ? 'status-active' : 'status-disabled'}`}>
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="icon-btn"
                          onClick={() => setModal({ open: true, subcategory: sub })}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                          onClick={() => handleDelete(sub)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <SubcategoryModal
          subcategory={modal.subcategory}
          categoryId={selectedCategoryId}
          onSave={handleModalSave}
          onClose={() => setModal({ open: false, subcategory: null })}
        />
      )}
    </div>
  )
}

export default AdminSubcategories
