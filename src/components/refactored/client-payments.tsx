"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Star, CreditCard, Shield, Info } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/src/hooks/use-auth'
import { ClientLayout } from '@/src/components/layouts'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { useToast } from '@/hooks/use-toast'

// =============================================================================
// TYPES POUR LES PAIEMENTS
// =============================================================================

interface DeliveryItem {
  id: string
  image?: string
  name: string
  destination?: string
  price: number
  amount?: number
  deliveryDate?: string
  status: "paid" | "unpaid"
  rating: number
  annonce_id?: number
  livreur_id?: number
}

interface ServiceItem {
  id: string
  image?: string
  name: string
  provider?: string
  price: number
  serviceDate?: string
  status: "paid" | "unpaid"
  rating: number
  service_id?: number
  prestataire_id?: number
}

type PaymentFilter = "all" | "unpaid" | "paid"

// =============================================================================
// HOOK PERSONNALISÉ POUR LES PAIEMENTS
// =============================================================================

function usePayments() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<PaymentFilter>("all")

  const loadUserPayments = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")
      
      // Charger les livraisons du client
      const userDeliveries = await apiClient.getClientDeliveries(user.id.toString())
      
      // Transformer les données backend en format attendu par le frontend
      const transformedDeliveries: DeliveryItem[] = userDeliveries.map((delivery: any) => ({
        id: delivery.id.toString(),
        image: delivery.colis?.image_path,
        name: delivery.colis?.content_description || delivery.annonce?.title || "Livraison",
        destination: delivery.dropoff_location || delivery.annonce?.destination_address,
        price: delivery.annonce?.price || 0,
        amount: 1,
        deliveryDate: delivery.scheduled_delivery_date || delivery.created_at,
        status: delivery.payment_status || "unpaid",
        rating: delivery.rating || 0,
        annonce_id: delivery.annonce_id,
        livreur_id: delivery.livreur_id
      }))

      setDeliveries(transformedDeliveries)
      setServices([]) // TODO: Implémenter les services

    } catch (error) {
      console.error("Error loading payments:", error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUserPayments()
  }, [loadUserPayments])

  const filteredDeliveries = deliveries.filter((item) => {
    if (activeTab === "all") return true
    return item.status === activeTab
  })

  const filteredServices = services.filter((item) => {
    if (activeTab === "all") return true
    return item.status === activeTab
  })

  const processPayment = useCallback(async (type: "delivery" | "service", id: string, amount: number) => {
    try {
      // Créer un payment intent Stripe avec les nouvelles routes API
      const paymentIntent = await apiClient.createDeliveryPayment({
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        annonce_id: parseInt(id),
        description: `Paiement ${type} #${id}`
      })

      console.log('🏦 Payment Intent créé:', paymentIntent)
      
      // Simuler le paiement réussi après 2 secondes (en attendant l'intégration Stripe Elements)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mettre à jour le statut local
      if (type === "delivery") {
        setDeliveries(prev => 
          prev.map(item => 
            item.id === id ? { ...item, status: "paid" as const } : item
          )
        )
      } else {
        setServices(prev => 
          prev.map(item => 
            item.id === id ? { ...item, status: "paid" as const } : item
          )
        )
      }

      return { success: true }

    } catch (error) {
      console.error("Payment error:", error)
      throw new Error(getErrorMessage(error))
    }
  }, [user])

  const submitRating = useCallback(async (type: "delivery" | "service", id: string, rating: number) => {
    try {
      // TODO: Intégrer avec l'API de notation
      if (type === "delivery") {
        setDeliveries(prev => 
          prev.map(item => 
            item.id === id ? { ...item, rating } : item
          )
        )
      } else {
        setServices(prev => 
          prev.map(item => 
            item.id === id ? { ...item, rating } : item
          )
        )
      }

      return { success: true }

    } catch (error) {
      console.error("Rating error:", error)
      throw new Error(getErrorMessage(error))
    }
  }, [])

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "Date non disponible"
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long", 
        year: "numeric"
      })
    } catch {
      return dateString
    }
  }, [])

  const formatPrice = useCallback((price: number) => {
    return `€${price.toFixed(2)}`
  }, [])

  return {
    deliveries: filteredDeliveries,
    services: filteredServices,
    loading,
    error,
    activeTab,
    setActiveTab,
    processPayment,
    submitRating,
    formatDate,
    formatPrice,
    refreshData: loadUserPayments
  }
}

// =============================================================================
// HOOK POUR LES MODALES
// =============================================================================

