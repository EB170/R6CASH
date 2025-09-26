import { Button } from '@/components/ui/button'
import turnLogo from '@/assets/turn-logo.png'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { Zap, Trophy, Target } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted: () => void
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const { t } = useLanguage()

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('https://wallpapercave.com/wp/wp9904019.jpg')" }}
    >
      {/* Overlay noir pour lisibilité */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Contenu */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <img
              src="https://r6cash.lovable.app/assets/r6cash-logo-B0Li6B-D.png"
              alt="R6Cash"
              className="h-10 sm:h-12 w-auto animate-pulse-neon filter drop-shadow-neon"
            />
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitch />
              <Button
                type="button"
                onClick={onGetStarted}
                className="shadow-primary hover:glow-primary transition-neon font-semibold text-sm sm:text-base px-4 sm:px-6"
                size="sm"
              >
                <Zap className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t.getStarted}</span>
                <span className="sm:hidden">START</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <img
              src={turnLogo}
              alt="Turn Gaming"
              className="h-20 sm:h-24 lg:h-28 w-auto animate-pulse-neon filter drop-shadow-neon"
            />
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-white mb-8 max-w-3xl mx-auto font-medium leading-relaxed">
            <span className="text-primary font-bold">{t.competitiveMatches}</span> {t.with}{' '}
            <span className="text-primary font-bold">{t.realFinancialStakes}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              type="button"
              size="lg"
              onClick={onGetStarted}
              className="text-base sm:text-lg px-8 py-4 shadow-primary hover:glow-intense transition-neon font-bold"
            >
              <Target className="mr-2 h-5 w-5" />
              {t.joinBattle}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onGetStarted}
              className="text-base sm:text-lg px-8 py-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-neon font-bold"
            >
              <Trophy className="mr-2 h-5 w-5" />
              {t.seeMatches}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
