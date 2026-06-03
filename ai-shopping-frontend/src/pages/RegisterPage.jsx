import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerUser } from '../api/axios.js'
import { useAuth } from '../hooks/useAuth.js'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const passwordChecks = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'At least 1 uppercase', ok: /[A-Z]/.test(form.password) },
    { label: 'At least 1 number', ok: /[0-9]/.test(form.password) },
  ]

  const validate = () => {
    const e = {}
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
    if (!form.email) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format.'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain at least one uppercase letter.'
    else if (!/[0-9]/.test(form.password)) e.password = 'Password must contain at least one number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await registerUser({ name: form.name.trim(), email: form.email.toLowerCase(), password: form.password })
      const { token, user } = res.data.data
      login(user, token)
      toast.success(`Welcome to SmartShop AI, ${user.name}! 🎉`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Sparkles size={22} style={{ color:'var(--accent)' }} />
          SmartShop AI
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start shopping smarter with AI-powered recommendations.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                style={{ paddingRight:'2.75rem' }}
              />
              <button
                type="button"
                style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--gray-400)', background:'none', border:'none', cursor:'pointer' }}
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}

            {form.password && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem', marginTop:'0.5rem' }}>
                {passwordChecks.map(c => (
                  <div key={c.label} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', color: c.ok ? 'var(--success)' : 'var(--gray-400)' }}>
                    <CheckCircle size={12} fill={c.ok ? 'currentColor' : 'none'} /> {c.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Free Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
