import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from './LoadingSpinner'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  GamepadIcon, 
  Trophy, 
  CreditCard, 
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSafeUser } from '@/hooks/useSafeUser'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'game_stake' | 'game_winnings' | 'commission'
  amount: number
  balance_before: number
  balance_after: number
  description: string
  stripe_charge_id?: string
  stripe_fee?: number
  created_at: string
  game_id?: number
}

export const TransactionHistory = () => {
  const user = useSafeUser() // ✅ garanti non-null
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const loadTransactions = async () => {
    try {
      console.log("🔎 Chargement transactions pour user:", user.id)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTransactions(data as Transaction[] || [])
    } catch (error: any) {
      console.error('Error loading transactions:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger l\'historique des transactions.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTransactions()
  }

  useEffect(() => {
    loadTransactions()
  }, [user.id]) // ✅ déclenché uniquement quand user.id est garanti

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <ArrowDownCircle className="h-4 w-4 text-green-500" />
      case 'withdrawal': return <ArrowUpCircle className="h-4 w-4 text-red-500" />
      case 'game_stake': return <GamepadIcon className="h-4 w-4 text-orange-500" />
      case 'game_winnings': return <Trophy className="h-4 w-4 text-yellow-500" />
      case 'commission': return <DollarSign className="h-4 w-4 text-blue-500" />
      default: return <CreditCard className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTransactionBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Dépôt</Badge>
      case 'withdrawal': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Retrait</Badge>
      case 'game_stake': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Mise</Badge>
      case 'game_winnings': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Gains</Badge>
      case 'commission': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Commission</Badge>
      default: return <Badge variant="secondary">Transaction</Badge>
    }
  }

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : ''
    const color = amount >= 0 ? 'text-green-500' : 'text-red-500'
    return <span className={`font-bold ${color}`}>{sign}${Math.abs(amount).toFixed(2)}</span>
  }

  if (loading) {
    return (
      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-neon-subtle">
              Historique des Transactions
            </CardTitle>
            <CardDescription>
              Suivez tous vos dépôts, retraits et activités de jeu
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-primary/50 hover:border-primary"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Aucune transaction pour le moment</p>
            <p className="text-sm">Effectuez votre premier dépôt pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTransactionBadge(tx.type)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(tx.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    {tx.stripe_fee && tx.stripe_fee > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Frais Stripe: ${tx.stripe_fee.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {formatAmount(tx.amount)}
                  <div className="text-xs text-muted-foreground mt-1">
                    Solde: ${tx.balance_after.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
            {transactions.length >= 50 && (
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Affichage des 50 dernières transactions
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}