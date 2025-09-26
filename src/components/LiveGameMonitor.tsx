import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Users, 
  Target, 
  Clock, 
  Trophy, 
  Skull,
  MapPin,
  Zap,
  Heart,
  Shield
} from 'lucide-react'

interface Player {
  id: string
  username: string
  avatar?: string
  team: 'attackers' | 'defenders'
  kills: number
  deaths: number
  assists: number
  score: number
  ping: number
  isAlive: boolean
  operator: string
}

interface LiveGame {
  id: string
  mode: string
  map: string
  status: 'preparation' | 'active' | 'finished'
  round: number
  maxRounds: number
  timeRemaining: number
  score: {
    attackers: number
    defenders: number
  }
  players: Player[]
  createdAt: string
  stake: number
}

export const LiveGameMonitor = () => {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulation des parties en direct
    const mockGames: LiveGame[] = [
      {
        id: 'game_001',
        mode: 'Ranked',
        map: 'Oregon',
        status: 'active',
        round: 5,
        maxRounds: 9,
        timeRemaining: 127,
        score: {
          attackers: 2,
          defenders: 2
        },
        players: [
          {
            id: 'p1',
            username: 'Ash_Main_Pro',
            team: 'attackers',
            kills: 7,
            deaths: 3,
            assists: 2,
            score: 3420,
            ping: 25,
            isAlive: true,
            operator: 'Ash'
          },
          {
            id: 'p2',
            username: 'Thermite_King',
            team: 'attackers',
            kills: 4,
            deaths: 4,
            assists: 5,
            score: 2890,
            ping: 34,
            isAlive: false,
            operator: 'Thermite'
          },
          {
            id: 'p3',
            username: 'Jager_ACE',
            team: 'defenders',
            kills: 6,
            deaths: 2,
            assists: 1,
            score: 3650,
            ping: 18,
            isAlive: true,
            operator: 'Jäger'
          },
          {
            id: 'p4',
            username: 'Bandit_Trick',
            team: 'defenders',
            kills: 3,
            deaths: 5,
            assists: 3,
            score: 2440,
            ping: 42,
            isAlive: true,
            operator: 'Bandit'
          }
        ],
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        stake: 50
      },
      {
        id: 'game_002',
        mode: 'Bomb',
        map: 'Villa',
        status: 'preparation',
        round: 1,
        maxRounds: 9,
        timeRemaining: 45,
        score: {
          attackers: 0,
          defenders: 0
        },
        players: [
          {
            id: 'p5',
            username: 'Sledge_Hammer',
            team: 'attackers',
            kills: 0,
            deaths: 0,
            assists: 0,
            score: 0,
            ping: 28,
            isAlive: true,
            operator: 'Sledge'
          },
          {
            id: 'p6',
            username: 'Valkyrie_Cam',
            team: 'defenders',
            kills: 0,
            deaths: 0,
            assists: 0,
            score: 0,
            ping: 31,
            isAlive: true,
            operator: 'Valkyrie'
          }
        ],
        createdAt: new Date().toISOString(),
        stake: 100
      }
    ]

    setLiveGames(mockGames)
    setLoading(false)

    // Simulation de mise à jour en temps réel
    const interval = setInterval(() => {
      setLiveGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          timeRemaining: Math.max(0, game.timeRemaining - 1),
          // Simulation de changements de stats aléatoires
          players: game.players.map(player => ({
            ...player,
            ping: Math.max(10, player.ping + Math.floor(Math.random() * 10 - 5))
          }))
        }))
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparation': return 'bg-yellow-500'
      case 'active': return 'bg-green-500'
      case 'finished': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getTeamColor = (team: string) => {
    return team === 'attackers' ? 'text-orange-500' : 'text-blue-500'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Parties en Direct
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des parties...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-500" />
            Parties en Direct ({liveGames.length})
          </CardTitle>
          <CardDescription>
            Surveillance en temps réel des parties actives
          </CardDescription>
        </CardHeader>
      </Card>

      {liveGames.map((game) => (
        <Card key={game.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={`${getStatusColor(game.status)} text-white`}>
                  {game.status === 'preparation' ? 'PRÉPARATION' : 
                   game.status === 'active' ? 'EN COURS' : 'TERMINÉE'}
                </Badge>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{game.map}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{game.stake}€</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Round</div>
                  <div className="font-bold">{game.round}/{game.maxRounds}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Temps</div>
                  <div className="font-bold flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(game.timeRemaining)}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {game.score.attackers}
                </div>
                <div className="text-sm text-muted-foreground">ATTAQUANTS</div>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {game.score.defenders}
                </div>
                <div className="text-sm text-muted-foreground">DÉFENSEURS</div>
              </div>
            </div>

            <Separator />

            {/* Joueurs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attaquants */}
              <div>
                <h4 className="font-semibold text-orange-500 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  ATTAQUANTS
                </h4>
                <div className="space-y-2">
                  {game.players.filter(p => p.team === 'attackers').map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-orange-500/5 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {player.username}
                            {!player.isAlive && <Skull className="h-3 w-3 text-red-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{player.operator}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-green-500">{player.kills}</div>
                          <div className="text-xs text-muted-foreground">K</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-500">{player.deaths}</div>
                          <div className="text-xs text-muted-foreground">D</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-500">{player.assists}</div>
                          <div className="text-xs text-muted-foreground">A</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{player.score}</div>
                          <div className="text-xs text-muted-foreground">PTS</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold ${player.ping > 100 ? 'text-red-500' : player.ping > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {player.ping}
                          </div>
                          <div className="text-xs text-muted-foreground">MS</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Défenseurs */}
              <div>
                <h4 className="font-semibold text-blue-500 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  DÉFENSEURS
                </h4>
                <div className="space-y-2">
                  {game.players.filter(p => p.team === 'defenders').map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {player.username}
                            {!player.isAlive && <Skull className="h-3 w-3 text-red-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{player.operator}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-green-500">{player.kills}</div>
                          <div className="text-xs text-muted-foreground">K</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-500">{player.deaths}</div>
                          <div className="text-xs text-muted-foreground">D</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-500">{player.assists}</div>
                          <div className="text-xs text-muted-foreground">A</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{player.score}</div>
                          <div className="text-xs text-muted-foreground">PTS</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold ${player.ping > 100 ? 'text-red-500' : player.ping > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {player.ping}
                          </div>
                          <div className="text-xs text-muted-foreground">MS</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Barre de progression du round */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression du round</span>
                <span>{formatTime(game.timeRemaining)} restant</span>
              </div>
              <Progress 
                value={(1 - game.timeRemaining / 180) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {liveGames.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune partie en cours</h3>
            <p className="text-muted-foreground">
              Les parties actives apparaîtront ici en temps réel
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}