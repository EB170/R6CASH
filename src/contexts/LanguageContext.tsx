import React, { createContext, useContext, useState, useEffect } from "react"
import { Language, translations, Translations, formatMessage } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  formatMessage: (message: string, params?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = "r6cash_language"
const fallbackLanguage: Language = "en"

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(fallbackLanguage)

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage)
      }
    } catch (err) {
      console.warn("⚠️ Impossible d'accéder à localStorage, fallback en anglais.")
      setLanguageState(fallbackLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch (err) {
      console.warn("⚠️ Impossible d'enregistrer la langue dans localStorage.")
    }
  }

  // Sécurité : si la langue n’existe pas, on retombe sur l’anglais
  const t = translations[language] ?? translations[fallbackLanguage]

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    formatMessage: (message: string, params?: Record<string, string>) =>
      formatMessage(message, params),
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
