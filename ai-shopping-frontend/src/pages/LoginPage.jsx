import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { loginUser } from '../api/axios.js'
import { useAuth } from '../hooks/useAuth.js'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format.'
    if (!form.password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await loginUser({ email: form.email.toLowerCase(), password: form.password })
      const { token, user } = res.data.data
      login(user, token)
      toast.success(`Welcome back, ${user.name}! 👋`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to track prices and get AI recommendations.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'border-danger' : ''}`}
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
                className={`form-input ${errors.password ? 'border-danger' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
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
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
