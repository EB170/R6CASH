import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SecuritySetting {
  id: string
  name: string
  description: string
  enabled: boolean
  level: 'basic' | 'advanced' | 'critical'
}

export const SecuritySettings = () => {
  const [settings, setSettings] = useState<SecuritySetting[]>([
    {
      id: 'two_factor',
      name: 'Authentification à deux facteurs',
      description: 'Sécurise votre compte avec un code de vérification supplémentaire',
      enabled: false,
      level: 'critical'
    },
    {
      id: 'transaction_limits',
      name: 'Limites de transaction',
      description: 'Limite automatique sur les montants de mise élevés',
      enabled: true,
      level: 'advanced'
    },
    {
      id: 'login_monitoring',
      name: 'Surveillance des connexions',
      description: 'Alerte en cas de connexion suspecte ou inhabituelle',
      enabled: true,
      level: 'basic'
    },
    {
      id: 'device_verification',
      name: 'Vérification des appareils',
      description: 'Vérification requise pour les nouveaux appareils',
      enabled: false,
      level: 'advanced'
    },
    {
      id: 'auto_logout',
      name: 'Déconnexion automatique',
      description: 'Déconnexion après 30 minutes d\'inactivité',
      enabled: true,
      level: 'basic'
    }
  ])
  
  const { toast } = useToast()

  const toggleSetting = (settingId: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ))
    
    const setting = settings.find(s => s.id === settingId)
    toast({
      title: 'Paramètre de sécurité modifié',
      description: `${setting?.name} ${setting?.enabled ? 'désactivé' : 'activé'}`,
    })
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="font-bold text-xs">CRITIQUE</Badge>
      case 'advanced':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning font-bold text-xs">AVANCÉ</Badge>
      case 'basic':
        return <Badge variant="outline" className="font-bold text-xs">BASIQUE</Badge>
      default:
        return null
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'advanced':
        return <Lock className="h-4 w-4 text-warning" />
      case 'basic':
        return <Eye className="h-4 w-4 text-primary" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const securityScore = settings.filter(s => s.enabled).length * 20

  return (
    <Card className="bg-secondary/80 border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-neon font-bold">
            <Shield className="h-5 w-5" />
            PARAMÈTRES DE SÉCURITÉ
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={securityScore >= 80 ? "outline" : securityScore >= 60 ? "secondary" : "destructive"}
              className={`font-bold ${securityScore >= 80 ? 'text-neon border-neon' : ''}`}
            >
              {securityScore >= 80 ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              SCORE: {securityScore}%
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Configurez les mesures de sécurité pour protéger votre compte
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-background/40 border-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-start gap-3 flex-1">
                {getLevelIcon(setting.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {setting.name}
                    </h4>
                    {getLevelBadge(setting.level)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
              </div>
              
              <Switch
                checked={setting.enabled}
                onCheckedChange={() => toggleSetting(setting.id)}
                className="ml-3"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-3 rounded-lg bg-background/20 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-neon" />
            <span className="text-sm font-medium text-neon">Recommandations de sécurité</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Activez l'authentification à deux facteurs pour une sécurité maximale</li>
            <li>• Vérifiez régulièrement vos connexions récentes</li>
            <li>• Utilisez un mot de passe fort et unique</li>
            <li>• Ne partagez jamais vos identifiants</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}