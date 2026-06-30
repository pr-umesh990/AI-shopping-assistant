import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Heart, LayoutDashboard, ChevronDown, Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useWishlist } from '../../hooks/useWishlist.js'
import { getCategories, getWishlist } from '../../api/axios.js'
import SearchBar from '../search/SearchBar.jsx'

const Navbar = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { count: wishlistCount, setWishlistItems } = useWishlist()
  const [catOpen, setCatOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const catRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    getCategories().then(r => setCategories(r.data?.data?.categories || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      getWishlist({ limit: 100 })
        .then(res => {
          const list = res.data?.data?.items || res.data?.data?.wishlist || []
          setWishlistItems(list)
        })
        .catch(() => {})
    } else {
      setWishlistItems([])
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (q) => {
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <a className="navbar-logo" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>
          <Sparkles size={22} />
          SmartShop AI
        </a>

        {/* Search */}
        <div className="navbar-search">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Desktop Nav */}
        <div className="navbar-links">
          <a className="navbar-link" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>Home</a>

          {/* Categories Dropdown */}
          <div style={{ position: 'relative' }} ref={catRef}>
            <button className="navbar-link" onClick={() => setCatOpen(v => !v)}>
              Categories <ChevronDown size={14} />
            </button>
            {catOpen && (
              <div className="dropdown-menu" style={{ minWidth: 200 }}>
                {categories.slice(0, 10).map(cat => (
                  <button
                    key={cat._id}
                    className="dropdown-item"
                    onClick={() => { navigate(`/category/${cat.slug}`); setCatOpen(false) }}
                  >
                    {cat.icon || '📦'} {cat.name}
                  </button>
                ))}
                {categories.length === 0 && (
                  <div style={{ padding: '0.75rem 1rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                    Loading…
                  </div>
                )}
              </div>
            )}
          </div>

          {user?.role === 'admin' && (
            <a className="navbar-link" href="/admin/dashboard" onClick={e => { e.preventDefault(); navigate('/admin/dashboard') }}>
              <LayoutDashboard size={15} /> Admin
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Wishlist */}
          <button className="wishlist-btn" onClick={() => navigate('/wishlist')} title="Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount > 9 ? '9+' : wishlistCount}</span>}
          </button>

          {isAuthenticated ? (
            <div className="user-menu" ref={userRef}>
              <div className="user-avatar" onClick={() => setUserOpen(v => !v)} title={user?.name}>
                {initials}
              </div>
              {userOpen && (
                <div className="dropdown-menu">
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{user?.email}</div>
                  </div>
                  <button className="dropdown-item" onClick={() => { navigate('/wishlist'); setUserOpen(false) }}>
                    <Heart size={15} /> My Wishlist
                  </button>
                  {user?.role === 'admin' && (
                    <button className="dropdown-item" onClick={() => { navigate('/admin/dashboard'); setUserOpen(false) }}>
                      <LayoutDashboard size={15} /> Admin Panel
                    </button>
                  )}
                  <button className="dropdown-item danger" onClick={() => { logout(); navigate('/'); setUserOpen(false) }}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Login</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Register</button>
            </>
          )}

          {/* Hamburger */}
          <button className="hamburger btn btn-ghost" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{ borderTop: '1px solid var(--gray-200)', padding: '1rem', background: 'white' }}>
          <SearchBar onSearch={(q) => { handleSearch(q); setMobileOpen(false) }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
            <button className="navbar-link" style={{ justifyContent: 'flex-start' }} onClick={() => { navigate('/'); setMobileOpen(false) }}>Home</button>
            {categories.slice(0, 6).map(cat => (
              <button key={cat._id} className="navbar-link" style={{ justifyContent: 'flex-start' }} onClick={() => { navigate(`/category/${cat.slug}`); setMobileOpen(false) }}>
                {cat.icon || '📦'} {cat.name}
              </button>
            ))}
            {!isAuthenticated && (
              <>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { navigate('/login'); setMobileOpen(false) }}>Login</button>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { navigate('/register'); setMobileOpen(false) }}>Register</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
