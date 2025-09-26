import { useState, useEffect } from "react"
import { LoadingSpinner } from './LoadingSpinner'
import { Navbar } from './Navbar'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import { supabase, signOut, getAvailableGames, getUserGames, getUserProfile, Game, UserProfile } from '@/lib/supabase'
import { useUserRole } from '@/hooks/useUserRole'
import { useSafeUser } from "@/hooks/useSafeUser"
import { AdminDashboard } from '@/components/AdminDashboard'

export const Dashboard = ({ onSignOut }: { onSignOut: () => void }) => {
  const user = useSafeUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [availableGames, setAvailableGames] = useState<Game[]>([])
  const [userGames, setUserGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uiCrash, setUiCrash] = useState(false) // ✅ détecte crash UI
  const { toast } = useToast()
  const { t, formatMessage } = useLanguage()
  const { loading: roleLoading, isAdmin } = useUserRole(user.id)

  // Chargement principal
  const loadData = async () => {
    try {
      const [profileData, availableData, userGamesData] = await Promise.all([
        getUserProfile(user.id).catch(() => null),
        getAvailableGames().catch(() => []),
        getUserGames(user.id).catch(() => [])
      ])

      setProfile(profileData)
      setAvailableGames(availableData.filter(game => game.creator_id !== user.id))
      setUserGames(userGamesData)

      if (!profileData) {
        toast({
          title: 'Avertissement',
          description: 'Impossible de charger le profil utilisateur',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Unexpected error in loadData:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 🔧 Subscriptions realtime avec fallback
useEffect(() => {
  loadData()

  let gameChannel: ReturnType<typeof supabase.channel> | null = null
  let playersChannel: ReturnType<typeof supabase.channel> | null = null

  try {
    gameChannel = supabase
      .channel('games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, loadData)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn("⚠️ Realtime games bloqué (probablement CSP).")
        }
      })

    playersChannel = supabase
      .channel('game_players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players' }, loadData)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn("⚠️ Realtime players bloqué (probablement CSP).")
        }
      })
  } catch (err) {
    console.error("❌ Impossible d'initialiser realtime:", err)
  }

  return () => {
    if (gameChannel) supabase.removeChannel(gameChannel)
    if (playersChannel) supabase.removeChannel(playersChannel)
  }
}, [user.id])

  const handleSignOut = async () => {
    try {
      await signOut()
      onSignOut()
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  // Fallback global si crash UI
  if (uiCrash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">⚠️ Erreur de rendu</h2>
          <p className="text-muted-foreground mb-4">
            Un problème est survenu dans l’interface. Recharge la page ou reconnecte-toi.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    )
  }

  try {
    // Loading global
    if (loading || roleLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center gradient-hero">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground font-bold">{t.loadingData}</p>
        </div>
      )
    }

    // Vue Admin
    if (isAdmin) {
      return (
        <div className="min-h-screen gradient-hero">
          <Navbar 
            profile={profile}
            onSignOut={handleSignOut}
            onRefresh={loadData}
            refreshing={refreshing}
            isAdmin={isAdmin}
          />
          <div className="container mx-auto py-6">
            <AdminDashboard />
          </div>
        </div>
      )
    }

    // Vue Utilisateur standard
    const finishedGames = userGames.filter(g => g.status === 'finished')
    const victories = finishedGames.filter(g => g.winner_id === user.id).length
    const winrate = finishedGames.length > 0 ? Math.round((victories / finishedGames.length) * 1000) / 10 : null

    return (
      <div className="min-h-screen gradient-hero text-white">
        <Navbar 
          profile={profile}
          onSignOut={handleSignOut}
          onRefresh={loadData}
          refreshing={refreshing}
        />

        <div className="container mx-auto px-4 py-6">
          {/* Welcome */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-neon-subtle">
              {formatMessage(t.welcome, { name: profile?.display_name || user.email })}
            </h2>
            <p className="text-muted-foreground font-medium">{t.readyForAction}</p>
          </div>

          {/* 👉 ici tu réintègres tes StatsCard, Tabs, etc. */}
        </div>
      </div>
    )
  } catch (err) {
    console.error("💥 Dashboard UI crashed:", err)
    setUiCrash(true)
    return null
  }
}

export default Dashboard