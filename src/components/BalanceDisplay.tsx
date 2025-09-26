import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { Wallet, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface BalanceDisplayProps {
  userId?: string
  initialBalance?: number
  className?: string
}

interface BalanceData {
  balance: number
  lastUpdate: string
  last24hChange: number
}

export const BalanceDisplay = ({ userId, initialBalance = 0, className = "" }: BalanceDisplayProps) => {
  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: initialBalance,
    lastUpdate: new Date().toISOString(),
    last24hChange: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uiCrash, setUiCrash] = useState(false) // ✅ Détection crash UI
  const { toast } = useToast()

  const refreshBalance = async () => {
    if (!userId) {
      console.warn("⚠️ BalanceDisplay → userId manquant, impossible de rafraîchir")
      setError("Utilisateur invalide")
      return
    }

    setLoading(true)
    setError(null)
    try {
      // src/components/BalanceDisplay.tsx → dans refreshBalance()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)   // ✅ pas "user_id"
      .single()

      if (profileError) throw profileError

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('id', userId)
        .gte('created_at', yesterday.toISOString())

      if (transactionsError) throw transactionsError

      const last24hChange = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setBalanceData({
        balance: Number(profile.balance),
        lastUpdate: new Date().toISOString(),
        last24hChange
      })
    } catch (err: any) {
      console.error('❌ Error refreshing balance:', err)
      setError("Impossible de rafraîchir le solde")
      toast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir le solde',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return

    refreshBalance()

    const subscription = supabase
      .channel('balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          setBalanceData(prev => ({
            ...prev,
            balance: Number(payload.new.balance),
            lastUpdate: payload.new.updated_at
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)

  const getChangeIndicator = () => {
    if (balanceData.last24hChange === 0) return null
    
    const isPositive = balanceData.last24hChange > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500'
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        {isPositive ? '+' : ''}{formatCurrency(balanceData.last24hChange)} (24h)
      </div>
    )
  }

  // ✅ Si l’UI plante → fallback minimaliste texte brut
  if (uiCrash) {
    return (
      <div className="p-2 text-sm bg-background/50 border border-border rounded-md">
        <span className="font-bold">Solde:</span>{" "}
        {error ? "Erreur solde" : formatCurrency(balanceData.balance)}
      </div>
    )
  }

  try {
    return (
      <Card className={`gradient-card border-border/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Solde R6Cash</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshBalance}
                    disabled={loading || !userId}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-lg font-bold px-2 py-1 bg-primary/20 text-primary border-primary/30"
                  >
                    {error ? (
                      <span className="flex items-center gap-1 text-red-500">
                        <AlertTriangle className="h-4 w-4" /> Erreur
                      </span>
                    ) : (
                      formatCurrency(balanceData.balance)
                    )}
                  </Badge>
                  {!error && getChangeIndicator()}
                </div>
              </div>
            </div>
          </div>
          
          {!error && balanceData.lastUpdate && (
            <div className="mt-2 text-xs text-muted-foreground">
              Dernière mise à jour: {new Date(balanceData.lastUpdate).toLocaleString('fr-FR')}
            </div>
          )}
        </CardContent>
      </Card>
    )
  } catch (err) {
    console.error("💥 BalanceDisplay UI crashed:", err)
    setUiCrash(true)
    return null
  }
}