import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from './LoadingSpinner'

interface PlayerRanking {
  user_id: string
  display_name: string | null
  elo_rating: number | null
  username: string | null
  rank: number
}

export const EloLeaderboard = () => {
  const [rankings, setRankings] = useState<PlayerRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, elo_rating, username')
        .order('elo_rating', { ascending: false })
        .limit(50)

      if (error) throw error

      const safeData = (data || []).map((player, index) => ({
        user_id: player.user_id,
        display_name: player.display_name ?? null,
        elo_rating: player.elo_rating ?? 1200, // fallback safe
        username: player.username ?? null,
        rank: index + 1
      }))

      setRankings(safeData)
    } catch (err: any) {
      console.error('❌ Erreur classement:', err)
      toast({
        title: 'Erreur de chargement',
        description: err.message || 'Impossible de charger le classement.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    await fetchLeaderboard()
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />
      default:
        return (
          <span className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">
            #{rank}
          </span>
        )
    }
  }

  const getEloTier = (elo: number) => {
    if (elo >= 2400) return { name: 'Légende', color: 'from-purple-500 to-pink-500' }
    if (elo >= 2200) return { name: 'Champion', color: 'from-red-500 to-orange-500' }
    if (elo >= 2000) return { name: 'Diamant', color: 'from-blue-400 to-cyan-400' }
    if (elo >= 1800) return { name: 'Platine', color: 'from-emerald-400 to-teal-400' }
    if (elo >= 1600) return { name: 'Or', color: 'from-yellow-400 to-amber-400' }
    if (elo >= 1400) return { name: 'Argent', color: 'from-gray-300 to-gray-400' }
    return { name: 'Bronze', color: 'from-amber-700 to-orange-700' }
  }

  if (loading) {
    return (
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Classement ELO</CardTitle>
          <CardDescription>Chargement en cours...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-neon" />
              Classement ELO
            </CardTitle>
            <CardDescription>
              Top 50 des meilleurs joueurs R6Cash
            </CardDescription>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded border border-primary/50 hover:border-primary transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Aucun joueur classé pour le moment</p>
            <p className="text-sm">Les premiers matchs définiront le classement</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((player) => {
              const tier = getEloTier(player.elo_rating)
              return (
                <div
                  key={player.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(player.rank)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username || player.user_id}`} 
                      />
                      <AvatarFallback>
                        {player.display_name?.charAt(0) || player.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {player.display_name || player.username || 'Joueur anonyme'}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`bg-gradient-to-r ${tier.color} text-white text-xs`}
                      >
                        {tier.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-neon">
                      {player.elo_rating}
                    </p>
                    <p className="text-xs text-muted-foreground">ELO</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}