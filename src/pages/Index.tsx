import { useState } from "react"
import { Auth } from "@/components/Auth"
import { Dashboard } from "@/components/Dashboard"
import { HeroSection } from "@/components/HeroSection"
import { SplashScreen } from "@/components/SplashScreen"
import { useLanguage } from "@/contexts/LanguageContext"
import { useAuth } from "@/contexts/AuthProvider"

const Index = () => {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const { t } = useLanguage()

  const handleAuthSuccess = () => setShowAuth(false)
  const handleGetStarted = () => setShowAuth(true)
  const handleSplashComplete = () => setShowSplash(false)

  // Splash screen
  if (showSplash) {
    console.log("👉 Render SplashScreen")
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  // Chargement global
  if (loading) {
    console.log("👉 Render Loading")
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl mb-4 text-neon animate-pulse-neon">⚡</div>
          <p className="text-muted-foreground font-bold">{t.loading}</p>
        </div>
      </div>
    )
  }

  // Cas dégradé → si on n'a ni user ni erreur claire
  if (!user && !showAuth) {
    console.warn("⚠️ Aucun user après chargement → fallback Hero")
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-hero p-6 text-center">
        <p className="mb-4 text-lg font-semibold text-red-500">
          Impossible de récupérer votre session
        </p>
        <button
          onClick={handleGetStarted}
          className="px-6 py-3 rounded-lg bg-primary text-white font-bold shadow-md hover:glow-primary transition"
        >
          {t.signIn || "Se connecter"}
        </button>
      </div>
    )
  }

  // Auth modal
  if (showAuth && !user) {
    console.log("👉 Render Auth")
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  // Hero section (pas connecté)
  if (!user) {
    console.log("👉 Render HeroSection")
    return <HeroSection onGetStarted={handleGetStarted} />
  }

  // Dashboard (connecté)
  console.log("👉 Render Dashboard")
  return <Dashboard />
}

export default Index