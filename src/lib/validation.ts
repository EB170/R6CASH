// Validation et sanitisation sécurisée

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>'"&]/g, (match) => {
      const escape: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return escape[match] || match
    })
    .slice(0, 100) // Limite de longueur
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email) && email.length <= 254
}

export const validateDisplayName = (name: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name)
  
  if (!sanitized || sanitized.length < 2) {
    return { valid: false, error: 'Le nom doit contenir au moins 2 caractères' }
  }
  
  if (sanitized.length > 30) {
    return { valid: false, error: 'Le nom ne peut pas dépasser 30 caractères' }
  }
  
  // Vérifier caractères interdits après sanitisation
  if (/[<>'"&]/.test(sanitized)) {
    return { valid: false, error: 'Le nom contient des caractères interdits' }
  }
  
  return { valid: true }
}

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Le mot de passe ne peut pas dépasser 128 caractères' }
  }
  
  const criteria = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
  
  const metCriteria = Object.values(criteria).filter(Boolean).length
  
  if (metCriteria < 4) {
    return { 
      valid: false, 
      error: 'Le mot de passe doit contenir au moins une minuscule, majuscule, chiffre et caractère spécial' 
    }
  }
  
  // Blacklist des mots de passe communs
  const commonPasswords = [
    'password', 'password123', '123456', 'qwerty', 'azerty',
    'admin', 'root', 'user', 'test', 'guest'
  ]
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { valid: false, error: 'Ce mot de passe est trop commun' }
  }
  
  return { valid: true }
}

// Rate limiting client-side (complément au rate limiting serveur)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Nettoyer les tentatives anciennes
    const validAttempts = attempts.filter(time => now - time < windowMs)
    
    if (validAttempts.length >= maxAttempts) {
      return false
    }
    
    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }
  
  getRemainingTime(key: string, windowMs: number = 60000): number {
    const attempts = this.attempts.get(key) || []
    if (attempts.length === 0) return 0
    
    const oldestAttempt = Math.min(...attempts)
    const remaining = windowMs - (Date.now() - oldestAttempt)
    return Math.max(0, remaining)
  }
}