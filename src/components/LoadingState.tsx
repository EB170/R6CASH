import { ReactNode } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  loading: boolean
  error?: string | null
  children: ReactNode
  fallback?: ReactNode
  skeleton?: boolean
}

export const LoadingState = ({ 
  loading, 
  error, 
  children, 
  fallback,
  skeleton = false 
}: LoadingStateProps) => {
  if (error) {
    return (
      <Card className="gradient-card border-destructive/50">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Erreur</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    if (skeleton) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
      )
    }

    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}