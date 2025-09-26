import type { AppProps } from "next/app"
import { AuthProvider } from "@/contexts/AuthProvider"
import { LanguageProvider } from "@/contexts/LanguageContext"
import "./index.css"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </LanguageProvider>
  )
}

export default MyApp
