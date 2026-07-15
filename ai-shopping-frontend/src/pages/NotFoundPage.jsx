import { useNavigate } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Animated 404 */}
        <div style={{
          fontSize: '8rem', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: '1rem', userSelect: 'none',
        }}>
          404
        </div>

        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The page you're looking for doesn't exist, has been moved, or the URL may be incorrect.
        </p>

        {/* Suggestions */}
        <div style={{
          background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)',
          padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'left',
        }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
            You might want to:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: Home, label: 'Go back to homepage', action: () => navigate('/') },
              { icon: Search, label: 'Search for products', action: () => navigate('/search?q=') },
              { icon: ArrowLeft, label: 'Go back to previous page', action: () => navigate(-1) },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: 'white', border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)', padding: '0.65rem 0.9rem',
                  cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)',
                  fontWeight: 500, transition: 'all 0.15s', width: '100%', textAlign: 'left',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.color = 'var(--primary)'
                  e.currentTarget.style.background = 'var(--primary-50)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)'
                  e.currentTarget.style.color = 'var(--gray-700)'
                  e.currentTarget.style.background = 'white'
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
          onClick={() => navigate('/')}
        >
          <Home size={16} /> Return Home
        </button>
      </div>
    </div>
  )
}

export default NotFoundPage
