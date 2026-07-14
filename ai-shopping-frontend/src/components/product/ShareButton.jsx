import { useState, useRef, useEffect } from 'react'
import { Share2, Copy, Check, Twitter, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ShareButton = ({ product }) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  const url = window.location.href
  const text = `Check out ${product?.name} — ${product?.brand} at $${product?.currentPrice}`

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link.')
    }
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener')
    setOpen(false)
  }

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener')
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius)' }}
        onClick={() => setOpen(v => !v)}
        title="Share product"
      >
        <Share2 size={15} />
        Share
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.4rem)', right: 0,
          background: 'white', border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 180, zIndex: 50, overflow: 'hidden',
        }}>
          <button
            onClick={handleCopy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--gray-50)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            {copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleWhatsApp}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--gray-50)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <MessageCircle size={15} style={{ color: '#25D366' }} />
            WhatsApp
          </button>
          <button
            onClick={handleTwitter}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--gray-50)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <Twitter size={15} style={{ color: '#1DA1F2' }} />
            X
          </button>
        </div>
      )}
    </div>
  )
}

export default ShareButton