import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { 
  Eye, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Camera,
  Activity,
  Zap
} from 'lucide-react'

interface MatchVerification {
  id: string
  game_id: string
  status: 'pending' | 'verified' | 'disputed' | 'failed'
  screenshots: string[]
  game_score: {
    team1: number
    team2: number
  }
  confidence: number
  verification_method: 'auto' | 'manual' | 'ai_vision'
  created_at: string
  details: {
    map: string
    duration: number
    players: string[]
  }
}

export const MatchVerificationSystem = () => {
  const [verifications, setVerifications] = useState<MatchVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState(true)
  const { toast } = useToast()

  // 🔥 Charger depuis Supabase
  const loadVerifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('match_verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setVerifications(data as MatchVerification[])
    } catch (err: any) {
      console.error('Erreur loadVerifications:', err)
      toast({
        title: 'Erreur de chargement',
        description: err.message || 'Impossible de charger les vérifications',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVerifications()

    // 🔄 Live updates via Realtime
    const channel = supabase
      .channel('verifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_verifications' }, loadVerifications)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusIcon = (status: MatchVerification['status']) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'disputed': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: MatchVerification['status']) => {
    switch (status) {
      case 'verified': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'disputed': return 'bg-orange-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getMethodIcon = (method: MatchVerification['verification_method']) => {
    switch (method) {
      case 'ai_vision': return <Eye className="h-4 w-4" />
      case 'auto': return <Activity className="h-4 w-4" />
      case 'manual': return <Shield className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const handleManualVerify = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from('match_verifications')
        .update({ status: 'pending', verification_method: 'manual' })
        .eq('id', verificationId)

      if (error) throw error

      toast({ title: 'Vérification manuelle assignée' })
      await loadVerifications()
    } catch (err: any) {
      toast({
        title: 'Erreur vérification manuelle',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleForceVerify = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from('match_verifications')
        .update({ status: 'verified', confidence: 100 })
        .eq('id', verificationId)

      if (error) throw error

      toast({ title: 'Match validé manuellement' })
      await loadVerifications()
    } catch (err: any) {
      toast({
        title: 'Erreur force verify',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Système de Vérification des Matchs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const confidenceAvg = verifications.length > 0
    ? Math.round(verifications.reduce((acc, v) => acc + v.confidence, 0) / verifications.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Système de Vérification Automatique
          </CardTitle>
          <CardDescription>
            Résultats validés via IA, auto-check et modération
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatBlock label="Vérifiés" value={verifications.filter(v => v.status === 'verified').length} color="text-green-500" />
            <StatBlock label="En attente" value={verifications.filter(v => v.status === 'pending').length} color="text-yellow-500" />
            <StatBlock label="Disputés" value={verifications.filter(v => v.status === 'disputed').length} color="text-orange-500" />
            <StatBlock label="Confiance moy." value={`${confidenceAvg}%`} color="text-blue-500" />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${autoVerifyEnabled ? 'text-green-500' : 'text-gray-500'}`} />
              <span className="font-medium">Vérification automatique</span>
              <Badge>{autoVerifyEnabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoVerifyEnabled(!autoVerifyEnabled)}
            >
              {autoVerifyEnabled ? 'Désactiver' : 'Activer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des vérifications */}
      {verifications.map((verification) => (
        <Card key={verification.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(verification.status)}
                <div>
                  <CardTitle>Match #{verification.game_id}</CardTitle>
                  <CardDescription>
                    {verification.details.map} • {verification.details.duration} min • {new Date(verification.created_at).toLocaleTimeString()}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{getMethodIcon(verification.verification_method)} {verification.verification_method.toUpperCase()}</Badge>
                <Badge className={`${getStatusColor(verification.status)} text-white`}>{verification.status.toUpperCase()}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score */}
            <div className="flex justify-around p-4 bg-secondary/20 rounded-lg">
              <span className="text-blue-500 font-bold text-xl">{verification.game_score.team1}</span>
              <span className="font-bold">VS</span>
              <span className="text-orange-500 font-bold text-xl">{verification.game_score.team2}</span>
            </div>

            {/* Confiance */}
            <div>
              <Progress value={verification.confidence} />
              <p className="text-sm mt-1">Confiance IA: <span className="font-bold">{verification.confidence}%</span></p>
            </div>

            {/* Screenshots */}
            {verification.screenshots?.length > 0 && (
              <div>
                <p className="text-sm mb-2">Captures ({verification.screenshots.length})</p>
                <div className="flex gap-2 overflow-x-auto">
                  {verification.screenshots.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`screenshot-${i}`}
                      className="w-24 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {verification.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleManualVerify(verification.id)}>Vérif manuelle</Button>
                <Button size="sm" variant="outline" onClick={() => handleForceVerify(verification.id)}>Forcer validation</Button>
              </div>
            )}
            {verification.status === 'disputed' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Ce match est contesté. Un modérateur doit décider.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}

      {verifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3>Aucune vérification</h3>
            <p className="text-muted-foreground">Elles apparaîtront automatiquement.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const StatBlock = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="text-center p-4 bg-secondary/10 rounded-lg">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
)