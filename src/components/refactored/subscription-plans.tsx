// =============================================================================
// SUBSCRIPTION PLANS - INTERFACE DES PLANS D'ABONNEMENT ECODELI
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, ChevronDown, Check, X, CreditCard, RefreshCw } from 'lucide-react'
import LanguageSelector from '@/components/language-selector'
import { useToast } from '@/hooks/use-toast'

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface SubscriptionPlan {
  type: string
  monthly_price: number
  features: {
    max_packages_per_month: number
    insurance_coverage: number
    priority_support: boolean
  }
}

interface UserSubscription {
  id: number
  subscriptionType: 'free' | 'starter' | 'premium'
  monthly_price: number
  startDate: string
  endDate: string | null
  status: 'active' | 'expired' | 'cancelled'
  is_active: boolean
  is_expired: boolean
  features: {
    max_packages_per_month: number
    insurance_coverage: number
    priority_support: boolean
  }
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function SubscriptionPlans() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch user data and subscription info
  useEffect(() => {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
    if (!token) {
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        // Get user info
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (userRes.ok) {
          const userData = await userRes.json()
          setUserId(userData.id)
          setUserName(userData.firstName)

          const subRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/user/${userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (subRes.ok) {
            const subData = await subRes.json()
            setCurrentSubscription(subData.subscription)
          }
        }

        const plansRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/plans`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (plansRes.ok) {
          const plansData = await plansRes.json()
          setAvailablePlans(plansData.plans)
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleStripeCheckout = async (planType: string) => {
    if (!userId || isUpdating || planType === 'free') return

    setIsUpdating(true)
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stripe/subscribe`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planType: planType,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.checkout_url) {
          // Rediriger vers Stripe Checkout
          window.location.href = data.checkout_url
        } else {
          throw new Error('URL de checkout non retournée')
        }
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de la session de paiement',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsUpdating(true)
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stripe/customer-portal`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.portal_url) {
          window.location.href = data.portal_url
        }
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir le portail de gestion',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

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
                <span className="hidden sm:inline">{userName}</span>
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

        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Choisissez votre plan EcoDeli</h1>
          <p className="text-gray-600 mb-8">Des options flexibles pour tous vos besoins de livraison</p>

          {/* Available Plans */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-6">Plans disponibles</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => {
                const isCurrentPlan = currentSubscription?.subscriptionType === plan.type
                const isPopular = plan.type === 'premium'
                
                return (
                  <div
                    key={plan.type}
                    className={`border-2 rounded-lg p-6 relative ${
                      isCurrentPlan
                        ? 'border-green-500 bg-green-50'
                        : isPopular
                        ? 'border-green-400 bg-white shadow-lg'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Plus populaire
                        </span>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="text-center mb-2">
                        <span className="inline-block bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          Plan actuel
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h3 className={`text-xl font-semibold capitalize mt-2 ${
                        isCurrentPlan ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {plan.type}
                      </h3>
                      <div className={`text-2xl font-bold mt-2 ${
                        isCurrentPlan ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {plan.monthly_price === 0 ? 'Gratuit' : `${plan.monthly_price}€`}
                      </div>
                      {plan.monthly_price > 0 && (
                        <div className={`text-sm ${
                          isCurrentPlan ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          par mois
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        {plan.features.max_packages_per_month < 0
                          ? 'Colis illimités'
                          : `${plan.features.max_packages_per_month} colis/mois`}
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Assurance jusqu'à {plan.features.insurance_coverage}€
                      </li>
                      <li className="flex items-center text-sm">
                        {plan.features.priority_support ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        Support prioritaire
                      </li>
                    </ul>

                    {isCurrentPlan ? (
                      <button
                        onClick={handleManageSubscription}
                        disabled={isUpdating}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2 inline" />
                        )}
                        Gérer mon abonnement
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStripeCheckout(plan.type)}
                        disabled={isUpdating || plan.type === 'free'}
                        className={`w-full py-2 px-4 rounded-md transition-colors disabled:opacity-50 ${
                          plan.type === 'free'
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isUpdating ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                        ) : plan.type === 'free' ? (
                          'Plan de base'
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2 inline" />
                            Souscrire
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-6">Questions fréquentes</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Comment fonctionne l'assurance ?</h3>
                <p className="text-gray-600 text-sm">
                  L'assurance couvre la valeur déclarée de vos colis en cas de perte ou de dommage, 
                  jusqu'à la limite de votre plan.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
                <p className="text-gray-600 text-sm">
                  Oui, vous pouvez upgrader ou downgrader votre plan à tout moment via le portail Stripe. 
                  Les changements prennent effet immédiatement.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Comment annuler mon abonnement ?</h3>
                <p className="text-gray-600 text-sm">
                  Vous pouvez annuler votre abonnement à tout moment via le bouton "Gérer mon abonnement" 
                  qui vous redirigera vers le portail Stripe sécurisé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 