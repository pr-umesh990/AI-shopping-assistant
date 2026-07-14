import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Shield, Heart, Bell, CheckCircle, AlertCircle, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { useAuth } from '../hooks/useAuth.js'
import { updateMe, changePassword, resendVerification, getWishlist } from '../api/axios.js'
import { updateUser } from '../store/authSlice.js'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'

const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'activity', label: 'Activity', icon: Heart },
]

const ProfilePage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({ wishlistCount: 0, savedAmount: 0 })
  const [resendLoading, setResendLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    newsletterSubscribed: user?.newsletterSubscribed || false,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  })

  const passwordChecks = [
    { label: 'At least 8 characters', ok: passwordForm.newPassword.length >= 8 },
    { label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(passwordForm.newPassword) },
    { label: 'At least 1 number', ok: /[0-9]/.test(passwordForm.newPassword) },
    { label: 'Passwords match', ok: passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword !== '' },
  ]

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    setStatsLoading(true)
    getWishlist()
      .then(res => {
        const data = res.data?.data
        setStats({
          wishlistCount: data?.stats?.totalTracked || 0,
          savedAmount: data?.stats?.potentialSavings || 0,
        })
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [isAuthenticated])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await updateMe({
        name: profileForm.name.trim(),
        newsletterSubscribed: profileForm.newsletterSubscribed,
      })
      const updatedUser = res.data?.data?.user
      if (updatedUser) {
        dispatch(updateUser(updatedUser))
        toast.success('Profile updated successfully!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!passwordChecks.every(c => c.ok)) {
      toast.error('Please meet all password requirements.')
      return
    }
    setLoading(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await resendVerification(user.email)
      toast.success('Verification email sent! Check your inbox.')
    } catch {
      toast.error('Failed to resend verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  if (!isAuthenticated) return null

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--gray-900)' }}>My Account</h1>
        <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem' }}>
          Manage your profile, security settings, and account activity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Avatar Card */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: '0 auto 1rem',
            }}>
              {initials}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)' }}>{user?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{user?.email}</div>
            <div style={{ marginTop: '0.75rem' }}>
              {user?.emailVerified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <CheckCircle size={12} /> Verified
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <AlertCircle size={12} /> Unverified
                </span>
              )}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="badge badge-gray" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                <Shield size={10} style={{ marginRight: 3 }} />
                {user?.role}
              </span>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
              Account Stats
            </div>
            {statsLoading ? <LoadingSpinner size="sm" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Heart size={13} style={{ color: 'var(--primary)' }} /> Wishlist Items
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{stats.wishlistCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bell size={13} style={{ color: 'var(--primary)' }} /> Potential Savings
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>${stats.savedAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={13} style={{ color: 'var(--primary)' }} /> Newsletter
                  </span>
                  <span style={{ fontWeight: 700, color: user?.newsletterSubscribed ? 'var(--success)' : 'var(--gray-400)' }}>
                    {user?.newsletterSubscribed ? 'Subscribed' : 'Not subscribed'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="card" style={{ padding: '0.5rem' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 0.85rem', borderRadius: 'var(--radius)',
                  border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                  background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-600)',
                  transition: 'all 0.15s', marginBottom: '0.15rem',
                }}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Profile Information</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Update your name and communication preferences.
              </p>

              {/* Email verification banner */}
              {!user?.emailVerified && (
                <div style={{
                  background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 'var(--radius-lg)',
                  padding: '0.85rem 1rem', marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#92400e' }}>
                    <AlertCircle size={16} />
                    <span>Your email is not verified. Some features may be limited.</span>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#f59e0b', color: 'white', borderRadius: 'var(--radius)', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Email'}
                  </button>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    Email address cannot be changed.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>Newsletter Subscription</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.15rem' }}>
                      Receive AI-curated deals and product picks.
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={profileForm.newsletterSubscribed}
                      onChange={e => setProfileForm(f => ({ ...f, newsletterSubscribed: e.target.checked }))}
                    />
                    <div className="toggle-track"><div className="toggle-thumb" /></div>
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={loading}
                >
                  <Save size={15} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Security Settings</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Change your password to keep your account secure.
              </p>
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { key: 'current', label: 'Current Password', placeholder: 'Enter current password', field: 'currentPassword' },
                  { key: 'new', label: 'New Password', placeholder: 'Enter new password', field: 'newPassword' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: 'Confirm new password', field: 'confirmPassword' },
                ].map(({ key, label, placeholder, field }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswords[key] ? 'text' : 'password'}
                        className="form-input"
                        value={passwordForm[field]}
                        onChange={e => setPasswordForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ paddingRight: '2.75rem' }}
                      />
                      <button type="button" onClick={() => setShowPasswords(p => ({ ...p, [key]: !p[key] }))}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                        {showPasswords[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {field === 'newPassword' && passwordForm.newPassword && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                        {passwordChecks.map(c => (
                          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: c.ok ? 'var(--success)' : 'var(--gray-400)' }}>
                            <CheckCircle size={12} fill={c.ok ? 'currentColor' : 'none'} /> {c.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={loading}
                >
                  <Lock size={15} />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Account Activity</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Your saved products and price tracking overview.
              </p>
              {statsLoading ? <LoadingSpinner /> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Wishlist Items', value: stats.wishlistCount, icon: Heart, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Potential Savings', value: `$${stats.savedAmount.toFixed(2)}`, icon: Bell, color: '#059669', bg: '#d1fae5' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, background: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-900)' }}>{value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/wishlist')}>
                  <Heart size={14} /> View Wishlist
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ProfilePage
