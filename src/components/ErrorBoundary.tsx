import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from "@/lib/supabase"
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({
      error,
      errorInfo,
      errorId
    })

    // Log error to system
    this.logErrorToSystem(error, errorInfo, errorId)
  }

  private async logErrorToSystem(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const { data: session } = await supabase.auth.getSession()
      
      // Only log if we have a valid session
      if (session.session) {
        await supabase.functions.invoke('log-system-error', {
          body: {
            error_id: errorId,
            error_type: 'REACT_ERROR_BOUNDARY',
            error_message: error.message,
            error_stack: error.stack,
            component_stack: errorInfo.componentStack,
            user_id: session.session.user?.id,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            user_agent: navigator.userAgent
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log error to system:', logError)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
          <Card className="w-full max-w-lg shadow-card gradient-card border-border/50 animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-neon">
                Oups ! Une erreur s'est produite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/50 bg-red-500/10">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Détails de l'erreur:</p>
                    <p className="text-sm font-mono bg-secondary/50 p-2 rounded">
                      {this.state.error?.message || 'Erreur inconnue'}
                    </p>
                    {this.state.errorId && (
                      <p className="text-xs text-muted-foreground">
                        ID d'erreur: {this.state.errorId}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Que souhaitez-vous faire ?
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={this.handleReset}
                    className="font-bold"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={this.handleReload}
                    className="font-bold"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recharger la page
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="font-bold"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Retour à l'accueil
                  </Button>
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-secondary/50 p-4 rounded text-xs">
                  <summary className="cursor-pointer font-bold mb-2">
                    Détails techniques (dev)
                  </summary>
                  <pre className="whitespace-pre-wrap break-words">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                    {this.state.errorInfo?.componentStack && '\n\nComponent Stack:'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Si le problème persiste, contactez notre support avec l'ID d'erreur
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}