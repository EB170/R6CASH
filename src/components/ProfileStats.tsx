import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatsCard } from './StatsCard'
import { UserProfile, Game } from '@/lib/supabase'
import { Wallet, Trophy, Users, Target, TrendingUp, Zap } from 'lucide-react'

interface ProfileStatsProps {
  profile?: UserProfile | null
  games?: Game[] | null
  userId?: string
}

export const ProfileStats = ({ profile, games, userId }: ProfileStatsProps) => {
  const [rank, setRank] = useState<'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'>('Bronze')
  const [xp, setXp] = useState(0)
  const [nextLevelXp, setNextLevelXp] = useState(100)

  // 🔒 Vérification props
  if (!profile || !userId) {
    console.warn("⚠️ ProfileStats rendu sans profil ou userId valide")
    return (
      <Card className="shadow-card gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-neon-subtle">
            Impossible de charger les statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vos données de profil ne sont pas disponibles pour le moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  const safeGames = games || []
  const finishedGames = safeGames.filter(g => g.status === 'finished')
  const wins = finishedGames.filter(g => g.winner_id === userId).length
  const losses = finishedGames.length - wins
  const winRate = finishedGames.length > 0 ? (wins / finishedGames.length * 100) : 0

  const totalEarnings = safeGames
    .filter(g => g.status === 'finished' && g.winner_id === userId)
    .reduce((sum, g) => sum + (g.stake * 2), 0)

  const totalSpent = safeGames
    .filter(g => g.creator_id === userId || g.players?.some(p => p.user_id === userId))
    .reduce((sum, g) => sum + g.stake, 0)

  const netProfit = totalEarnings - totalSpent

  // Calcul dynamique du rang et XP
  useEffect(() => {
    const calculateRank = () => {
      if (wins >= 50 && totalEarnings >= 1000) return 'Diamond'
      if (wins >= 30 && totalEarnings >= 500) return 'Platinum'
      if (wins >= 15 && totalEarnings >= 200) return 'Gold'
      if (wins >= 5 && totalEarnings >= 50) return 'Silver'
      return 'Bronze'
    }

    const calculateXP = () => {
      const baseXP = wins * 10 + safeGames.length * 2
      const bonusXP = Math.floor(totalEarnings / 10)
      return baseXP + bonusXP
    }

    setRank(calculateRank())
    setXp(calculateXP())
  }, [wins, totalEarnings, safeGames.length])

  const getEloTier = (elo: number) => {
    if (elo >= 2400) return { name: 'Légende', color: 'text-purple-500' }
    if (elo >= 2200) return { name: 'Champion', color: 'text-red-500' }
    if (elo >= 2000) return { name: 'Diamant', color: 'text-blue-400' }
    if (elo >= 1800) return { name: 'Platine', color: 'text-emerald-400' }
    if (elo >= 1600) return { name: 'Or', color: 'text-yellow-400' }
    if (elo >= 1400) return { name: 'Argent', color: 'text-gray-400' }
    return { name: 'Bronze', color: 'text-amber-700' }
  }

  const currentTier = getEloTier((profile as any)?.elo_rating || 1200)
  const xpProgress = ((xp % nextLevelXp) / nextLevelXp) * 100

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card className="shadow-card gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-neon-subtle">
                {profile.display_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${currentTier.color} bg-secondary border-current`}>
                  <Trophy className="h-3 w-3 mr-1" />
                  {currentTier.name}
                </Badge>
                <Badge variant="outline" className="text-neon border-neon">
                  ELO: {(profile as any)?.elo_rating || 1200}
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  Niveau {Math.floor(xp / nextLevelXp) + 1}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                ${profile.balance.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Solde actuel</div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progression</span>
              <span className="text-primary font-bold">
                {xp % nextLevelXp}/{nextLevelXp} XP
              </span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="VICTOIRES"
          value={wins}
          subtitle={`${losses} défaites`}
          icon={Trophy}
          trend={winRate > 50 ? 'up' : winRate < 50 ? 'down' : 'neutral'}
          trendValue={`${winRate.toFixed(1)}% win rate`}
          iconClassName="text-success"
        />
        
        <StatsCard
          title="GAINS TOTAUX"
          value={`$${totalEarnings.toFixed(2)}`}
          subtitle={`${totalSpent.toFixed(2)} dépensé`}
          icon={Wallet}
          trend={netProfit > 0 ? 'up' : netProfit < 0 ? 'down' : 'neutral'}
          trendValue={`${netProfit >= 0 ? '+' : ''}$${netProfit.toFixed(2)} net`}
          iconClassName="text-primary"
        />
        
        <StatsCard
          title="MATCHS JOUÉS"
          value={safeGames.length}
          subtitle={`${finishedGames.length} terminés`}
          icon={Users}
          iconClassName="text-accent"
        />
        
        <StatsCard
          title="PRÉCISION"
          value={`${winRate.toFixed(1)}%`}
          subtitle="Taux de victoire"
          icon={Target}
          trend={winRate > 60 ? 'up' : winRate < 40 ? 'down' : 'neutral'}
          iconClassName={winRate > 60 ? 'text-success' : winRate < 40 ? 'text-destructive' : 'text-warning'}
        />
        
        <StatsCard
          title="MISE MOYENNE"
          value={`$${safeGames.length > 0 ? (totalSpent / safeGames.length).toFixed(2) : '0.00'}`}
          subtitle="Par match"
          icon={TrendingUp}
          iconClassName="text-warning"
        />
        
        <StatsCard
          title="RANG XP"
          value={xp}
          subtitle={`Niveau ${Math.floor(xp / nextLevelXp) + 1}`}
          icon={Zap}
          iconClassName="text-primary"
        />
      </div>
    </div>
  )
}