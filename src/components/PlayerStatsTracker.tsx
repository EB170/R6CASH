import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { BarChart3, Target, Award } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface PlayerStatsTrackerProps {
  username: string
  platform: string
  initialStats?: any
}

export default function PlayerStatsTracker({ username, platform, initialStats }: PlayerStatsTrackerProps) {
  const [stats, setStats] = useState<any | null>(initialStats || null)
  const [loading, setLoading] = useState(!initialStats)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!username) return
    let cancelled = false

    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`https://ykseqqeabceslsgzzuta.functions.supabase.co/fetch-player-stats-tracker`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, platform })
        })

        if (!res.ok) {
          const text = await res.text()
          console.error("Stats error:", res.status, text)
          if (res.status === 404) throw new Error("Pseudo introuvable sur Tracker.")
          if (res.status === 429) throw new Error("Trop de requêtes — attendez un peu.")
          throw new Error("Erreur lors du chargement des stats.")
        }

        const json = await res.json()
        if (!cancelled) setStats(json?.stats?.data || null)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Erreur réseau")
          setStats(null)
          toast({
            title: "Erreur stats R6",
            description: err.message,
            variant: "destructive"
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [username, platform])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-muted-foreground">Chargement des statistiques R6...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20 text-red-300">
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle>Aucune donnée</CardTitle>
          <CardDescription>Impossible de récupérer les stats pour {username}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // raccourci pour accéder aux stats
  const segment = stats.segments?.[0]?.stats || {}
  const kd = segment.kd?.displayValue ?? "N/A"
  const winrate = segment.wl?.displayValue ?? "N/A"
  const matches = segment.matchesPlayed?.displayValue ?? "N/A"
  const rank = segment.rank?.metadata?.name ?? "Non classé"

  // données pour graphe mappés à un vrai historique
  const chartData = stats.history?.length ? stats.history : []


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-neon-subtle flex items-center gap-2">
            🎮 Stats de {username}
          </CardTitle>
          <CardDescription className="font-medium">
            Plateforme : {platform.toUpperCase()} • Rang : {rank}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center">
              <Target className="w-6 h-6 mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">K/D</div>
              <div className="text-2xl font-bold">{kd}</div>
            </div>
            <div className="p-4 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center">
              <Award className="w-6 h-6 mb-2 text-success" />
              <div className="text-sm text-muted-foreground">Winrate</div>
              <div className="text-2xl font-bold">{winrate}</div>
            </div>
            <div className="p-4 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center">
              <BarChart3 className="w-6 h-6 mb-2 text-accent" />
              <div className="text-sm text-muted-foreground">Matchs</div>
              <div className="text-2xl font-bold">{matches}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphe */}
      <Card className="gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-neon-subtle">Évolution récente</CardTitle>
          <CardDescription>Performance sur les derniers matchs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="match" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="kd" stroke="#00ffcc" strokeWidth={2} dot />
                <Line type="monotone" dataKey="winrate" stroke="#ffaa00" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Badge info */}
      <div className="text-center">
        <Badge variant="outline" className="bg-black/40 border-white/20 text-sm">
          Données fournies par Tracker Network
        </Badge>
      </div>
    </div>
  )
}
