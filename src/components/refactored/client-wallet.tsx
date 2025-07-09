// =============================================================================
// CLIENT WALLET - GESTION DU PORTEFEUILLE ECODELI
// =============================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, 
  ChevronDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Settings,
  CreditCard,
  Download,
  RefreshCw,
  Euro,
  ExternalLink,
  TrendingUp,
  Calendar,
  Plus,
  Clock,
  Star,
  CheckCircle,
  Edit,
  LogOut,
  AlertCircle,
  Shield,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LanguageSelector from '@/components/language-selector'
import { useToast } from '@/hooks/use-toast'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { useAuth } from '@/src/hooks/use-auth'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Configuration Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Composant pour la recharge avec Stripe Elements
function WalletRechargeForm({ 
  amount, 
  onSuccess, 
  onError 
}: { 
  amount: number
  onSuccess: () => void
  onError: (error: string) => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError('Stripe n\'est pas encore chargé')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Élément de carte non trouvé')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Créer le Payment Intent côté backend
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      console.log('🚀 DEBUG: Création Payment Intent pour montant:', amount)
      console.log('🔑 DEBUG: Token auth disponible:', token ? 'OUI' : 'NON')
      console.log('🌐 DEBUG: API URL:', process.env.NEXT_PUBLIC_API_URL)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portefeuille/recharger-cagnotte`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            montant: amount,
          }),
        }
      )

      console.log('📦 DEBUG: Réponse backend status:', response.status)
      console.log('📦 DEBUG: Réponse backend ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ DEBUG: Erreur backend response:', errorText)
        throw new Error('Erreur lors de la création du Payment Intent')
      }

      const responseData = await response.json()
      console.log('📦 DEBUG: Réponse backend rechargerCagnotte:', responseData)
      
      const { data } = responseData
      const { client_secret } = data
      
      console.log('✅ DEBUG: Client secret défini:', client_secret ? client_secret.substring(0, 10) + '...' : 'MANQUANT')

      // 2. Confirmer le paiement avec Stripe
      console.log('💳 DEBUG: Confirmation paiement Stripe...')
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Client EcoDeli',
          },
        },
      })

      if (error) {
        console.log('❌ DEBUG: Erreur Stripe:', error)
        throw new Error(error.message || 'Erreur lors du paiement')
      }

      console.log('✅ DEBUG: Paiement Stripe confirmé, status:', paymentIntent?.status)
      if (paymentIntent?.status === 'succeeded') {
        // 3. Confirmer côté backend
        console.log('🔄 DEBUG: Confirmation backend avec payment_intent_id:', paymentIntent.id)
        const confirmResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/portefeuille/confirmer-recharge-cagnotte`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              payment_intent_id: paymentIntent.id,
            }),
          }
        )

        console.log('📦 DEBUG: Confirmation backend status:', confirmResponse.status)
        if (confirmResponse.ok) {
          const confirmData = await confirmResponse.json()
          console.log('✅ DEBUG: Confirmation backend réussie:', confirmData)
          onSuccess()
        } else {
          const confirmError = await confirmResponse.text()
          console.log('❌ DEBUG: Erreur confirmation backend:', confirmError)
          throw new Error('Erreur lors de la confirmation')
        }
      }

    } catch (error: any) {
      console.error('❌ Erreur recharge:', error)
      onError(error.message || 'Erreur lors de la recharge')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Total: {amount.toFixed(2)}€
        </div>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
              Traitement...
            </div>
          ) : (
            `Recharger ${amount.toFixed(2)}€`
          )}
        </button>
      </div>
    </form>
  )
}

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface WalletData {
  id: number
  soldeDisponible: number
  soldeEnAttente: number
  soldeTotal: number
  virementAutoActif: boolean
  seuilVirementAuto: number | null
  iban: string | null
}

interface Transaction {
  id: number
  typeTransaction: 'credit' | 'debit' | 'liberation' | 'virement' | 'commission'
  montant: number
  soldeAvant: number
  soldeApres: number
  description: string
  statut: 'pending' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  referenceExterne?: string
}

interface WalletStats {
  totalEarnings: number
  monthlyEarnings: number
  pendingAmount: number
  completedTransactions: number
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function ClientWallet() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [rechargeAmount, setRechargeAmount] = useState(0)

  // 🔍 DEBUG: Log des variables d'environnement
  console.log('🔍 DEBUG Environment:', {
    stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'DÉFINIE' : 'MANQUANTE',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'MANQUANTE'
  })

