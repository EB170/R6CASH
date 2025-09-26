import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { Wallet, CreditCard, AlertTriangle, Loader2, DollarSign } from 'lucide-react'
import { useSafeUser } from '@/hooks/useSafeUser'

interface WithdrawModalProps {
  onWithdraw: () => void
  userBalance: number
}

export const WithdrawModal = ({ onWithdraw, userBalance }: WithdrawModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const user = useSafeUser() // ✅ user.id garanti

  const isFormValid = () => {
    const withdrawAmount = parseFloat(amount)
    return (
      amount &&
      !isNaN(withdrawAmount) &&
      withdrawAmount >= 20 &&
      withdrawAmount <= userBalance &&
      paymentMethod &&
      accountHolder &&
      accountNumber &&
      (paymentMethod !== 'bank_transfer' || routingNumber)
    )
  }

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount)

    if (!isFormValid()) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez remplir tous les champs requis.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Session utilisateur expirée. Veuillez vous reconnecter.')
      }

      const payment_details: any = {
        account_holder: accountHolder,
        account_number: accountNumber,
      }
      if (paymentMethod === 'bank_transfer' && routingNumber) {
        payment_details.routing_number = routingNumber
      }

      console.log('🏦 Withdrawal request:', {
        userId: user.id,
        amount: withdrawAmount,
        method: paymentMethod,
        payment_details,
      })

      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          user_id: user.id, // ✅ traçabilité renforcée
          amount: withdrawAmount,
          payment_method: paymentMethod,
          payment_details,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Withdrawal response:', { data, error })

      if (error) {
        throw new Error(error.message || 'Erreur lors de la demande de retrait')
      }

      if (data?.success) {
        toast({
          title: 'Demande de retrait soumise',
          description: `Votre demande de retrait de $${withdrawAmount.toFixed(2)} a été soumise avec succès.`,
        })

        // Reset form
        setAmount('')
        setPaymentMethod('')
        setAccountHolder('')
        setAccountNumber('')
        setRoutingNumber('')
        setIsOpen(false)
        onWithdraw()
      } else {
        throw new Error(data?.error || 'Erreur inconnue lors du retrait')
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error)

      let errorMessage = 'Impossible de traiter la demande de retrait.'
      if (error.message?.includes('balance')) {
        errorMessage = 'Solde insuffisant pour cette demande de retrait.'
      } else if (error.message?.includes('session')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.'
      }

      toast({
        title: 'Erreur de retrait',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-bold border-primary/50 hover:border-primary">
          <DollarSign className="h-4 w-4 mr-2" />
          Solde: ${userBalance.toFixed(2)}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] overflow-y-auto gradient-card border-border/50 mx-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-neon flex items-center gap-2">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            Demande de Retrait
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Retirez vos gains de R6Cash vers votre méthode de paiement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Solde disponible:</span>
              <Badge variant="secondary" className="text-lg font-bold">
                ${userBalance.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold">Montant à retirer</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-medium"
                min="20"
                max={userBalance}
                step="0.01"
              />
            </div>
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Méthode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="accountHolder" className="text-sm font-semibold">Nom du titulaire</Label>
              <Input
                id="accountHolder"
                placeholder="Nom complet"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-sm font-semibold">
                {paymentMethod === 'paypal' ? 'Adresse PayPal' : 'Numéro de compte'}
              </Label>
              <Input
                id="accountNumber"
                placeholder={paymentMethod === 'paypal' ? 'email@example.com' : 'Numéro de compte'}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <Label htmlFor="routingNumber" className="text-sm font-semibold">Code de routage</Label>
                <Input
                  id="routingNumber"
                  placeholder="Code de routage bancaire"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Montant minimum $20.00. Retraits traités sous 24-48h ouvrées.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="font-bold order-2 sm:order-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={!isFormValid() || loading}
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
                Demander le retrait
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}