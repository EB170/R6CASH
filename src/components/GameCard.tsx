import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users, Trophy, DollarSign } from 'lucide-react'
import { Game } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'

interface GameCardProps {
  game: Game
  onJoin: (gameId: string) => Promise<void> | void
  canJoin: boolean
  onSpectate?: (gameId: string) => Promise<void> | void
  commissionRate?: number // ex: 0.05 pour 5%
}

export const GameCard = ({ 
  game, 
  onJoin,
  canJoin,
  onSpectate,
  commissionRate = 0.05
}: GameCardProps) => {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { id, mode, stake, status, created_at, creator_profile, players } = game

  // 🔒 Sécurité sur calcul joueurs
  const maxPlayers = (() => {
    switch (mode) {
      case '1v1': return 2
      case '2v2': return 4
      case '3v3': return 6
      case '4v4': return 8
      case '5v5': return 10
      default: return 2
    }
  })()
  const currentPlayers = players?.length || 1 // si players inclut déjà le créateur → pas de +1 systématique

  // Gain net après commission
  const prizePool = (stake * maxPlayers * (1 - commissionRate)).toFixed(2)

  const getStatusBadge = () => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="text-neon font-bold">{t.waiting || 'WAITING'}</Badge>
      case 'active':
        return <Badge variant="destructive" className="animate-pulse font-bold">{t.inProgress || 'IN PROGRESS'}</Badge>
      case 'finished':
        return <Badge variant="outline" className="font-bold">{t.finished || 'FINISHED'}</Badge>
      default:
        return null
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '--:--'
    }
  }

  const handleJoin = async () => {
    try {
      await onJoin(id)
    } catch (err: any) {
      console.error('❌ Join game failed:', err)
      toast({
        title: t.joinFailed || 'Join failed',
        description: err.message || 'Impossible de rejoindre la partie',
        variant: 'destructive',
      })
    }
  }

  const handleSpectate = async () => {
    try {
      await onSpectate?.(id)
    } catch (err: any) {
      console.error('❌ Spectate failed:', err)
      toast({
        title: t.spectateFailed || 'Spectate failed',
        description: err.message || 'Impossible de rejoindre en spectateur',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="bg-secondary/80 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card hover:glow-primary">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold text-foreground">
            {mode.toUpperCase()} Match
          </CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          {t.createdBy || 'Created by'}: {creator_profile?.display_name || 'Unknown'}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-neon" />
            <span className="font-bold text-neon">${stake.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{currentPlayers}/{maxPlayers}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatTime(created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="font-bold text-warning">${prizePool}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {status === 'waiting' && currentPlayers < maxPlayers && (
            <Button 
              onClick={handleJoin} 
              className="flex-1 shadow-primary hover:glow-primary font-bold"
              size="sm"
              disabled={!canJoin}
              title={!canJoin ? (t.insufficientBalance || 'Not enough balance') : ''}
            >
              {canJoin ? (t.join || 'JOIN') : (t.insufficientBalance || 'INSUFFICIENT BALANCE')}
            </Button>
          )}
          
          {status === 'active' && onSpectate && (
            <Button 
              onClick={handleSpectate} 
              variant="outline" 
              className="flex-1 font-bold"
              size="sm"
            >
              {t.spectate || 'SPECTATE'}
            </Button>
          )}
          
          {status === 'waiting' && currentPlayers >= maxPlayers && (
            <Button 
              disabled 
              className="flex-1 font-bold"
              size="sm"
            >
              {t.full || 'FULL'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}