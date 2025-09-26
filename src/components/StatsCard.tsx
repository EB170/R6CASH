import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title?: string
  value?: string | number | null
  subtitle?: string | null
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | null
  className?: string
  iconClassName?: string
}

export const StatsCard = ({ 
  title = "—", 
  value = "N/A", 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  className = '',
  iconClassName = 'text-primary'
}: StatsCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-success'
      case 'down': return 'text-destructive'
      case 'neutral': return 'text-muted-foreground'
      default: return 'text-muted-foreground'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'neutral': return '→'
      default: return ''
    }
  }

  return (
    <Card className={`shadow-card gradient-card border-border/50 hover:border-primary/50 transition-neon animate-slide-in ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground">
          {title || "—"}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-neon mb-1">
          {value !== null && value !== undefined ? value : "N/A"}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}