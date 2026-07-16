import { useState, useEffect } from 'react'

/**
 * Hook to detect and trigger PWA install prompt.
 * Returns { canInstall, install, isInstalled }
 */
const usePWAInstall = () => {
  const [prompt, setPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return false
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setPrompt(null)
      return true
    }
    return false
  }

  return {
    canInstall: !!prompt && !isInstalled,
    install,
    isInstalled,
  }
}

export default usePWAInstall
