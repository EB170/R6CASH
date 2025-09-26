import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "./LoadingSpinner"
import { useToast } from "@/hooks/use-toast"
import { useSafeUser } from "@/hooks/useSafeUser"
import { Trophy, Sword, XCircle, RefreshCw, Calendar } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Game {
  id: number
  created_at: string
  stake: number
  status: "active" | "finished" | "cancelled"
  winner_id?: string
}

export const MatchHistory = () => {
  const user = useSafeUser() // ✅ garanti non-null
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const loadGames = async () => {
    try {
      console.log("🔎 Chargement historique des matchs pour user:", user.id)
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .or(`creator_id.eq.${user.id},players.cs.{${user.id}}`)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setGames(data as Game[] || [])
    } catch (error: any) {
      console.error("Error loading games:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger l'historique des matchs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGames()
  }

  useEffect(() => {
    loadGames()
  }, [user.id])

  const getStatusBadge = (game: Game) => {
    switch (game.status) {
      case "finished":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            Terminé
          </Badge>
        )
      case "active":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            En cours
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            Annulé
          </Badge>
        )
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-neon-subtle">
              Historique des Matchs
            </CardTitle>
            <CardDescription>
              Retrouvez vos parties récentes et leurs résultats
            </CardDescription>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-md border border-primary/50 hover:border-primary transition"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {games.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sword className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Aucun match trouvé</p>
            <p className="text-sm">Rejoignez une partie pour voir votre historique ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => {
              const isWinner = game.winner_id === user.id
              return (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isWinner ? (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    ) : game.status === "finished" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Sword className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(game)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(game.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        Mise: ${game.stake.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {game.status === "finished" && (
                    <div className="text-right">
                      {isWinner ? (
                        <span className="text-green-500 font-bold">Victoire</span>
                      ) : (
                        <span className="text-red-500 font-bold">Défaite</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}