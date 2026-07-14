import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Sparkles, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../api/axios.js'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const checks = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'At least 1 number', ok: /[0-9]/.test(form.password) },
    { label: 'Passwords match', ok: form.password === form.confirm && form.confirm !== '' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) { toast.error('Invalid reset link.'); return }
    if (!checks.every(c => c.ok)) { toast.error('Please meet all password requirements.'); return }
    setLoading(true)
    try {
      await resetPassword(token, form.password)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={22} style={{ color: 'var(--accent)' }} />
          SmartShop AI
        </div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter new password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: '2.75rem' }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                {checks.slice(0, 3).map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: c.ok ? 'var(--success)' : 'var(--gray-400)' }}>
                    <CheckCircle size={12} fill={c.ok ? 'currentColor' : 'none'} /> {c.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
            <Lock size={16} />
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
