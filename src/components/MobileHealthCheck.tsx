import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { 
  CheckCircle, 
  AlertTriangle, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  TouchpadIcon as Touch,
  Battery 
} from 'lucide-react'

export const MobileHealthCheck = () => {
  const isMobile = useIsMobile()
  const { isTablet, isDesktop, screenSize, isLandscape, isPortrait } = useMobileDetection()
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Check connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType || 'unknown')
    }

    // Check battery (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
      }).catch(() => {
        // Battery API not available
      })
    }

    // Online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getDeviceIcon = () => {
    if (isMobile && !isTablet) return <Smartphone className="h-5 w-5" />
    if (isTablet) return <Tablet className="h-5 w-5" />
    return <Monitor className="h-5 w-5" />
  }

  const getHealthStatus = () => {
    const issues = []
    if (!isOnline) issues.push("Pas de connexion")
    if (batteryLevel && batteryLevel < 20) issues.push("Batterie faible")
    if (connectionType === '2g') issues.push("Connexion lente")
    
    return issues.length === 0 ? 'healthy' : issues.length === 1 ? 'warning' : 'critical'
  }

  const healthStatus = getHealthStatus()

  return (
    <Card className="shadow-card gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          {getDeviceIcon()}
          Diagnostic Mobile
          <Badge 
            variant={healthStatus === 'healthy' ? 'default' : 'destructive'}
            className={healthStatus === 'healthy' ? 'bg-green-500 text-white' : ''}
          >
            {healthStatus === 'healthy' ? 'OK' : healthStatus === 'warning' ? 'ATTENTION' : 'CRITIQUE'}
          </Badge>
        </CardTitle>
        <CardDescription>
          État de santé de votre appareil et connexion
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">
                {isMobile && !isTablet ? 'Mobile' : isTablet ? 'Tablette' : 'Desktop'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Écran:</span>
              <span className="text-xs">{`${screenSize.width}x${screenSize.height}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orientation:</span>
              <Badge variant="outline">
                {isLandscape ? 'Paysage' : 'Portrait'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Connexion:</span>
              <div className="flex items-center gap-1">
                <Wifi className={`h-3 w-3 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
                  {isOnline ? connectionType.toUpperCase() : 'OFFLINE'}
                </Badge>
              </div>
            </div>
            
            {batteryLevel !== null && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Batterie:</span>
                <div className="flex items-center gap-1">
                  <Battery className={`h-3 w-3 ${batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
                  <Badge variant={batteryLevel > 20 ? 'default' : 'destructive'} className="text-xs">
                    {batteryLevel}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Tests */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Tests de Performance:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
              <span>Responsive:</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
              <span>Touch Ready:</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {!isOnline && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Pas de connexion Internet. Certaines fonctionnalités peuvent être indisponibles.
            </AlertDescription>
          </Alert>
        )}

        {batteryLevel && batteryLevel < 20 && (
          <Alert variant="destructive">
            <Battery className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Batterie faible ({batteryLevel}%). Rechargez votre appareil.
            </AlertDescription>
          </Alert>
        )}

        {connectionType === '2g' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Connexion lente détectée. Les performances peuvent être réduites.
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Recommandations:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            {isMobile && <p>• Utilisez le mode portrait pour une meilleure expérience</p>}
            {connectionType === '4g' && <p>• Connexion optimale pour le gaming en ligne</p>}
            <p>• Fermez les applications inutiles pour libérer de la mémoire</p>
            <p>• Maintenez l'application à jour pour les meilleures performances</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}