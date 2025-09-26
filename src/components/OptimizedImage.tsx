import { useState, ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  fallback?: string
  placeholder?: string
  onLoadComplete?: () => void
  onError?: () => void
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
  placeholder,
  onLoadComplete,
  onError,
  ...props
}: OptimizedImageProps) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder || src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoadComplete?.()
  }

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback)
      setHasError(true)
      onError?.()
    }
    setIsLoading(false)
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-50',
          hasError && 'opacity-75 grayscale'
        )}
        loading="lazy"
        decoding="async"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}