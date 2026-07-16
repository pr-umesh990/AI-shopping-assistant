import { useState } from 'react'
import { Sparkles, X, Download } from 'lucide-react'
import usePWAInstall from '../../hooks/usePWAInstall.js'

const PWAInstallBanner = () => {
  const { canInstall, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwa-banner-dismissed') === 'true'
  )

  if (!canInstall || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa-banner-dismissed', 'true')
  }

  const handleInstall = async () => {
    const accepted = await install()
    if (accepted) handleDismiss()
  }

  return (
    <div style={{ 
      position: 'fixed', bottom: '1rem', left: '50%',
      transform: 'translateX(-50%)', zIndex: 1000,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white', borderRadius: 'var(--radius-xl)',
      padding: '0.75rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '0.85rem',
      boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
      maxWidth: 380, width: 'calc(100vw - 2rem)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }`}</style>
      <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Add to Home Screen</div>
        <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '0.1rem' }}>
          Install SmartShop AI for faster access
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{ background: 'white', color: '#6366f1', border: 'none', borderRadius: 'var(--radius)', padding: '0.4rem 0.75rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
      >
        <Download size={13} /> Install
      </button>
      <button
        onClick={handleDismiss}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default PWAInstallBanner
