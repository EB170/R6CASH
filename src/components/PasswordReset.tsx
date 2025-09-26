import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { validateEmail, RateLimiter } from '@/lib/validation'
import { ArrowLeft, Mail, Shield } from 'lucide-react'

interface PasswordResetProps {
  onBack: () => void
}

export const PasswordReset = ({ onBack }: PasswordResetProps) => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [rateLimiter] = useState(() => new RateLimiter())
  const { toast } = useToast()

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    // Rate limiting - 3 tentatives par 15 minutes
    if (!rateLimiter.isAllowed(`reset_${email}`, 3, 900000)) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(`reset_${email}`, 900000) / 60000)
      toast({
        title: 'Trop de tentatives',
        description: `Réessayez dans ${remainingTime} minutes.`,
        variant: 'destructive',
      })
      return
    }

    // Validation email
    if (!validateEmail(email)) {
      toast({
        title: 'Email invalide',
        description: 'Veuillez saisir un email valide.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: 'Email envoyé',
        description: 'Si un compte avec cet email existe, vous recevrez un lien de réinitialisation.',
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Card className="w-full max-w-md shadow-card gradient-card border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-neon">Email envoyé</CardTitle>
            <CardDescription className="font-medium">
              Vérifiez votre boîte de réception
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Si un compte avec cet email existe, vous recevrez un lien de réinitialisation.
              </p>
              <p className="text-xs text-muted-foreground">
                Le lien expire dans 15 minutes pour votre sécurité.
              </p>
            </div>
            
            <Button 
              variant="outline" 
              onClick={onBack}
              className="w-full font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <Card className="w-full max-w-md shadow-card gradient-card border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-neon">Réinitialiser le mot de passe</CardTitle>
          <CardDescription className="font-medium">
            Saisissez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="font-bold">Email</Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                className="bg-secondary/50 border-border"
                required
                aria-describedby="reset-email-error"
                data-testid="reset-email"
              />
            </div>
            
            <div className="space-y-4">
              <Button 
                type="submit" 
                className="w-full shadow-primary hover:glow-primary font-bold"
                disabled={loading}
                data-testid="reset-submit"
              >
                {loading ? 'ENVOI...' : 'ENVOYER LE LIEN'}
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={onBack}
                className="w-full font-bold"
                data-testid="reset-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          </form>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold">Sécurité</p>
                <p className="text-xs text-muted-foreground">
                  Le lien expire automatiquement dans 15 minutes. 
                  Toutes vos sessions actives seront invalidées après réinitialisation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}