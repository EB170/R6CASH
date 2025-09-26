import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { Languages } from 'lucide-react'

export const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="border-border/50 hover:border-primary/50 font-bold text-xs sm:text-sm px-2 sm:px-3"
      title={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
    >
      <Languages className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">
        {language === 'en' ? 'FR' : 'EN'}
      </span>
      <span className="sm:hidden">
        {language === 'en' ? 'FR' : 'EN'}
      </span>
    </Button>
  )
}