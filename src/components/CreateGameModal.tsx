import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus, GamepadIcon } from 'lucide-react'
import { createGame } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSafeUser } from '@/hooks/useSafeUser'

interface CreateGameModalProps {
  onGameCreated: () => void
  userBalance: number
}

export const CreateGameModal = ({ onGameCreated, userBalance }: CreateGameModalProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()
  const user = useSafeUser() // ✅ garanti non-null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const mode = formData.get('mode') as string
    const stakeValue = formData.get('stake') as string

    // 🔎 Debug
    console.log("🕹️ CreateGame → user:", user.id, "mode:", mode, "stake:", stakeValue)

    // Validation de base
    if (!mode) {
      toast({
        title: t.missingFields || 'Champ manquant',
        description: 'Veuillez sélectionner un mode de jeu.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (!stakeValue || isNaN(parseFloat(stakeValue))) {
      toast({
        title: t.invalidAmount || 'Montant invalide',
        description: 'Veuillez saisir un montant valide.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const stake = parseFloat(stakeValue)

    // Vérif montants
    if (stake < 4) {
      toast({
        title: t.invalidAmount || 'Montant invalide',
        description: 'Le montant minimum est de $4.00',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (stake > 1000) {
      toast({
        title: t.invalidAmount || 'Montant invalide',
        description: 'Le montant maximum est de $1,000.00',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (userBalance < stake) {
      toast({
        title: t.insufficientFunds || 'Fonds insuffisants',
        description: `Vous avez besoin de $${stake.toFixed(2)} mais votre solde est de $${userBalance.toFixed(2)}.`,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    try {
      // Vérif mode
      const validModes = ['1v1', '2v2', '3v3', '4v4', '5v5']
      if (!validModes.includes(mode)) {
        throw new Error('Mode de jeu invalide')
      }

      // 🔧 Appel supabase avec user.id garanti
      await createGame(mode as '1v1' | '2v2' | '3v3' | '4v4' | '5v5', stake, user.id)

      toast({
        title: t.gameCreated || 'Partie créée !',
        description: t.gameCreatedDesc || 'Votre partie a été créée avec succès.',
      })

      onGameCreated()
      setOpen(false)
      e.currentTarget.reset()
    } catch (error: any) {
      console.error('❌ Create game error:', error)

      let errorMessage = 'Impossible de créer la partie. Veuillez réessayer.'
      if (error.message?.includes('balance')) {
        errorMessage = 'Solde insuffisant pour créer cette partie.'
      } else if (error.message?.includes('invalid')) {
        errorMessage = 'Données de partie invalides.'
      }

      toast({
        title: t.creationFailed || 'Création échouée',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="shadow-primary hover:glow-primary font-bold"
          disabled={userBalance <= 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t.createGame || 'CREATE GAME'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto bg-secondary/95 border-border mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neon font-bold">
            <GamepadIcon className="h-5 w-5" />
            {t.createNewGame || 'CREATE NEW GAME'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode */}
          <div className="space-y-2">
            <Label htmlFor="mode" className="font-bold">{t.gameMode || 'Game Mode'}</Label>
            <Select name="mode" required>
              <SelectTrigger className="bg-background/50 border-border">
                <SelectValue placeholder={t.selectMode || 'Select a mode'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1v1">1v1</SelectItem>
                <SelectItem value="2v2">2v2</SelectItem>
                <SelectItem value="3v3">3v3</SelectItem>
                <SelectItem value="4v4">4v4</SelectItem>
                <SelectItem value="5v5">5v5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stake */}
          <div className="space-y-2">
            <Label htmlFor="stake" className="font-bold">{t.stake || 'Stake'} ($)</Label>
            <Input
              id="stake"
              name="stake"
              type="number"
              min="4.00"
              max={userBalance}
              step="0.01"
              placeholder="4.00"
              className="bg-background/50 border-border"
              required
            />
            <p className="text-xs text-muted-foreground">
              {t.availableBalance || 'Available balance'}: ${userBalance.toFixed(2)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 font-bold"
              disabled={loading}
            >
              {t.cancel || 'CANCEL'}
            </Button>
            <Button
              type="submit"
              className="flex-1 shadow-primary hover:glow-primary font-bold"
              disabled={loading || userBalance <= 0}
            >
              {loading ? (t.creating || 'CREATING...') : (t.create || 'CREATE')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}