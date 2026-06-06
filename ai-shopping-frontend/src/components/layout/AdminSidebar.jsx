import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, BarChart2, Sparkles, LogOut, FolderTree, Tag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'

const AdminSidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : 'A'

  const links = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { to: '/admin/subcategories', icon: Tag, label: 'Subcategories' },
    { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  ]

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <Sparkles size={18} style={{ color: '#a5b4fc' }} />
        SmartShop AI
      </div>

      <nav style={{ flex: 1 }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>{initials}</div>
          <div>
            <div className="admin-user-name">{user?.name || 'Admin'}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: '0.75rem', color: 'rgba(255,255,255,0.6)', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => { logout(); navigate('/') }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
