import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { Wallet, CreditCard, Shield, Zap, Loader2 } from 'lucide-react'
import { useSafeUser } from '@/hooks/useSafeUser'

interface DepositModalProps {
  onDeposit: () => void
  userBalance: number
}

export const DepositModal = ({ onDeposit, userBalance }: DepositModalProps) => {
  const [open, setOpen] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const user = useSafeUser() // ✅ user.id garanti

  // Montants prédéfinis
  const quickAmounts = [
    { value: 5, label: '$5', popular: false },
    { value: 10, label: '$10', popular: false },
    { value: 25, label: '$25', popular: true },
    { value: 50, label: '$50', popular: true },
    { value: 100, label: '$100', popular: false },
  ]

  const handleQuickSelect = (value: number) => {
    setSelectedAmount(value)
  }

  const handleDeposit = async () => {
    if (!selectedAmount) {
      toast({
        title: 'Montant requis',
        description: 'Veuillez sélectionner un montant de dépôt.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Récup session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Session utilisateur expirée. Veuillez vous reconnecter.')
      }

      console.log('💳 Dépôt →', { userId: user.id, amount: selectedAmount })

      // Appel backend (Stripe checkout)
      const response = await fetch(
        `https://ykseqqeabceslsgzzuta.supabase.co/functions/v1/deposit-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify({ amount: selectedAmount, userId: user.id }), // ✅ ID explicite
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Erreur API')
      }

      const data = await response.json()
      console.log('Deposit response:', data)

      if (data?.url) {
        const stripeWindow = window.open(data.url, '_blank', 'noopener,noreferrer')
        if (!stripeWindow) {
          toast({
            title: 'Popup bloqué',
            description: 'Veuillez autoriser les popups pour ce site et réessayer.',
            variant: 'destructive',
          })
          return
        }

        toast({
          title: 'Redirection vers Stripe',
          description: 'Fenêtre de paiement sécurisé ouverte.',
        })

        setOpen(false)
        setSelectedAmount(null)
        onDeposit()
      } else {
        throw new Error('URL de paiement non reçue du serveur')
      }

    } catch (error: any) {
      console.error('Deposit error:', error)

      let errorMessage = 'Impossible de traiter le dépôt. Veuillez réessayer.'
      if (error.message?.includes('session')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.'
      }

      toast({
        title: 'Erreur de dépôt',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-primary hover:glow-primary">
          <Wallet className="h-4 w-4 mr-2" />
          DÉPOSER DES FONDS
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] overflow-y-auto gradient-card border-border/50 mx-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-neon flex items-center gap-2">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
            Déposer des Fonds
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Ajoutez de l'argent à votre solde R6Cash pour participer aux matchs compétitifs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Solde */}
          <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Solde actuel:</span>
              <Badge variant="secondary" className="text-sm sm:text-lg font-bold px-2 sm:px-3 py-1">
                ${userBalance.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Choix rapide */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold">Choisissez un montant:</h3>
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
              {quickAmounts.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedAmount === preset.value ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleQuickSelect(preset.value)}
                  className={`relative font-bold text-sm ${
                    selectedAmount === preset.value 
                      ? 'shadow-primary' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  {preset.popular && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 text-xs bg-accent text-accent-foreground p-0.5"
                    >
                      <Zap className="h-2 w-2" />
                    </Badge>
                  )}
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sécurité */}
          <Alert className="border-green-500/50 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300 text-xs sm:text-sm">
              <strong>Paiement 100% sécurisé</strong> - Traité par Stripe avec chiffrement SSL/TLS
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
            className="font-bold order-2 sm:order-1"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeposit} 
            disabled={!selectedAmount || loading}
            className="font-bold shadow-primary hover:glow-primary order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Déposer ${selectedAmount || 0}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}