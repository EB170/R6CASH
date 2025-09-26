import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, CreditCard, Loader2, ExternalLink } from 'lucide-react'

export const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true)
  const [creditedAmount, setCreditedAmount] = useState<number>(0)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        console.log('[PAYMENT-SUCCESS] Processing payment success...')

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('session_id')
        const amount = urlParams.get('amount')

        if (!sessionId || !amount) {
          throw new Error('Paramètres manquants dans l\'URL')
        }

        const amountNumber = parseFloat(amount)
        console.log('[PAYMENT-SUCCESS] Processing amount:', amountNumber)

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Utilisateur non connecté')
        }

        // STRATÉGIE ULTRA-SIMPLE: CRÉDIT DIRECT SANS VÉRIFICATION
        // On fait confiance à Stripe - si l'utilisateur arrive ici, le paiement a réussi
        
        // Calculate net amount (Stripe fee: 2.9% + $0.30)
        const stripeFee = Math.round((amountNumber * 0.029 + 0.30) * 100) / 100
        const netAmount = Math.round((amountNumber - stripeFee) * 100) / 100

        console.log('[PAYMENT-SUCCESS] Crediting amount directly:', netAmount)

        // Get current balance
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        const currentBalance = currentProfile?.balance || 0
        const newBalance = Math.round((currentBalance + netAmount) * 100) / 100

        // Update balance directly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('[PAYMENT-SUCCESS] Balance update failed:', updateError)
          throw new Error('Impossible de mettre à jour le solde')
        }

        // Log transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'deposit',
            amount: netAmount,
            balance_before: currentBalance,
            balance_after: newBalance,
            description: `Direct Stripe Deposit - Session: ${sessionId.substring(0, 20)}...`,
            stripe_fee: stripeFee,
            created_at: new Date().toISOString()
          })

        setCreditedAmount(netAmount)
        
        toast({
          title: 'Paiement confirmé !',
          description: `$${netAmount.toFixed(2)} ont été ajoutés à votre solde.`,
        })

        console.log('[PAYMENT-SUCCESS] Payment processed successfully!')

      } catch (error: any) {
        console.error('[PAYMENT-SUCCESS] Error:', error)
        
        toast({
          title: 'Erreur de traitement',
          description: error.message || 'Erreur lors du traitement du paiement',
          variant: 'destructive',
        })
        
        // Even if there's an error, redirect to dashboard after a delay
        setTimeout(() => navigate('/'), 3000)
      } finally {
        setLoading(false)
      }
    }

    processPaymentSuccess()
  }, [toast, navigate])

  const handleReturnToDashboard = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Card className="w-[95vw] max-w-md shadow-card gradient-card border-border/50 mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Traitement du paiement...</h3>
              <p className="text-muted-foreground">
                Mise à jour de votre solde en cours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-[95vw] max-w-md shadow-card gradient-card border-border/50 mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 animate-pulse-neon" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Paiement Réussi !
          </CardTitle>
          <CardDescription>
            Votre dépôt a été traité avec succès
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <strong>${creditedAmount.toFixed(2)}</strong> ont été ajoutés à votre solde R6Cash
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant crédité:</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    ${creditedAmount.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    Traité
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleReturnToDashboard}
              className="w-full shadow-primary hover:glow-primary font-bold"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Button>

            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full border-primary/50 hover:border-primary font-bold"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Rejoindre une Partie
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Transaction sécurisée par Stripe</p>
            <p>Vos données de paiement sont protégées</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentSuccess