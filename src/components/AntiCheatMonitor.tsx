import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Ban } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AntiCheatAlert {
  id: string
  userId: string
  username: string
  gameId: string
  type: 'wallhack' | 'aimbot' | 'speed_hack' | 'macro' | 'suspicious_stats'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: string
  evidence: {
    headshot_ratio?: number
    avg_reaction_time?: number
    movement_speed?: number
    accuracy?: number
    wall_detection_score?: number
  }
  status: 'pending' | 'investigating' | 'false_positive' | 'confirmed'
}

export const AntiCheatMonitor = () => {
  const [alerts, setAlerts] = useState<AntiCheatAlert[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Simulation des alertes anti-cheat
    const mockAlerts: AntiCheatAlert[] = [
      {
        id: '1',
        userId: 'user_123',
        username: 'SuspiciousPlayer_01',
        gameId: 'game_456',
        type: 'aimbot',
        severity: 'critical',
        description: 'Taux de headshot anormalement élevé (98%)',
        timestamp: new Date().toISOString(),
        evidence: {
          headshot_ratio: 0.98,
          avg_reaction_time: 45,
          accuracy: 0.94
        },
        status: 'pending'
      },
      {
        id: '2',
        userId: 'user_789',
        username: 'FastRunner_Pro',
        gameId: 'game_789',
        type: 'speed_hack',
        severity: 'high',
        description: 'Vitesse de déplacement 300% supérieure à la normale',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        evidence: {
          movement_speed: 3.2,
          wall_detection_score: 0.15
        },
        status: 'investigating'
      },
      {
        id: '3',
        userId: 'user_321',
        username: 'WallHacker_99',
        gameId: 'game_101',
        type: 'wallhack',
        severity: 'high',
        description: 'Détection d\'ennemis à travers les murs',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        evidence: {
          wall_detection_score: 0.89,
          accuracy: 0.76,
          headshot_ratio: 0.45
        },
        status: 'confirmed'
      }
    ]
    
    setAlerts(mockAlerts)
    setLoading(false)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'investigating': return <Eye className="h-4 w-4 text-blue-500" />
      case 'confirmed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'false_positive': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleBanPlayer = (alertId: string, username: string) => {
    toast({
      title: 'Joueur banni',
      description: `${username} a été banni du système pour triche confirmée.`,
      variant: 'destructive',
    })
    
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'confirmed' as const }
        : alert
    ))
  }

  const handleFalsePositive = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'false_positive' as const }
        : alert
    ))
    
    toast({
      title: 'Faux positif confirmé',
      description: 'L\'alerte a été marquée comme faux positif.',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Anti-Cheat Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des alertes...</p>
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
            <Shield className="h-5 w-5 text-green-500" />
            Système Anti-Cheat
          </CardTitle>
          <CardDescription>
            Surveillance automatique des comportements suspects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-500">
                {alerts.filter(a => a.severity === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Critique</div>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">
                {alerts.filter(a => a.severity === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">Élevé</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">
                {alerts.filter(a => a.severity === 'medium').length}
              </div>
              <div className="text-sm text-muted-foreground">Moyen</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {alerts.filter(a => a.status === 'false_positive').length}
              </div>
              <div className="text-sm text-muted-foreground">Faux positifs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="border-l-4" style={{borderLeftColor: getSeverityColor(alert.severity).replace('bg-', '')}}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(alert.status)}
                  <div>
                    <CardTitle className="text-lg">{alert.username}</CardTitle>
                    <CardDescription>
                      Partie #{alert.gameId} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getSeverityColor(alert.severity)} text-white`}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {alert.evidence.headshot_ratio && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(alert.evidence.headshot_ratio * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Headshots</div>
                  </div>
                )}
                {alert.evidence.accuracy && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(alert.evidence.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Précision</div>
                  </div>
                )}
                {alert.evidence.avg_reaction_time && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {alert.evidence.avg_reaction_time}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Réaction</div>
                  </div>
                )}
                {alert.evidence.wall_detection_score && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(alert.evidence.wall_detection_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Wallhack</div>
                  </div>
                )}
              </div>

              {alert.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleBanPlayer(alert.id, alert.username)}
                    className="flex items-center gap-2"
                  >
                    <Ban className="h-4 w-4" />
                    Bannir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFalsePositive(alert.id)}
                  >
                    Faux positif
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}