function usePaymentModal() {
  const [paymentModal, setPaymentModal] = useState<string | null>(null)
  const [ratingModal, setRatingModal] = useState<string | null>(null)
  const [tempRating, setTempRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const openPaymentModal = (type: "delivery" | "service", id: string) => {
    setPaymentModal(`${type}-${id}`)
  }

  const closePaymentModal = () => {
    setPaymentModal(null)
  }

  const openRatingModal = (type: "delivery" | "service", id: string) => {
    setRatingModal(`${type}-${id}`)
    setTempRating(0)
    setHoveredRating(0)
  }

  const closeRatingModal = () => {
    setRatingModal(null)
    setTempRating(0)
    setHoveredRating(0)
  }

  return {
    paymentModal,
    ratingModal,
    tempRating,
    hoveredRating,
    setTempRating,
    setHoveredRating,
    openPaymentModal,
    closePaymentModal,
    openRatingModal,
    closeRatingModal
  }
}

// =============================================================================
// COMPOSANT DE FILTRES PAR ONGLETS
// =============================================================================

interface TabsFilterProps {
  activeTab: PaymentFilter
  onTabChange: (tab: PaymentFilter) => void
  t: (key: string) => string
}

function TabsFilter({ activeTab, onTabChange, t }: TabsFilterProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onTabChange("all")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "all" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          {t("common.all")}
        </button>
        <button
          onClick={() => onTabChange("unpaid")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "unpaid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          {t("payments.unpaid")}
        </button>
        <button
          onClick={() => onTabChange("paid")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "paid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          {t("payments.paid")}
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT ÉTOILES DE NOTATION
// =============================================================================

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  onHover?: (rating: number) => void
  onLeave?: () => void
  hoveredRating?: number
}

function StarRating({ 
  rating, 
  maxStars = 5, 
  size = "md", 
  interactive = false, 
  onRatingChange,
  onHover,
  onLeave,
  hoveredRating
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const displayRating = hoveredRating || rating

  return (
    <div className="flex space-x-1">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= displayRating

        return (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              isFilled ? "text-yellow-400 fill-current" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive ? () => onRatingChange?.(starValue) : undefined}
            onMouseEnter={interactive ? () => onHover?.(starValue) : undefined}
            onMouseLeave={interactive ? onLeave : undefined}
          />
        )
      })}
    </div>
  )
}

// =============================================================================
// COMPOSANT TABLE DES LIVRAISONS
// =============================================================================

interface DeliveriesTableProps {
  deliveries: DeliveryItem[]
  onPayment: (id: string) => void
  onRating: (id: string) => void
  onValidate: (id: string) => void
  formatDate: (date?: string) => string
  formatPrice: (price: number) => string
  t: (key: string) => string
}

