import { Button } from '@/components/ui/button'
import { LanguageSwitch } from './LanguageSwitch'
import { BalanceDisplay } from './BalanceDisplay'
import { LogOut, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import r6cashLogo from '@/assets/r6cash-logo.png'
import { useSafeUser } from '@/hooks/useSafeUser'

interface NavbarProps {
  profile: any
  onSignOut: () => void
  onRefresh: () => void
  refreshing: boolean
  isAdmin?: boolean
}

export const Navbar = ({ profile, onSignOut, onRefresh, refreshing, isAdmin }: NavbarProps) => {
  const { t } = useLanguage()
  const user = useSafeUser()

  return (
    <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={r6cashLogo} 
              alt="R6Cash" 
              className="h-10 sm:h-12 w-auto animate-pulse-neon filter drop-shadow-neon"
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Balance Display in Navbar */}
            {profile && user?.id ? (
              <BalanceDisplay 
                userId={user.id} 
                initialBalance={profile?.balance || 0}
                className="hidden sm:block"
              />
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Chargement du solde…
              </span>
            )}
            
            <LanguageSwitch />
            
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={refreshing}
              size="sm"
              className="border-primary/50 hover:border-primary font-bold px-2 sm:px-3"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">{t.refresh}</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onSignOut} 
              size="sm"
              className="border-destructive/50 hover:border-destructive font-bold text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t.signOut}</span>
              <span className="sm:hidden">OUT</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}