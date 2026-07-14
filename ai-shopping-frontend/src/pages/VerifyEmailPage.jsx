import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import { verifyEmail } from '../api/axios.js'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. Please request a new one.')
      return
    }
    verifyEmail(token)
      .then(res => {
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully!')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
      })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: '2rem' }}>
      <div className="card" style={{ padding: '2.5rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <h2 style={{ fontWeight: 700, color: 'var(--gray-900)', marginTop: '1rem' }}>Verifying your email...</h2>
            <p style={{ color: 'var(--gray-500)', marginTop: '0.5rem' }}>Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={52} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, color: 'var(--gray-900)' }}>Email Verified!</h2>
            <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>{message}</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Continue to Login
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={52} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, color: 'var(--gray-900)' }}>Verification Failed</h2>
            <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>{message}</p>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
