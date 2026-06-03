import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Send } from 'lucide-react'
import { subscribeNewsletter } from '../../api/axios.js'
import toast from 'react-hot-toast'

const Footer = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!email.trim()) return
    setLoading(true)
    try {
      await subscribeNewsletter(email)
      toast.success('Subscribed!')
      setEmail('')
    } catch {
      toast.error('Could not subscribe. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <Sparkles size={20} style={{ color: '#a5b4fc' }} />
              AI Shopping Assistant
            </div>
            <p className="footer-desc">
              Your AI-powered personal shopping assistant. Find the best products at the best prices with intelligent recommendations and real-time price tracking.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {['1', '2', '3', '4'].map((icon, i) => (
                <span key={i} style={{ fontSize: '1.25rem', cursor: 'pointer', opacity: 0.75, transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = '1'} onMouseOut={e => e.target.style.opacity = '0.75'}>{icon}</span>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="footer-col">
            <h4>Products</h4>
            {['Trending Now', 'New Arrivals', 'Best Sellers', 'Price Drops', 'Compare Tools'].map(l => (
              <a key={l} className="footer-link" href="#" onClick={e => e.preventDefault()}>{l}</a>
            ))}
          </div>

          {/* Resources */}
          <div className="footer-col">
            <h4>Resources</h4>
            {['Buying Guides', 'Price Tracker', 'AI Reviews', 'Tech News', 'About Us'].map(l => (
              <a key={l} className="footer-link" href="#" onClick={e => e.preventDefault()}>{l}</a>
            ))}
          </div>

          {/* Newsletter */}
          <div className="footer-col">
            <h4>Stay Updated</h4>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', opacity: 0.75 }}>
              Get weekly deals and AI-curated picks in your inbox.
            </p>
            <div className="footer-newsletter">
              <input
                className="footer-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubscribe}
                disabled={loading}
                style={{ padding: '0.5rem 0.8rem' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AI Shopping Assistant. All rights reserved. Built with ❤️ and AI.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
