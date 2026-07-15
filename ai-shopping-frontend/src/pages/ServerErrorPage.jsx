import { useNavigate } from 'react-router-dom'
import { RefreshCw, Home } from 'lucide-react'

const ServerErrorPage = ({ error, onRetry }) => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{
          fontSize: '5rem', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #ef4444, #f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: '1rem', userSelect: 'none',
        }}>
          500
        </div>

        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
          Something Went Wrong
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          We encountered an unexpected error. This has been logged and our team will look into it.
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
            marginBottom: '1.5rem', textAlign: 'left',
          }}>
            <p style={{ fontSize: '0.78rem', color: '#dc2626', fontFamily: 'monospace', margin: 0, wordBreak: 'break-word' }}>
              {error}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={onRetry}
            >
              <RefreshCw size={15} /> Try Again
            </button>
          )}
          <button
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--gray-300)' }}
            onClick={() => navigate('/')}
          >
            <Home size={15} /> Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerErrorPage
