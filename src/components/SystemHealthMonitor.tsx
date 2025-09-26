import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from "@/lib/supabase"
import { useToast } from '@/hooks/use-toast'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Users,
  Gamepad2,
  CreditCard,
  AlertCircle
} from 'lucide-react'

interface HealthMetrics {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'ERROR'
  metrics: {
    total_users: number
    active_games: number
    pending_withdrawals: number
    recent_errors: number
  }
  additional_checks: {
    database_connection: boolean
    supabase_functions: boolean
    stripe_integration: boolean
    timestamp: string
  }
  timestamp: string
  version?: string
}

export const SystemHealthMonitor = () => {
  const [healthData, setHealthData] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const { toast } = useToast()

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase.functions.invoke('system-health', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch health data')
      }

      setHealthData(data)
      setLastChecked(new Date())
      
      // Show toast for critical status
      if (data.status === 'CRITICAL') {
        toast({
          title: 'Alerte Système Critique',
          description: 'Le système nécessite une attention immédiate',
          variant: 'destructive',
        })
      } else if (data.status === 'WARNING') {
        toast({
          title: 'Avertissement Système',
          description: 'Le système présente des problèmes mineurs',
          variant: 'destructive',
        })
      }

    } catch (error: any) {
      console.error('Health check error:', error)
      toast({
        title: 'Erreur de Surveillance',
        description: error.message || 'Impossible de récupérer les données de santé système',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20'
      case 'WARNING':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20'
      case 'CRITICAL':
      case 'ERROR':
        return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20'
    }
  }

  if (loading && !healthData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-300 rounded"></div>
            <div className="h-6 w-48 bg-gray-300 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-300 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Surveillance Système
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHealthData}
              disabled={loading}
              className="font-bold"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>
          </div>
          <CardDescription>
            Surveillance en temps réel de la santé du système
            {lastChecked && (
              <span className="block text-xs text-muted-foreground mt-1">
                Dernière vérification: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthData && (
            <>
              {/* System Status */}
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">État du Système:</span>
                    <Badge className={getStatusColor(healthData.status)}>
                      {healthData.status}
                    </Badge>
                  </div>
                  {healthData.version && (
                    <p className="text-sm text-muted-foreground">
                      Version: {healthData.version}
                    </p>
                  )}
                </div>
              </div>

              {/* System Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">
                    {healthData.metrics.total_users}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Utilisateurs Total
                  </div>
                </div>
                
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <Gamepad2 className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold">
                    {healthData.metrics.active_games}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Parties Actives
                  </div>
                </div>
                
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-warning" />
                  <div className="text-2xl font-bold">
                    {healthData.metrics.pending_withdrawals}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Retraits Pending
                  </div>
                </div>
                
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <AlertCircle className={`h-6 w-6 mx-auto mb-2 ${
                    healthData.metrics.recent_errors > 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`} />
                  <div className="text-2xl font-bold">
                    {healthData.metrics.recent_errors}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Erreurs Récentes
                  </div>
                </div>
              </div>

              {/* Service Status */}
              <div className="space-y-3">
                <h4 className="font-semibold">État des Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span className="text-sm font-medium">Base de données</span>
                    {healthData.additional_checks.database_connection ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span className="text-sm font-medium">Edge Functions</span>
                    {healthData.additional_checks.supabase_functions ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span className="text-sm font-medium">Stripe API</span>
                    {healthData.additional_checks.stripe_integration ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {healthData.status !== 'HEALTHY' && (
                <Alert className={
                  healthData.status === 'CRITICAL' || healthData.status === 'ERROR'
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-yellow-500/50 bg-yellow-500/10'
                }>
                  {healthData.status === 'CRITICAL' || healthData.status === 'ERROR' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {healthData.status === 'CRITICAL' && (
                      'Le système nécessite une attention immédiate. Veuillez contacter l\'administrateur.'
                    )}
                    {healthData.status === 'WARNING' && (
                      'Le système présente des problèmes mineurs qui pourraient nécessiter une attention.'
                    )}
                    {healthData.status === 'ERROR' && (
                      'Erreur système détectée. Veuillez vérifier les logs pour plus de détails.'
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}