// Performance monitoring utilities

export const performanceMonitor = {
  // Mark performance timing points
  mark: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
  },

  // Measure between two timing points
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0]
        return measure.duration
      } catch (error) {
        console.warn('Performance measurement failed:', error)
        return 0
      }
    }
    return 0
  },

  // Get all performance entries
  getEntries: () => {
    if (typeof performance !== 'undefined' && performance.getEntries) {
      return performance.getEntries()
    }
    return []
  },

  // Clear performance entries
  clear: () => {
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Lazy loading utility
export function lazyLoad<T>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> {
  return importFunc()
    .then(module => module.default)
    .catch(error => {
      console.error('Lazy loading failed:', error)
      if (fallback) return fallback
      throw error
    })
}

// Resource preloader
export function preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image'): Promise<void> {
  return new Promise((resolve, reject) => {
    let element: HTMLImageElement | HTMLScriptElement | HTMLLinkElement

    switch (type) {
      case 'image':
        element = new Image()
        element.onload = () => resolve()
        element.onerror = reject
        ;(element as HTMLImageElement).src = url
        break
      
      case 'script':
        element = document.createElement('script')
        element.onload = () => resolve()
        element.onerror = reject
        ;(element as HTMLScriptElement).src = url
        document.head.appendChild(element)
        break
      
      case 'style':
        element = document.createElement('link')
        element.onload = () => resolve()
        element.onerror = reject
        ;(element as HTMLLinkElement).rel = 'stylesheet'
        ;(element as HTMLLinkElement).href = url
        document.head.appendChild(element)
        break
    }
  })
}