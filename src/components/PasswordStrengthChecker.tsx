import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle } from "lucide-react"

interface PasswordStrengthProps {
  password: string
  onStrengthChange?: (strength: number) => void
}

interface PasswordCriteria {
  length: boolean
  lowercase: boolean
  uppercase: boolean
  number: boolean
  special: boolean
}

export const PasswordStrengthChecker = ({ password, onStrengthChange }: PasswordStrengthProps) => {
  const [criteria, setCriteria] = useState<PasswordCriteria>({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  })
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const newCriteria = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }

    setCriteria(newCriteria)

    // Calculate strength (0-100)
    const metCriteria = Object.values(newCriteria).filter(Boolean).length
    const newStrength = (metCriteria / 5) * 100
    setStrength(newStrength)
    
    onStrengthChange?.(newStrength)
  }, [password, onStrengthChange])

  const getStrengthLabel = () => {
    if (strength === 0) return 'Aucun'
    if (strength <= 40) return 'Faible'
    if (strength <= 60) return 'Moyen'
    if (strength <= 80) return 'Fort'
    return 'Très Fort'
  }

  const getStrengthColor = () => {
    if (strength <= 40) return 'destructive'
    if (strength <= 60) return 'secondary'
    if (strength <= 80) return 'default'
    return 'default'
  }

  const getProgressColor = () => {
    if (strength <= 40) return 'bg-destructive'
    if (strength <= 60) return 'bg-yellow-500'
    if (strength <= 80) return 'bg-blue-500'
    return 'bg-success'
  }

  if (!password) return null

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Force du mot de passe</span>
        <Badge variant={getStrengthColor() as any} className="text-xs">
          {getStrengthLabel()}
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress 
          value={strength} 
          className="h-2"
        />
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className={`flex items-center gap-2 ${criteria.length ? 'text-success' : 'text-muted-foreground'}`}>
            {criteria.length ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>Au moins 8 caractères</span>
          </div>
          <div className={`flex items-center gap-2 ${criteria.lowercase ? 'text-success' : 'text-muted-foreground'}`}>
            {criteria.lowercase ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>Une lettre minuscule</span>
          </div>
          <div className={`flex items-center gap-2 ${criteria.uppercase ? 'text-success' : 'text-muted-foreground'}`}>
            {criteria.uppercase ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>Une lettre majuscule</span>
          </div>
          <div className={`flex items-center gap-2 ${criteria.number ? 'text-success' : 'text-muted-foreground'}`}>
            {criteria.number ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>Un chiffre</span>
          </div>
          <div className={`flex items-center gap-2 ${criteria.special ? 'text-success' : 'text-muted-foreground'}`}>
            {criteria.special ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>Un caractère spécial</span>
          </div>
        </div>
      </div>
    </div>
  )
}