  // Fetch wallet data using apiClient
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        console.log('🔍 DEBUG: Fetching wallet data for user:', user.id)

        // Get wallet data using apiClient
        const walletResponse = await apiClient.getUserWallet(user.id.toString())
        console.log('🔍 DEBUG: Raw wallet response:', walletResponse)
        
        if (walletResponse?.success && walletResponse?.data) {
          console.log('🔍 DEBUG: Wallet data structure:', walletResponse.data)
          setWallet(walletResponse.data)
        } else {
          console.log('⚠️ DEBUG: Wallet response invalid:', walletResponse)
        }

        // Get transactions using apiClient
        const transResponse = await apiClient.getWalletHistory(user.id.toString())
        console.log('🔍 DEBUG: Raw transactions response:', transResponse)
        
        if (transResponse?.success && transResponse?.data?.data) {
          console.log('🔍 DEBUG: Transactions data:', transResponse.data.data)
          setTransactions(transResponse.data.data)
        } else {
          console.log('⚠️ DEBUG: Transactions response invalid:', transResponse)
        }

      } catch (error) {
        console.error('❌ DEBUG: Error fetching wallet data:', error)
        toast({
          title: 'Erreur',
          description: getErrorMessage(error),
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, router, toast])

  const handleOpenStripePortal = async () => {
    setIsRefreshing(true)

    try {
      const response = await apiClient.createCustomerPortalSession()
      if (response.success && response.portal_url) {
        window.location.href = response.portal_url
      } else {
        throw new Error('Impossible de créer la session portail')
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error)
      
      // Gestion spécifique de l'erreur Customer Portal non configuré
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('configuration')) {
        toast({
          title: 'Configuration requise',
          description: 'Le portail client Stripe doit être configuré. Contactez l\'administrateur.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'ouvrir le portail de gestion. Vérifiez votre connexion.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const refreshWallet = async () => {
    if (!user) return

    setIsRefreshing(true)

    try {
      const walletResponse = await apiClient.getUserWallet(user.id.toString())
      if (walletResponse?.success && walletResponse?.data) {
        setWallet(walletResponse.data)
        toast({
          title: 'Succès',
          description: 'Portefeuille mis à jour',
        })
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error)
      toast({
        title: 'Erreur',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />
      case 'debit':
      case 'virement':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'commission':
        return <Euro className="h-4 w-4 text-orange-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Complété</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Échoué</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Annulé</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  // Calcul des statistiques
  const calculateStats = (): WalletStats => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter(t => {
      const transDate = new Date(t.createdAt)
      return transDate.getMonth() === currentMonth && 
             transDate.getFullYear() === currentYear &&
             t.statut === 'completed'
    })

    const monthlyEarnings = monthlyTransactions
      .filter(t => t.typeTransaction === 'credit')
      .reduce((sum, t) => sum + t.montant, 0)

    const totalEarnings = transactions
      .filter(t => t.typeTransaction === 'credit' && t.statut === 'completed')
      .reduce((sum, t) => sum + t.montant, 0)

    const pendingAmount = transactions
      .filter(t => t.statut === 'pending')
      .reduce((sum, t) => sum + t.montant, 0)

    const completedTransactions = transactions.filter(t => t.statut === 'completed').length

    return {
      totalEarnings,
      monthlyEarnings,
      pendingAmount,
      completedTransactions
    }
  }

  const stats = calculateStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/app_client">
              <Image
                src="/logo.png"
                alt="EcoDeli Logo"
                width={120}
                height={40}
                className="h-auto"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <div className="relative">
              <button
                className="flex items-center bg-green-50 text-white rounded-full px-4 py-1 hover:bg-green-400 transition-colors"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">{user?.firstName}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/app_client"
            className="text-green-500 hover:underline flex items-center"
          >
            <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Mon Portefeuille EcoDeli</h1>
            <div className="flex space-x-2">
              <Button onClick={refreshWallet} variant="outline" disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button onClick={handleOpenStripePortal} disabled={isRefreshing}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Portail Stripe
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="recharge">Recharger</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Solde Disponible</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {wallet ? formatAmount(wallet.soldeDisponible) : '0,00 €'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vos gains disponibles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {wallet ? formatAmount(wallet.soldeEnAttente) : '0,00 €'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fonds en cours de traitement
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gagné</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatAmount(stats.totalEarnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Depuis le début
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du mois</CardTitle>
                  <CardDescription>
                    Vos performances ce mois-ci
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {formatAmount(stats.monthlyEarnings)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gains du mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {stats.completedTransactions}
                      </div>
                      <div className="text-sm text-muted-foreground">Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {formatAmount(stats.pendingAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">En attente</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {wallet?.virementAutoActif ? 'Activé' : 'Désactivé'}
                      </div>
                      <div className="text-sm text-muted-foreground">Virement auto</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Auto Transfer Status */}
              {wallet?.virementAutoActif && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        Virement automatique activé - Seuil: {formatAmount(wallet.seuilVirementAuto || 0)}
                      </span>
                      {wallet.iban && (
                        <span className="text-sm text-muted-foreground">
                          vers {wallet.iban}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recharge" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-green-600" />
                    Recharger ma cagnotte
                  </CardTitle>
                  <CardDescription>
                    Ajoutez des fonds à votre cagnotte pour payer vos livraisons et services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Montants suggérés */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Montants suggérés</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          className="h-12 text-lg font-semibold"
                          onClick={() => {
                            console.log('🔍 DEBUG: Montant suggéré cliqué:', amount)
                            setRechargeAmount(amount)
                          }}
                        >
                          {amount}€
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Montant personnalisé */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Montant personnalisé</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        step="0.01"
                        value={rechargeAmount}
                        onChange={(e) => {
                          const newAmount = parseFloat(e.target.value) || 0
                          console.log('🔍 DEBUG: Montant personnalisé saisi:', newAmount)
                          setRechargeAmount(newAmount)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Montant en euros"
                      />
                      <span className="text-gray-500">€</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 5€ - Maximum 500€
                    </p>
                  </div>

                  {/* Formulaire de paiement Stripe */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      🔍 DEBUG: rechargeAmount = {rechargeAmount}, Afficher formulaire ? {rechargeAmount >= 5 ? 'OUI' : 'NON'}
                    </div>
                    {rechargeAmount >= 5 ? (
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          <Shield className="h-4 w-4 inline mr-1" />
                          Informations de paiement sécurisées
                        </label>
                        
                        <Elements stripe={stripePromise}>
                          <WalletRechargeForm
                            amount={rechargeAmount}
                            onSuccess={() => {
                              console.log('✅ DEBUG: Recharge réussie pour montant:', rechargeAmount)
                              toast({
                                title: '✅ Recharge réussie !',
                                description: `${rechargeAmount}€ ont été ajoutés à votre cagnotte`,
                              })
                              setRechargeAmount(0)
                              refreshWallet()
                            }}
                            onError={(error) => {
                              console.log('❌ DEBUG: Erreur recharge:', error)
                              toast({
                                title: 'Erreur de paiement',
                                description: error,
                                variant: 'destructive',
                              })
                            }}
                          />
                        </Elements>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Sélectionnez un montant d'au moins 5€ pour afficher le formulaire de paiement
                      </div>
                    )}
                  </div>

                  {/* Informations de sécurité */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">
                          Paiement sécurisé par Stripe
                        </div>
                        <div className="text-blue-700">
                          Vos informations de paiement sont chiffrées et sécurisées. 
                          EcoDeli ne stocke aucune donnée de carte bancaire.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des transactions</CardTitle>
                  <CardDescription>
                    Toutes vos transactions EcoDeli
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              {getTransactionIcon(transaction.typeTransaction)}
                            </div>
                            <div>
                              <div className="font-medium">
                                {transaction.description}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </div>
                              {transaction.referenceExterne && (
                                <div className="text-xs text-muted-foreground">
                                  Réf: {transaction.referenceExterne}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div
                              className={`font-bold ${
                                transaction.typeTransaction === 'credit'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {transaction.typeTransaction === 'credit' ? '+' : '-'}
                              {formatAmount(transaction.montant)}
                            </div>
                            {getStatusBadge(transaction.statut)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-muted-foreground">Aucune transaction pour le moment</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres du portefeuille</CardTitle>
                  <CardDescription>
                    Gérez vos préférences de paiement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Virement automatique</div>
                      <div className="text-sm text-muted-foreground">
                        Transférer automatiquement vos gains
                      </div>
                    </div>
                    <Badge variant={wallet?.virementAutoActif ? "default" : "secondary"}>
                      {wallet?.virementAutoActif ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Portail de paiement Stripe</div>
                      <div className="text-sm text-muted-foreground">
                        Gérer vos abonnements et moyens de paiement
                      </div>
                    </div>
                    <Button onClick={handleOpenStripePortal} variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Exporter les données</div>
                      <div className="text-sm text-muted-foreground">
                        Télécharger un rapport de vos transactions
                      </div>
                    </div>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 