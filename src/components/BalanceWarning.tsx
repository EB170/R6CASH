import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Wallet } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface BalanceWarningProps {
  balance: number
  className?: string
}

export const BalanceWarning = ({ balance, className = '' }: BalanceWarningProps) => {
  const { language } = useLanguage()

  if (balance > 0) return null

  const warningText = {
    en: {
      title: 'Real Money Required',
      description: 'You need to deposit real money to participate in matches. R6Cash uses actual currency for authentic competitive gaming.'
    },
    fr: {
      title: 'Argent Réel Requis',
      description: 'Vous devez déposer de l\'argent réel pour participer aux matchs. R6Cash utilise de la vraie monnaie pour un gaming compétitif authentique.'
    }
  }

  const content = warningText[language]

  return (
    <Alert className={`border-orange-500/50 bg-orange-500/10 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertTitle className="text-orange-500 font-bold flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        {content.title}
      </AlertTitle>
      <AlertDescription className="text-orange-400">
        {content.description}
      </AlertDescription>
    </Alert>
  )
}