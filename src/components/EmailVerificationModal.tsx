import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from "@/lib/supabase"
import { Mail, RefreshCw } from 'lucide-react'

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
}

export const EmailVerificationModal = ({ isOpen, onClose, email }: EmailVerificationModalProps) => {
  const [isResending, setIsResending] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (error) throw error

      toast({
        title: 'Email renvoyé',
        description: 'Un nouvel email de vérification a été envoyé.',
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de renvoyer l\'email. Veuillez réessayer.',
        variant: 'destructive',
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Mail className="h-5 w-5" />
            {t.emailVerificationTitle}
          </DialogTitle>
          <DialogDescription>
            {t.emailVerificationDesc}
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t.emailVerificationInstructions}
                </p>
                <p className="text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded">
                  {email}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="flex-1"
                >
                  {isResending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {t.resendEmail}
                </Button>
                <Button onClick={onClose} className="flex-1">
                  OK
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}