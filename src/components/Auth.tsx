import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { signIn, signUp } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { validateEmail, validateDisplayName, validatePassword, sanitizeInput, RateLimiter } from '@/lib/validation'
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker'
import { EmailVerificationModal } from '@/components/EmailVerificationModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitch } from '@/components/LanguageSwitch'

interface AuthProps {
  onAuthSuccess: () => void
}

export const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [loading, setLoading] = useState(false)
  const [signUpPassword, setSignUpPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [rateLimiter] = useState(() => new RateLimiter())
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const email = sanitizeInput(formData.get('email') as string)
    const password = formData.get('password') as string

    // Enhanced validation
    if (!email || !password) {
      toast({
        title: t.missingFields || 'Champs manquants',
        description: 'Veuillez remplir tous les champs.',
        variant: 'destructive',
      })
      return
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`signin_${email}`, 3, 300000)) { // 3 tentatives par 5 min
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(`signin_${email}`, 300000) / 1000)
      toast({
        title: t.tooManyAttempts,
        description: `Veuillez attendre ${remainingTime} secondes avant de réessayer.`,
        variant: 'destructive',
      })
      return
    }

    // Email validation
    if (!validateEmail(email)) {
      toast({
        title: t.invalidEmail,
        description: 'Veuillez saisir une adresse email valide.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      await signIn(email, password)
      toast({
        title: t.connectionSuccess || 'Connexion réussie',
        description: t.connectionSuccessDesc || 'Vous êtes maintenant connecté.',
      })
      onAuthSuccess()
    } catch (error: any) {
      console.error('Sign in error:', error)
      const errorMessage = error.message?.toLowerCase()
      
      if (errorMessage?.includes('invalid login') || errorMessage?.includes('email not confirmed')) {
        toast({
          title: t.connectionFailed || 'Connexion échouée',
          description: 'Email ou mot de passe incorrect. Vérifiez vos identifiants.',
          variant: 'destructive',
        })
      } else if (errorMessage?.includes('too many requests')) {
        toast({
          title: 'Trop de tentatives',
          description: 'Trop de tentatives de connexion. Veuillez attendre avant de réessayer.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: t.connectionFailed || 'Connexion échouée',
          description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const email = sanitizeInput(formData.get('email') as string)
    const password = formData.get('password') as string
    const displayName = sanitizeInput(formData.get('displayName') as string)

    // Enhanced validation
    if (!email || !password || !displayName) {
      toast({
        title: t.missingFields || 'Champs manquants',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      })
      return
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(`signup_${email}`, 2, 600000)) { // 2 tentatives par 10 min
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(`signup_${email}`, 600000) / 60000)
      toast({
        title: t.tooManyAttempts,
        description: `Trop de tentatives d'inscription. Réessayez dans ${remainingTime} minutes.`,
        variant: 'destructive',
      })
      return
    }

    // Email validation
    if (!validateEmail(email)) {
      toast({
        title: t.invalidEmail,
        description: 'Veuillez saisir une adresse email valide.',
        variant: 'destructive',
      })
      return
    }

    // Display name validation
    const displayNameValidation = validateDisplayName(displayName)
    if (!displayNameValidation.valid) {
      toast({
        title: t.invalidUsername || 'Nom d\'utilisateur invalide',
        description: displayNameValidation.error,
        variant: 'destructive',
      })
      return
    }

    // Password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      toast({
        title: t.invalidPassword || 'Mot de passe invalide',
        description: passwordValidation.error,
        variant: 'destructive',
      })
      return
    }

    // Password strength check
    if (passwordStrength < 80) {
      toast({
        title: t.passwordTooWeak || 'Mot de passe trop faible',
        description: 'Votre mot de passe doit être plus fort pour garantir la sécurité de votre compte.',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)

    try {
      await signUp(email, password, displayName)
      setUserEmail(email)
      setShowEmailVerification(true)
      toast({
        title: t.accountCreated || 'Compte créé',
        description: t.emailVerificationDesc || 'Vérifiez votre email pour activer votre compte.',
      })
    } catch (error: any) {
      console.error('Sign up error:', error)
      const errorMessage = error.message?.toLowerCase()
      
      if (errorMessage?.includes('email already registered') || errorMessage?.includes('user already registered')) {
        toast({
          title: t.registrationFailed || 'Inscription échouée',
          description: 'Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.',
          variant: 'destructive',
        })
      } else if (errorMessage?.includes('password')) {
        toast({
          title: t.registrationFailed || 'Inscription échouée',
          description: 'Le mot de passe ne respecte pas les critères de sécurité.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: t.registrationFailed || 'Inscription échouée',
          description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <EmailVerificationModal 
        isOpen={showEmailVerification}
        onClose={() => {
          setShowEmailVerification(false)
          onAuthSuccess()
        }}
        email={userEmail}
      />
      <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-[95vw] max-w-md shadow-card gradient-card border-border/50 animate-fade-in mx-auto">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <LanguageSwitch />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-bold text-neon animate-pulse-neon">R6Cash</CardTitle>
          <CardDescription className="font-medium text-sm sm:text-base">
            {t.authSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50" role="tablist">
              <TabsTrigger 
                value="signin" 
                className="font-bold" 
                data-testid="signin-tab"
                role="tab"
                aria-selected="true"
              >
                {t.signInTab}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="font-bold" 
                data-testid="signup-tab"
                role="tab"
                aria-selected="false"
              >
                {t.signUpTab}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" role="tabpanel">
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="font-bold">{t.email}</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    className="bg-secondary/50 border-border"
                    required
                    aria-describedby="email-error"
                    data-testid="signin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="font-bold">{t.password}</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder={t.passwordPlaceholder}
                    className="bg-secondary/50 border-border"
                    required
                    aria-describedby="password-error"
                    data-testid="signin-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full shadow-primary hover:glow-primary font-bold"
                  disabled={loading}
                  data-testid="signin-submit"
                  aria-describedby="signin-status"
                >
                  {loading ? t.connecting : t.signIn}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="font-bold">{t.displayName}</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder={t.usernamePlaceholder}
                    className="bg-secondary/50 border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">{t.email}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    className="bg-secondary/50 border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold">{t.password}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t.passwordStrengthPlaceholder}
                    className="bg-secondary/50 border-border"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                  />
                  <PasswordStrengthChecker 
                    password={signUpPassword} 
                    onStrengthChange={setPasswordStrength}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full shadow-primary hover:glow-primary font-bold"
                  disabled={loading || passwordStrength < 80}
                >
                  {loading ? t.creating : t.createAccount}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </>
  )
}