import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from './LoadingSpinner'
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  Calendar,
  GamepadIcon,
  CreditCard
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PlatformRevenue {
  id: string
  transaction_type: string
  amount: number
  created_at: string
  game_id?: string
  user_id?: string
}

interface CommissionStats {
  totalCommission: number
  todayCommission: number
  monthlyCommission: number
  gameCommissions: number
  depositCommissions: number
}

export const CommissionTracker = () => {
  const [revenues, setRevenues] = useState<PlatformRevenue[]>([])
  const [stats, setStats] = useState<CommissionStats>({
    totalCommission: 0,
    todayCommission: 0,
    monthlyCommission: 0,
    gameCommissions: 0,
    depositCommissions: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const loadCommissionData = async () => {
    try {
      const { data: revenueData, error: revenueError } = await supabase
        .from('platform_revenue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (revenueError) throw revenueError

      const safeRevenues = Array.isArray(revenueData) ? revenueData : []
      setRevenues(safeRevenues)

      // Stats calculées proprement
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      const statsCalc = safeRevenues.reduce<CommissionStats>((acc, revenue) => {
        const revenueDate = new Date(revenue.created_at)
        const amount = revenue.amount || 0

        acc.totalCommission += amount
        if (revenueDate >= startOfDay) acc.todayCommission += amount
        if (revenueDate >= startOfMonth) acc.monthlyCommission += amount
        if (revenue.transaction_type === 'game_commission') acc.gameCommissions += amount
        if (revenue.transaction_type === 'deposit_commission') acc.depositCommissions += amount

        return acc
      }, {
        totalCommission: 0,
        todayCommission: 0,
        monthlyCommission: 0,
        gameCommissions: 0,
        depositCommissions: 0
      })

      setStats(statsCalc)

    } catch (error: any) {
      console.error('❌ Error loading commission data:', error)
      toast({
        title: 'Erreur de chargement',
        description: error.message || 'Impossible de charger les données de commission.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    await loadCommissionData()
  }

  useEffect(() => {
    loadCommissionData()
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'game_commission':
        return <GamepadIcon className="h-4 w-4 text-green-500" />
      case 'deposit_commission':
        return <CreditCard className="h-4 w-4 text-blue-500" />
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'game_commission':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Jeu</Badge>
      case 'deposit_commission':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Dépôt</Badge>
      default:
        return <Badge variant="secondary">Commission</Badge>
    }
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold text-neon">${stats.totalCommission.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aujourd&apos;hui</p>
                <p className="text-2xl font-bold text-green-500">${stats.todayCommission.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ce Mois</p>
                <p className="text-2xl font-bold text-blue-500">${stats.monthlyCommission.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Jeux</p>
                <p className="text-2xl font-bold text-yellow-500">${stats.gameCommissions.toFixed(2)}</p>
              </div>
              <GamepadIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-neon-subtle">
                Commissions Récentes
              </CardTitle>
              <CardDescription>
                Suivi des revenus de la plateforme en temps réel
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
          {revenues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aucune commission pour le moment</p>
              <p className="text-sm">Les commissions apparaîtront ici automatiquement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revenues.map((revenue) => (
                <div
                  key={revenue.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(revenue.transaction_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getTransactionBadge(revenue.transaction_type)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(revenue.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {revenue.transaction_type === 'game_commission' 
                          ? 'Commission sur match' 
                          : 'Commission sur dépôt'}
                      </p>
                      {revenue.game_id && (
                        <p className="text-xs text-muted-foreground">
                          Jeu ID: {revenue.game_id}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-500">
                      +${revenue.amount.toFixed(2)}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">
                      Commission (5%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}