function DeliveriesTable({ deliveries, onPayment, onRating, onValidate, formatDate, formatPrice, t }: DeliveriesTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4">{t("payments.deliveryMan")}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.image")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.announceName")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.whereTo")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.price")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.amount")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.deliveryDate")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.rateDelivery")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.status")}</th>
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">{t("payments.action")}</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length > 0 ? (
                deliveries.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="w-12 h-12 bg-green-100 rounded-md overflow-hidden">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium">{item.name}</td>
                    <td className="py-3 px-2 text-gray-600">{item.destination || t("payments.noDestination")}</td>
                    <td className="py-3 px-2 font-medium">{formatPrice(item.price)}</td>
                    <td className="py-3 px-2 text-center">{item.amount || 1}</td>
                    <td className="py-3 px-2">{formatDate(item.deliveryDate)}</td>
                    <td className="py-3 px-2">
                      {item.status === "paid" ? (
                        item.rating > 0 ? (
                          <StarRating rating={item.rating} />
                        ) : (
                          <button
                            onClick={() => onRating(item.id)}
                            className="text-sm text-green-500 hover:underline"
                          >
                            {t("payments.rateNow")}
                          </button>
                        )
                      ) : (
                        <span className="text-sm text-gray-400">{t("payments.payFirstToRate")}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status === "paid" ? t("payments.paid") : t("payments.unpaid")}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {item.status === "unpaid" && (
                        <button
                          onClick={() => onPayment(item.id)}
                          className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {t("payments.payNow")}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {item.status === "paid" && (
                        <button
                          onClick={() => onValidate(item.id)}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {t("payments.validate")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">
                    {t("payments.noDeliveriesFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MODAL DE NOTATION
// =============================================================================

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number) => void
  item: DeliveryItem | ServiceItem | undefined
  tempRating: number
  hoveredRating: number
  onRatingChange: (rating: number) => void
  onRatingHover: (rating: number) => void
  onRatingLeave: () => void
  t: (key: string) => string
}

function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  tempRating,
  hoveredRating,
  onRatingChange,
  onRatingHover,
  onRatingLeave,
  t
}: RatingModalProps) {
  if (!isOpen || !item) return null

  const handleSubmit = () => {
    if (tempRating > 0) {
      onSubmit(tempRating)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{t("payments.rateService")}</h3>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">Comment évaluez-vous ce service ?</p>
          <p className="font-medium">{item.name}</p>
        </div>

        <div className="flex justify-center mb-6">
          <StarRating
            rating={tempRating}
            hoveredRating={hoveredRating}
            size="lg"
            interactive
            onRatingChange={onRatingChange}
            onHover={onRatingHover}
            onLeave={onRatingLeave}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={tempRating === 0}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT MODAL VALIDATION CODE
// =============================================================================

interface CodeValidationModalProps {
  isOpen: boolean
  onClose: () => void
  onValidate: (code: string) => Promise<void>
  deliveryId: string
  t: (key: string) => string
}

function CodeValidationModal({ isOpen, onClose, onValidate, deliveryId, t }: CodeValidationModalProps) {
  const [code, setCode] = useState('')
  const [validating, setValidating] = useState(false)

  const handleValidate = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un code à 6 chiffres',
        variant: 'destructive',
      })
      return
    }

    try {
      setValidating(true)
      await onValidate(code)
      onClose()
      setCode('')
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setValidating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-semibold mb-4">Validation de la livraison</h3>

        <div className="mb-6">
          <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-center text-gray-600 mb-6">
            Pour confirmer la réception de votre colis, veuillez entrer le code de validation
            fourni par le livreur.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code de validation (6 chiffres)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                Une fois validé, les fonds seront automatiquement libérés au livreur.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={validating}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleValidate}
            disabled={validating || code.length !== 6}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center"
          >
            {validating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            Valider la livraison
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function ClientPayments() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const payments = usePayments()
  const modals = usePaymentModal()
  
  // Ajouter l'état pour le modal de validation
  const [codeValidationModal, setCodeValidationModal] = useState<string | null>(null)

  const handlePayment = async (id: string) => {
    const item = payments.deliveries.find(d => d.id === id)
    if (item) {
      try {
        // Utiliser createLivraisonPayment au lieu de processPayment
        const response = await apiClient.createLivraisonPayment({
          amount: Math.round(item.price * 100), // Stripe utilise les centimes
          livraison_id: parseInt(id),
          description: `Paiement pour ${item.name}`
        })
        
        if (response.success && response.client_secret) {
          // TODO: Intégrer Stripe Elements ici
          toast({
            title: 'Paiement initié',
            description: 'Le paiement est en attente. Il sera capturé après validation de la livraison.',
          })
          
          // Actualiser la liste
          await payments.refreshData()
        }
      } catch (error) {
        toast({
          title: 'Erreur',
          description: getErrorMessage(error),
          variant: 'destructive',
        })
      }
    }
  }

  const handleRating = async (rating: number) => {
    if (modals.ratingModal) {
      const [type, id] = modals.ratingModal.split('-') as ['delivery' | 'service', string]
      await payments.submitRating(type, id, rating)
    }
  }

  const handleCodeValidation = async (code: string) => {
    if (!codeValidationModal) return

    try {
      // Appeler l'API de validation avec le code
      const response = await apiClient.post('/codes-temporaire/validate-delivery', {
        user_info: `delivery-${codeValidationModal}`,
        code: code,
        livraison_id: parseInt(codeValidationModal)
      })

      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Livraison validée ! Les fonds ont été libérés au livreur.',
        })
        
        // Rafraîchir les données
        await payments.refreshData()
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Code invalide ou livraison introuvable',
        variant: 'destructive',
      })
      throw error
    }
  }

  const getModalItem = (modalId: string | null) => {
    if (!modalId) return undefined
    const [type, id] = modalId.split('-')
    return type === 'delivery' 
      ? payments.deliveries.find(item => item.id === id)
      : payments.services.find(item => item.id === id)
  }

  if (payments.loading) {
    return (
      <ClientLayout activeRoute="payments">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-500">{t("common.loading")}</p>
          </div>
        </main>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout activeRoute="payments">
      <main className="container mx-auto px-4 py-8">
        {payments.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {payments.error}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-semibold text-center text-green-400 mb-8">
          {t("payments.yourPayments")}
        </h1>

        <TabsFilter 
          activeTab={payments.activeTab}
          onTabChange={payments.setActiveTab}
          t={t}
        />

        <DeliveriesTable
          deliveries={payments.deliveries}
          onPayment={(id) => modals.openPaymentModal('delivery', id)}
          onRating={(id) => modals.openRatingModal('delivery', id)}
          onValidate={(id) => setCodeValidationModal(id)}
          formatDate={payments.formatDate}
          formatPrice={payments.formatPrice}
          t={t}
        />

        <RatingModal
          isOpen={!!modals.ratingModal}
          onClose={modals.closeRatingModal}
          onSubmit={handleRating}
          item={getModalItem(modals.ratingModal)}
          tempRating={modals.tempRating}
          hoveredRating={modals.hoveredRating}
          onRatingChange={modals.setTempRating}
          onRatingHover={modals.setHoveredRating}
          onRatingLeave={() => modals.setHoveredRating(0)}
          t={t}
        />

        <CodeValidationModal
          isOpen={!!codeValidationModal}
          onClose={() => setCodeValidationModal(null)}
          onValidate={handleCodeValidation}
          deliveryId={codeValidationModal || ''}
          t={t}
        />
      </main>
    </ClientLayout>
  )
} 