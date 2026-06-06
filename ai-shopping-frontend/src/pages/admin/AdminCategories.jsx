import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, FolderTree } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import CategoryModal from './CategoryModal.jsx'
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../../api/axios.js'

const AdminCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const fetchCategories = useCallback(() => {
    setLoading(true)
    getAdminCategories({ page: 1, limit: 100 })
      .then(res => setCategories(res.data?.data?.categories || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSave = async (data) => {
    try {
      if (selectedCategory) {
        await updateAdminCategory(selectedCategory._id, data)
        toast.success('Category updated')
      } else {
        await createAdminCategory(data)
        toast.success('Category created')
      }
      setModalOpen(false)
      fetchCategories()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    
    try {
      await deleteAdminCategory(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2>Category Management</h2>
          <p>Create and manage product categories</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { setSelectedCategory(null); setModalOpen(true) }}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, margin: 0 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search categories..."
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem' }}><LoadingSpinner /></div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState 
            icon={FolderTree} 
            title="No categories found" 
            description={search ? 'Try adjusting your search terms.' : 'Start by creating your first category.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(cat => (
                  <tr key={cat._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, background: 'var(--primary-50)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                          {cat.icon || '📦'}
                        </div>
                        <div style={{ fontWeight: 600 }}>{cat.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{cat.slug}</td>
                    <td>
                      <span className="badge badge-primary">{cat.productCount || 0}</span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                      {new Date(cat.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.25rem' }}
                          title="Edit"
                          onClick={() => { setSelectedCategory(cat); setModalOpen(true) }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.25rem', color: 'var(--danger)' }}
                          title="Delete"
                          onClick={() => handleDelete(cat._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          category={selectedCategory}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

export default AdminCategories
