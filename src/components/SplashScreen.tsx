import { useEffect, useState } from 'react'
import r6cashLogo from '@/assets/r6cash-logo-new.jpg'
import { useIsMobile } from '@/hooks/use-mobile'

interface SplashScreenProps {
  onComplete: () => void
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!isMobile) {
      onComplete()
      return
    }

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onComplete()
      }, 500) // Wait for fade out animation
    }, 2000)

    return () => clearTimeout(timer)
  }, [isMobile, onComplete])

  if (!isMobile || !isVisible) return null

  return (
    <div className={`fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <img 
            src={r6cashLogo} 
            alt="R6Cash" 
            className="h-32 w-auto animate-pulse-neon filter drop-shadow-neon"
          />
          <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl animate-pulse"></div>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-1 bg-primary/30 rounded-full overflow-hidden">
            <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
          </div>
          <p className="text-primary text-lg font-semibold animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    </div>
  )
}