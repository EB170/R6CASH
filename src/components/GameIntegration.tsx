import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gamepad2, Users, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react'

interface R6ApiStatus {
  connected: boolean
  lastSync: string | null
  playersVerified: number
  error?: string
}

export const GameIntegration = () => {
  const [apiStatus, setApiStatus] = useState<R6ApiStatus>({
    connected: false,
    lastSync: null,
    playersVerified: 0,
    error: 'L\'intégration API Rainbow Six Siege est en cours de développement'
  })

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neon-subtle">
            <Gamepad2 className="h-6 w-6" />
            Intégration Rainbow Six Siege
          </CardTitle>
          <CardDescription>
            Système de vérification et suivi des comptes R6 des joueurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statut de l'API */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Statut de l'API Ubisoft</h3>
            
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <strong>En développement :</strong> L'intégration avec l'API officielle Rainbow Six Siege d'Ubisoft est actuellement en cours de développement. 
                Les statistiques R6 et la vérification automatique des comptes ne sont pas encore fonctionnelles.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Connexion API</span>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                    EN COURS
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Intégration API Ubisoft Connect en développement
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Comptes vérifiés</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Aucune vérification automatique pour le moment
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Dernière sync</span>
                  <Badge variant="outline">Jamais</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  API non encore connectée
                </p>
              </div>
            </div>
          </div>

          {/* Fonctionnalités planifiées */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fonctionnalités R6 Planifiées</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Vérification automatique des comptes',
                  description: 'Lien automatique avec les profils Ubisoft Connect',
                  status: 'planned',
                  icon: Shield
                },
                {
                  title: 'Statistiques R6 en temps réel',
                  description: 'ELO, KD ratio, niveau, rang compétitif',
                  status: 'planned',
                  icon: Users
                },
                {
                  title: 'Historique des matchs R6',
                  description: 'Suivi des performances en jeu',
                  status: 'planned',
                  icon: Clock
                },
                {
                  title: 'Système anti-smurf',
                  description: 'Détection des comptes secondaires',
                  status: 'planned',
                  icon: AlertTriangle
                }
              ].map((feature, index) => (
                <div key={index} className="p-4 border border-border rounded-lg bg-secondary/20">
                  <div className="flex items-start gap-3">
                    <feature.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                      <Badge variant="outline" className="text-xs">
                        En développement
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* État actuel du système */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">État Actuel</h3>
            
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Système de jeu fonctionnel :</strong> Les créations de parties, mises, 
                paiements et gestion des gains fonctionnent parfaitement sans intégration R6. 
                Les joueurs peuvent d'ores et déjà utiliser la plateforme pour leurs matchs compétitifs.
              </AlertDescription>
            </Alert>

            <div className="p-4 border border-border rounded-lg bg-primary/5">
              <h4 className="font-medium mb-2">Pour le moment :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Les joueurs créent et rejoignent des parties manuellement</li>
                <li>• La vérification des résultats se fait via le système de vérification intégré</li>
                <li>• Les profils utilisateurs sont gérés par R6Cash uniquement</li>
                <li>• Tous les paiements et gains sont traités de manière sécurisée</li>
              </ul>
            </div>
          </div>

          {/* Documentation */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Documentation API Ubisoft</h4>
                <p className="text-sm text-muted-foreground">
                  Accès aux spécifications techniques pour les développeurs
                </p>
              </div>
              <Button variant="outline" asChild>
                <a 
                  href="https://www.ubisoft.com/en-us/developer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ubisoft Developer
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}