import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from "@/lib/supabase"
import { StatsCard } from './StatsCard'
import { LoadingSpinner } from './LoadingSpinner'
import { CommissionTracker } from './CommissionTracker'
import { SystemHealthMonitor } from './SystemHealthMonitor'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  FileText 
} from 'lucide-react'

interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  status: string
  payment_method: string
  payment_details: any
  admin_notes?: string
  created_at: string
  profiles?: {
    display_name: string | null
    username: string | null
  } | null
}

interface SystemStats {
  totalUsers: number
  totalDeposits: number
  totalWithdrawals: number
  platformRevenue: number
  pendingWithdrawals: number
}

export const AdminDashboard = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  const { t } = useLanguage()
  const { toast } = useToast()

  const loadData = async () => {
    try {
      // Load withdrawal requests
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles!inner(display_name, username)
        `)
        .order('created_at', { ascending: false })

      if (withdrawalError) throw withdrawalError
      setWithdrawalRequests((withdrawals as any) || [])

      // Load system stats
      const { data: users } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })

      const { data: deposits } = await supabase
        .from('ledger')
        .select('amount')
        .eq('type', 'deposit')

      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('status', 'processed')

      const { data: revenue } = await supabase
        .from('platform_revenue')
        .select('amount')

      const { data: pending } = await supabase
        .from('withdrawal_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')

      const stats: SystemStats = {
        totalUsers: users?.length || 0,
        totalDeposits: deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
        totalWithdrawals: withdrawalsData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0,
        platformRevenue: revenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
        pendingWithdrawals: pending?.length || 0
      }

      setSystemStats(stats)

    } catch (error: any) {
      console.error('Error loading admin data:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données admin',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalAction = async (requestId: string, action: 'approve' | 'reject' | 'process') => {
    setProcessingId(requestId)
    
    try {
      let newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'processed'
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes || null,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: action === 'approve' ? 'Approuvé' : action === 'reject' ? 'Rejeté' : 'Traité',
        description: `Demande de retrait ${action === 'approve' ? 'approuvée' : action === 'reject' ? 'rejetée' : 'traitée'} avec succès`,
      })

      await loadData()
      setAdminNotes('')
      setSelectedRequest(null)

    } catch (error: any) {
      console.error('Error processing withdrawal:', error)
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>
      case 'processed':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Traité</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neon-subtle">{t.adminPanel}</h2>
          <p className="text-muted-foreground">Gérez les utilisateurs et les transactions</p>
        </div>
        <Badge variant="default" className="bg-primary/20 text-primary">
          <Shield className="h-3 w-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t.totalUsers}
          value={systemStats?.totalUsers || 0}
          icon={Users}
          iconClassName="text-primary"
        />
        <StatsCard
          title={t.totalDeposits}
          value={`$${(systemStats?.totalDeposits || 0).toFixed(2)}`}
          icon={TrendingUp}
          iconClassName="text-success"
        />
        <StatsCard
          title={t.totalWithdrawals}
          value={`$${(systemStats?.totalWithdrawals || 0).toFixed(2)}`}
          icon={TrendingDown}
          iconClassName="text-warning"
        />
        <StatsCard
          title={t.platformRevenue}
          value={`$${(systemStats?.platformRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          iconClassName="text-accent"
        />
      </div>

        <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="withdrawals">
            {t.withdrawalRequests}
            {systemStats?.pendingWithdrawals && systemStats.pendingWithdrawals > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {systemStats.pendingWithdrawals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="monitoring">Surveillance</TabsTrigger>
          <TabsTrigger value="users">{t.userManagement}</TabsTrigger>
          <TabsTrigger value="stats">{t.systemStats}</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>{t.withdrawalRequests}</CardTitle>
              <CardDescription>
                Gérez les demandes de retrait des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune demande de retrait</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.profiles?.display_name}</div>
                            <div className="text-sm text-muted-foreground">@{request.profiles?.username}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">${request.amount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{request.payment_method.replace('_', ' ')}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {t.viewDetails}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Détails de la demande</DialogTitle>
                                  <DialogDescription>
                                    Demande de retrait #{request.id.slice(0, 8)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <strong>Utilisateur:</strong> {request.profiles?.display_name}
                                  </div>
                                  <div>
                                    <strong>Montant:</strong> ${request.amount.toFixed(2)}
                                  </div>
                                  <div>
                                    <strong>Méthode:</strong> {request.payment_method}
                                  </div>
                                  <div>
                                    <strong>Détails de paiement:</strong>
                                    <pre className="bg-secondary/50 p-2 rounded text-xs mt-1">
                                      {JSON.stringify(request.payment_details, null, 2)}
                                    </pre>
                                  </div>
                                  {request.status === 'pending' && (
                                    <div className="space-y-2">
                                      <Label htmlFor="admin-notes">{t.adminNotes}</Label>
                                      <Textarea
                                        id="admin-notes"
                                        placeholder="Notes pour cette demande..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleWithdrawalAction(request.id, 'approve')}
                                          disabled={processingId === request.id}
                                          className="bg-success hover:bg-success/90"
                                        >
                                          {t.approve}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleWithdrawalAction(request.id, 'reject')}
                                          disabled={processingId === request.id}
                                        >
                                          {t.reject}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {request.status === 'approved' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleWithdrawalAction(request.id, 'process')}
                                      disabled={processingId === request.id}
                                    >
                                      {t.process}
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionTracker />
        </TabsContent>

        <TabsContent value="monitoring">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t.userManagement}</CardTitle>
              <CardDescription>
                Fonctionnalité à venir - Gestion des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Gestion des utilisateurs en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>{t.systemStats}</CardTitle>
              <CardDescription>
                Statistiques détaillées du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Statistiques avancées en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}