import { useState, useEffect } from 'react'

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({ width, height })
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    // Vérification initiale
    checkDevice()

    // Event listener pour les changements de taille d'écran
    window.addEventListener('resize', checkDevice)
    
    // Event listener pour les changements d'orientation
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 100) // Délai pour la rotation
    })

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    isLandscape: screenSize.width > screenSize.height,
    isPortrait: screenSize.width <= screenSize.height
  }
}

// Hook pour la gestion du viewport mobile
export const useMobileViewport = () => {
  useEffect(() => {
    // Configuration du viewport pour mobile
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    }

    // Prévention du zoom sur les inputs (iOS Safari)
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchstart', preventZoom, { passive: false })

    return () => {
      document.removeEventListener('touchstart', preventZoom)
    }
  }, [])
}