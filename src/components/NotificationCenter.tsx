import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, Trophy, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSafeUser } from '@/hooks/useSafeUser'

interface Notification {
  id: string
  type: 'game_joined' | 'game_started' | 'game_finished'
  title: string
  message: string
  timestamp: string
  read: boolean
  icon?: React.ReactNode
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const user = useSafeUser() // ✅ user.id garanti

  useEffect(() => {
    if (!user?.id) {
      console.warn("⏸ NotificationCenter rendu sans user.id")
      return
    }

    console.log("🔔 Subscribing to notifications for user:", user.id)

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `creator_id=eq.${user.id}` },
        (payload) => {
          const game = payload.new as any
          if (game.status === 'active') {
            addNotification({
              type: 'game_started',
              title: 'Match démarré',
              message: `Votre match ${game.mode} vient de commencer`,
              icon: <Users className="h-4 w-4 text-accent" />,
            })
          } else if (game.status === 'finished') {
            addNotification({
              type: 'game_finished',
              title: 'Match terminé',
              message: `Votre match ${game.mode} est terminé`,
              icon: <Trophy className="h-4 w-4 text-success" />,
            })
          }
        }
      )
      .subscribe()

    return () => {
      console.log("🧹 Unsubscribing notifications channel")
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]) // max 10
    setUnreadCount((prev) => prev + 1)

    // auto-remove après 30s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id))
    }, 30000)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const notif = notifications.find((n) => n.id === id)
    if (notif && !notif.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const formatTime = (timestamp: string) => {
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diffMin = Math.floor((now - time) / 60000)
    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `${diffMin}m`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`
    return `${Math.floor(diffMin / 1440)}j`
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative border-primary/50 hover:border-primary"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 sm:w-96 max-w-[95vw] max-h-96 overflow-hidden gradient-card border-border/50 shadow-card z-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-6 px-2">
                    Tout lire
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="max-h-64 sm:max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer ${
                      !n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {n.icon}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{n.title}</h4>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                          <span className="text-xs text-muted-foreground opacity-70">
                            {formatTime(n.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(n.id)
                        }}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}