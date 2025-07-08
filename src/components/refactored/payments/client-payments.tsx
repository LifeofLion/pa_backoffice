"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Star, CreditCard, Shield, Info, Download, Package, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/src/hooks/use-auth'
import { ClientLayout } from '@/src/components/layouts'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { useToast } from '@/hooks/use-toast'

// Configuration Stripe simple
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  status: "paid" | "unpaid" | "authorized"
  rating: number
  annonce_id?: number
  livreur_id?: number
}

interface ServiceItem {
  id: string
  image?: string
  name: string
  provider: string
  price: number
  date?: string
  rating: number
  status: "paid" | "unpaid" | "authorized"
  prestataire_id?: number
  client_id?: number
}

type PaymentFilter = "all" | "unpaid" | "paid" | "authorized"

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Mappe les statuts de paiement du backend vers le frontend
 * Priorité : statut de livraison > payment_status > payment_intent_id
 */
function mapPaymentStatus(delivery: any): "paid" | "unpaid" | "authorized" {
  // 🔧 PRIORITÉ 1: Si la livraison est terminée, c'est forcément payé et validé
  if (delivery.status === 'completed') {
    console.log(`🔧 Delivery ${delivery.id}: status='completed' → mapped to 'paid'`)
    return 'paid'
  }
  
  // 🔧 PRIORITÉ 2: Vérifier le payment_status explicite
  if (delivery.payment_status === 'paid') {
    console.log(`🔧 Delivery ${delivery.id}: payment_status='paid' → mapped to 'paid'`)
    return 'paid'
  }
  if (delivery.payment_status === 'pending') {
    console.log(`🔧 Delivery ${delivery.id}: payment_status='pending' + status='${delivery.status}' → mapped to 'authorized'`)
    return 'authorized'
  }
  
  // 🔧 PRIORITÉ 3: Vérifier le paymentStatus (camelCase)
  if (delivery.paymentStatus === 'paid') {
    console.log(`🔧 Delivery ${delivery.id}: paymentStatus='paid' → mapped to 'paid'`)
    return 'paid'
  }
  if (delivery.paymentStatus === 'pending') {
    console.log(`🔧 Delivery ${delivery.id}: paymentStatus='pending' + status='${delivery.status}' → mapped to 'authorized'`)
    return 'authorized'
  }
  
  // 🔧 PRIORITÉ 4: Si payment_intent_id existe, c'est au moins autorisé
  if (delivery.payment_intent_id || delivery.paymentIntentId) {
    console.log(`🔧 Delivery ${delivery.id}: has payment_intent_id → mapped to 'authorized'`)
    return 'authorized'
  }
  
  // 🔧 DÉFAUT: Non payé
  console.log(`🔧 Delivery ${delivery.id}: no payment indicators → mapped to 'unpaid'`)
  return 'unpaid'
}

// =============================================================================
// HOOK PERSONNALISÉ POUR LES PAIEMENTS
// =============================================================================

function usePayments() {
  const { user } = useAuth()
  const { toast } = useToast()
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
      
      // Debug: Afficher la structure de l'utilisateur
      console.log('🔍 User object in payments:', user)
      console.log('🔍 User client relation:', user.client)
      console.log('🔍 User ID:', user.id)
      
      // Vérifier que l'utilisateur a une relation client
      if (!user.client?.id) {
        console.error('❌ Utilisateur sans relation client:', { user })
        // Fallback: essayer avec l'ID utilisateur directement
        console.log('🔄 Tentative avec l\'ID utilisateur:', user.id)
        
        try {
          const userDeliveries = await apiClient.getClientDeliveries(user.id.toString())
          console.log('📦 Received deliveries with user ID:', userDeliveries)
          
          // Si ça marche, continuer avec cette approche
          const transformedDeliveries: DeliveryItem[] = userDeliveries.map((delivery: any) => ({
            id: delivery.id.toString(),
            image: delivery.colis?.[0]?.image_path,
            name: delivery.colis?.[0]?.content_description || delivery.annonce?.title || "Livraison",
            destination: delivery.dropoff_location || delivery.annonce?.destination_address,
            price: delivery.price || delivery.annonce?.price || 0,
            amount: 1,
            deliveryDate: delivery.scheduled_delivery_date || delivery.created_at,
            status: mapPaymentStatus(delivery),
            rating: delivery.rating || 0,
            annonce_id: delivery.annonce_id,
            livreur_id: delivery.livreur_id
          }))

          console.log('✅ Transformed deliveries (fallback):', transformedDeliveries)
          setDeliveries(transformedDeliveries)
          setServices([])
          return
        } catch (fallbackError) {
          console.error('❌ Erreur avec fallback:', fallbackError)
          throw new Error("Utilisateur non identifié comme client et aucune livraison trouvée")
        }
      }
      
      console.log('✅ Using client ID:', user.client.id)
      
      // Charger les livraisons du client en utilisant l'ID du client, pas l'ID utilisateur
      const userDeliveries = await apiClient.getClientDeliveries(user.client.id.toString())
      
      console.log('📦 Received deliveries:', userDeliveries)
      console.log('📦 First delivery structure:', userDeliveries[0] ? JSON.stringify(userDeliveries[0], null, 2) : 'No deliveries')
      
      // Transformer les données backend en format attendu par le frontend
      const transformedDeliveries: DeliveryItem[] = await Promise.all(
        userDeliveries.map(async (delivery: any) => {
          console.log('🔍 Processing delivery:', {
            id: delivery.id,
            payment_status: delivery.payment_status,
            paymentStatus: delivery.paymentStatus,
            payment_intent_id: delivery.payment_intent_id,
            paymentIntentId: delivery.paymentIntentId,
            status: delivery.status,
            price: delivery.price
          })
          
          // 🔧 CORRECTION : Utiliser la fonction de mapping centralisée
          const paymentStatus = mapPaymentStatus(delivery)
          
          // 🌟 NOUVEAU: Vérifier si l'utilisateur a déjà évalué cette livraison
          let userRating = 0
          if (delivery.livreurId && (paymentStatus === 'paid' || paymentStatus === 'authorized')) {
            try {
              console.log(`🔍 Vérification rating pour livraison ${delivery.id}...`)
              const checkResponse = await apiClient.checkUserRating('delivery', delivery.id.toString())
              console.log(`📊 Réponse API check rating:`, checkResponse)
              
              if (checkResponse.success && checkResponse.has_rated && checkResponse.rating) {
                userRating = checkResponse.rating.overall_rating || 0
                console.log(`✅ Rating existant trouvé pour livraison ${delivery.id}:`, userRating)
              } else {
                console.log(`ℹ️ Aucun rating de l'utilisateur pour livraison ${delivery.id}`)
              }
            } catch (error) {
              console.log('ℹ️ Erreur ou pas de rating existant pour livraison', delivery.id, error)
            }
          }
          
          console.log('✅ Final payment status for delivery', delivery.id, ':', paymentStatus, '(delivery status:', delivery.status, ')')
          
          return {
            id: delivery.id.toString(),
            image: delivery.colis?.[0]?.annonce?.imagePath || delivery.colis?.[0]?.image_path,
            name: delivery.colis?.[0]?.annonce?.title || delivery.colis?.[0]?.contentDescription || `Livraison #${delivery.id}`,
            destination: delivery.dropoffLocation || delivery.colis?.[0]?.annonce?.endLocation,
            price: parseFloat(delivery.price || delivery.colis?.[0]?.annonce?.price || 0),
            amount: delivery.colis?.length || 1,
            deliveryDate: delivery.createdAt,
            status: paymentStatus,
            rating: userRating, // 🌟 Rating réel de l'utilisateur
            annonce_id: delivery.annonceId,
            livreur_id: delivery.livreurId,
          }
        })
      )

      console.log('✅ Transformed deliveries:', transformedDeliveries)
      
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

  const submitRating = useCallback(async (type: "delivery" | "service", id: string, rating: number, detailedRating?: any) => {
    try {
      console.log('🌟 Soumission de rating:', { type, id, rating, detailedRating })

      // Récupérer l'item pour obtenir l'ID du livreur/prestataire
      const item = type === "delivery" 
        ? deliveries.find(d => d.id === id)
        : services.find(s => s.id === id)

      if (!item) {
        throw new Error('Élément introuvable')
      }

      // Déterminer l'ID de l'utilisateur évalué
      const reviewedId = type === "delivery" 
        ? (item as DeliveryItem).livreur_id
        : (item as ServiceItem).prestataire_id

      if (!reviewedId) {
        throw new Error('Impossible de déterminer qui évaluer')
      }

      // Préparer les données de rating
      const ratingPayload = {
        reviewed_id: reviewedId,
        rating_type: type,
        rating_for_id: parseInt(id),
        overall_rating: rating,
        // Ajouter les ratings détaillés si fournis
        punctuality_rating: detailedRating?.punctuality_rating || null,
        quality_rating: detailedRating?.quality_rating || null,
        communication_rating: detailedRating?.communication_rating || null,
        comment: detailedRating?.comment || `Évaluation ${rating}/5 étoiles`,
      }

      console.log('📤 Payload envoyé:', ratingPayload)

      // Créer l'évaluation via l'API
      const response = await apiClient.post<{
        success: boolean
        message: string
        rating: any
      }>('/ratings', ratingPayload)

      if (response.success) {
        console.log('✅ Rating créé avec succès:', response.rating)
        
        // Mettre à jour l'état local immédiatement
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

        // Afficher un message de succès détaillé
        const ratingText = detailedRating?.comment 
          ? `${rating}/5 étoiles avec commentaire`
          : `${rating}/5 étoiles`
          
        toast({
          title: '⭐ Évaluation publiée !',
          description: `Votre note de ${ratingText} a été enregistrée avec succès. Merci pour votre retour !`,
        })
        
        // 🔄 Recharger les données pour s'assurer de la cohérence
        setTimeout(() => {
          loadUserPayments()
        }, 1000)
        
        return { success: true }
      } else {
        throw new Error(response.message || 'Erreur lors de la création de l\'évaluation')
      }

    } catch (error: any) {
      console.error("❌ Erreur rating:", error)
      
      // Gestion spécifique de l'erreur "déjà évalué"
      const errorMessage = getErrorMessage(error)
      
      if (errorMessage.includes('déjà évalué') || errorMessage.includes('already rated')) {
        toast({
          title: '⚠️ Évaluation déjà existante',
          description: 'Vous avez déjà évalué cette livraison. Vos données vont être actualisées.',
          variant: 'default',
        })
        
        // Recharger les données pour afficher le rating existant
        setTimeout(() => {
          loadUserPayments()
        }, 500)
        
        return { success: false, reason: 'already_rated' }
      } else {
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
        throw new Error(errorMessage)
      }
    }
  }, [deliveries, services, toast])

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

  const formatPrice = useCallback((price: number | string | null | undefined) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price || 0))
    return `€${(isNaN(numPrice) ? 0 : numPrice).toFixed(2)}`
  }, [])

  const processPayment = useCallback(async (type: "delivery" | "service", id: string, amount: number) => {
    try {
      let paymentIntent: any

      if (type === "delivery") {
        // Utiliser la méthode spécifique pour les livraisons avec l'ID de livraison
        paymentIntent = await apiClient.createDeliveryPayment({
          amount: Math.round(amount * 100), // Stripe utilise les centimes
          annonce_id: parseInt(id), // ID de la livraison
          description: `Paiement livraison #${id}`
        })
      } else {
        // Utiliser la méthode spécifique pour les services
        paymentIntent = await apiClient.createServicePayment({
          amount: Math.round(amount * 100), // Stripe utilise les centimes
          service_id: parseInt(id),
          description: `Paiement service #${id}`
        })
      }

      console.log('🏦 Payment Intent créé:', paymentIntent)
      
      // 🚨 TODO: Intégrer Stripe Elements ici pour la vraie saisie de carte
      // Pour l'instant, simuler le paiement réussi
      console.log('⚠️ SIMULATION: En production, rediriger vers Stripe Elements')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mettre à jour le statut local (sera remplacé par webhook Stripe)
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
// HOOK PERSONNALISÉ POUR LES MODALES
// =============================================================================

function usePaymentModal() {
  const [paymentModal, setPaymentModal] = useState<string | null>(null)
  const [ratingModal, setRatingModal] = useState<string | null>(null)
  const [tempRating, setTempRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)

  const openPaymentModal = useCallback((type: 'delivery' | 'service', id: string) => {
    setPaymentModal(`${type}-${id}`)
  }, [])

  const closePaymentModal = useCallback(() => {
    setPaymentModal(null)
  }, [])

  const openRatingModal = useCallback((type: 'delivery' | 'service', id: string) => {
    setRatingModal(`${type}-${id}`)
    setTempRating(0)
    setHoveredRating(0)
  }, [])

  const closeRatingModal = useCallback(() => {
    setRatingModal(null)
    setTempRating(0)
    setHoveredRating(0)
  }, [])

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
// COMPOSANT DE NOTATION ÉTOILES
// =============================================================================

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  onHover?: (rating: number) => void
  onLeave?: () => void
  interactive?: boolean
  hoveredRating?: number
  tempRating?: number
}

function StarRating({ 
  rating, 
  onRatingChange, 
  onHover, 
  onLeave, 
  interactive = false,
  hoveredRating = 0,
  tempRating = 0
}: StarRatingProps) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange?.(star)}
          onMouseEnter={() => interactive && onHover?.(star)}
          onMouseLeave={() => interactive && onLeave?.()}
          className={`${interactive ? "cursor-pointer" : ""}`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (interactive ? hoveredRating || tempRating : rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
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
          onClick={() => onTabChange("authorized")}
          className={`px-4 py-2 text-sm rounded-md ${
            activeTab === "authorized" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          Autorisé
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
// COMPOSANT TABLE DES LIVRAISONS
// =============================================================================

interface DeliveriesTableProps {
  deliveries: DeliveryItem[]
  onPayment: (id: string) => void
  onRating: (id: string) => void
  onValidate: (id: string) => void
  onDownloadInvoice: (id: string) => void
  formatDate: (date?: string) => string
  formatPrice: (price: number) => string
  t: (key: string) => string
}

function DeliveriesTable({ deliveries, onPayment, onRating, onValidate, onDownloadInvoice, formatDate, formatPrice, t }: DeliveriesTableProps) {
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
                <th className="py-3 px-2 text-left text-sm font-medium text-gray-500">Facture</th>
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
                      {(item.status === "paid" || item.status === "authorized") ? (
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
                          item.status === "paid" 
                            ? "bg-green-100 text-green-800" 
                            : item.status === "authorized"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status === "paid" 
                          ? "✅ Terminé" 
                          : item.status === "authorized"
                          ? "🔒 Payé - En attente validation"
                          : "⏳ En attente de paiement"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {item.status === "paid" ? (
                        <button 
                          onClick={() => onDownloadInvoice(item.id)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Après validation</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {item.status === "unpaid" && (
                        <button
                          onClick={() => onPayment(item.id)}
                          className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Payer maintenant
                        </button>
                      )}
                      {item.status === "authorized" && (
                        <button
                          onClick={() => onValidate(item.id)}
                          className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Valider réception
                        </button>
                      )}
                      {item.status === "paid" && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Terminé
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-gray-500">
                        <p className="font-medium mb-1">Aucune livraison en cours</p>
                        <p className="text-sm">Vos livraisons et paiements apparaîtront ici.</p>
                      </div>
                      <div className="text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-md p-3 max-w-md">
                        <p className="font-medium text-yellow-800">💡 Pour tester le système de paiement :</p>
                        <p className="text-yellow-700 mt-1">
                          1. Créez une annonce de livraison<br/>
                          2. Un livreur doit l'accepter<br/>
                          3. La livraison apparaîtra ici pour paiement
                        </p>
                      </div>
                    </div>
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
// COMPOSANT FORMULAIRE STRIPE INTÉGRÉ
// =============================================================================

interface StripePaymentFormProps {
  clientSecret: string
  onSuccess: () => void
  onError: (error: string) => void
  formatPrice: (price: number) => string
  amount: number
}

function StripePaymentForm({ clientSecret, onSuccess, onError, formatPrice, amount }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

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

    setProcessing(true)
    onError('')

    try {
      // Confirmer le paiement avec Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (stripeError) {
        onError(stripeError.message || 'Erreur de paiement')
        return
      }

      if (paymentIntent && paymentIntent.status === 'requires_capture') {
        toast({
          title: 'Paiement autorisé',
          description: 'Votre paiement est sécurisé et sera capturé après validation de la livraison.',
        })
        onSuccess()
      } else {
        onError('Statut de paiement inattendu: ' + paymentIntent?.status)
      }

    } catch (err: any) {
      onError(err.message || 'Erreur lors du paiement')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Informations de carte
        </label>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  fontFamily: 'system-ui, sans-serif',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
                invalid: {
                  color: '#EF4444',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <span className="font-bold text-lg">
          Total : {formatPrice(amount)}
        </span>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {processing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
          {processing ? 'Traitement...' : 'Payer maintenant'}
        </button>
      </div>
    </form>
  )
}

// =============================================================================
// COMPOSANT MODAL DE PAIEMENT AVEC STRIPE ELEMENTS
// =============================================================================

interface StripePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  item: DeliveryItem | ServiceItem | undefined
  formatPrice: (price: number) => string
  t: (key: string) => string
  onSuccess: () => void
}

function StripePaymentModal({ isOpen, onClose, item, formatPrice, t, onSuccess }: StripePaymentModalProps) {
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Créer le Payment Intent quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && item) {
      createPaymentIntent()
    }
  }, [isOpen, item])

  const createPaymentIntent = async () => {
    if (!item) return

    try {
      setError(null)
      // Créer le Payment Intent avec escrow (capture manuelle)
      const response = await apiClient.createLivraisonPayment({
        amount: Math.round(item.price * 100), // Stripe utilise les centimes
        livraison_id: parseInt(item.id),
        description: `Paiement pour ${item.name}`
      })
      
      if (response && response.success && response.client_secret) {
        setClientSecret(response.client_secret)
      } else {
        throw new Error('Impossible de créer le paiement')
      }
    } catch (error) {
      console.error('Erreur création Payment Intent:', error)
      setError(getErrorMessage(error))
    }
  }

  const handlePaymentSubmit = async () => {
    if (!clientSecret) {
      setError('Pas de secret client disponible')
      return
    }

    // Ce bouton ne fait que déclencher l'événement - le vrai paiement se fait via Stripe Elements
    toast({
      title: 'Information',
      description: 'Veuillez remplir les informations de carte ci-dessus et appuyer sur Entrée pour payer.',
    })
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Paiement sécurisé</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Système Anti-Arnaque */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Protection Anti-Arnaque</strong>
              <p className="mt-1">
                Votre paiement sera sécurisé et libéré uniquement après validation 
                de la livraison avec un code.
              </p>
            </div>
          </div>
        </div>

        {/* Détails du paiement */}
        <div className="mb-6">
          <div className="border rounded-md p-4">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-md overflow-hidden mr-3">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <p className="font-medium">{item.name}</p>
                                 <p className="text-sm text-gray-600">
                   {'destination' in item ? (item as DeliveryItem).destination : (item as ServiceItem).provider || 'Destination'}
                 </p>
              </div>
            </div>
            
            <div className="border-t pt-3">
            <div className="flex justify-between mb-2">
                <span className="text-gray-600">Montant :</span>
              <span className="font-medium">{formatPrice(item.price)}</span>
            </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Frais de service :</span>
                <span className="font-medium">Inclus</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total :</span>
                <span className="text-green-600">{formatPrice(item.price)}</span>
              </div>
            </div>
            </div>
          </div>

        {/* Zone de paiement */}
        <div className="mb-6">
          {!clientSecret ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Préparation du paiement...</p>
            </div>
          ) : (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-4">
              <div className="h-10 w-16 bg-blue-600 rounded-md mr-3 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                  <p className="font-medium">Paiement par carte</p>
                  <p className="text-sm text-gray-500">Sécurisé par Stripe</p>
              </div>
            </div>

              {/* Stripe Elements intégré */}
              <Elements stripe={stripePromise}>
                <StripePaymentForm 
                  clientSecret={clientSecret}
                  onSuccess={onSuccess}
                  onError={setError}
                  formatPrice={formatPrice}
                  amount={item.price}
                />
              </Elements>
              
              <p className="text-xs text-gray-500 mt-3">
                🔒 Paiement sécurisé par Stripe
              </p>
          </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handlePaymentSubmit}
            disabled={processing || !clientSecret}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
          >
            {processing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            {processing ? 'Traitement...' : `Payer ${formatPrice(item.price)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT MODAL DE NOTATION
// =============================================================================

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, detailedRating?: any) => Promise<void>
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
  const [submitting, setSubmitting] = useState(false)
  const [punctualityRating, setPunctualityRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showDetailedRating, setShowDetailedRating] = useState(false)

  const handleSubmit = async () => {
    if (tempRating === 0) return

    try {
      setSubmitting(true)
      
      // Créer l'objet de rating détaillé
      const ratingData = {
        overall_rating: tempRating,
        punctuality_rating: showDetailedRating ? punctualityRating : undefined,
        quality_rating: showDetailedRating ? qualityRating : undefined,
        communication_rating: showDetailedRating ? communicationRating : undefined,
        comment: comment.trim() || undefined,
      }

      await onSubmit(tempRating, ratingData)
      onClose()
      
      // Reset du formulaire
      setPunctualityRating(0)
      setQualityRating(0)
      setCommunicationRating(0)
      setComment('')
      setShowDetailedRating(false)
    } catch (error) {
      console.error('Rating failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !item) return null

  const isDelivery = 'livreur_id' in item

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          ⭐ Évaluer {isDelivery ? 'la livraison' : 'le service'}
        </h3>

        {/* Information sur l'item */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-md overflow-hidden mr-3">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-600">
                {isDelivery ? (item as DeliveryItem).destination : `Par ${(item as ServiceItem).provider}`}
              </p>
            </div>
          </div>
        </div>

        {/* Rating global */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Note globale (obligatoire)
          </label>
          <div className="flex items-center justify-center space-x-1">
            <StarRating
              rating={tempRating}
              interactive={true}
              tempRating={tempRating}
              hoveredRating={hoveredRating}
              onRatingChange={onRatingChange}
              onHover={onRatingHover}
              onLeave={onRatingLeave}
            />
            <span className="ml-2 text-sm text-gray-600">
              {tempRating > 0 ? `${tempRating}/5` : 'Non noté'}
            </span>
          </div>
        </div>

        {/* Option pour rating détaillé */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowDetailedRating(!showDetailedRating)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showDetailedRating ? '🔽 Masquer les détails' : '🔽 Évaluation détaillée (optionnel)'}
          </button>
        </div>

        {/* Rating détaillé */}
        {showDetailedRating && (
          <div className="mb-6 space-y-4 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-800">Évaluation détaillée</h4>
            
            {/* Ponctualité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ponctualité
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPunctualityRating(star)}
                    className="cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= punctualityRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-gray-600">
                  {punctualityRating > 0 ? `${punctualityRating}/5` : 'Non noté'}
                </span>
              </div>
            </div>

            {/* Qualité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isDelivery ? 'Qualité de la livraison' : 'Qualité du service'}
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQualityRating(star)}
                    className="cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= qualityRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-gray-600">
                  {qualityRating > 0 ? `${qualityRating}/5` : 'Non noté'}
                </span>
              </div>
            </div>

            {/* Communication */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCommunicationRating(star)}
                    className="cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= communicationRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-gray-600">
                  {communicationRating > 0 ? `${communicationRating}/5` : 'Non noté'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Commentaire */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commentaire (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Partagez votre expérience avec ${isDelivery ? 'ce livreur' : 'ce prestataire'}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length}/500 caractères</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={tempRating === 0 || submitting}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
          >
            {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            {submitting ? 'Envoi en cours...' : 'Publier l\'évaluation'}
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
  const { toast } = useToast()

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
          <div className="text-center text-gray-600 mb-6">
            <p className="mb-3 font-medium text-gray-800">
              🔒 Validation de livraison sécurisée
            </p>
            <p className="mb-3">
              Votre paiement est actuellement <strong>sécurisé en escrow</strong>. 
              Pour libérer les fonds au livreur, entrez le code de validation qu'il vous a fourni.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
              <p className="font-medium text-yellow-800 mb-1">📞 Le livreur vous donne le code :</p>
              <ul className="text-yellow-700 text-left">
                <li>• Verbalement lors de la livraison</li>
                <li>• Par SMS sur votre téléphone</li>
                <li>• En vous montrant son écran</li>
              </ul>
            </div>
          </div>

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
                <p className="font-medium mb-1">Une fois validé :</p>
                <p>• Les fonds seront instantanément libérés au livreur</p>
                <p>• Vous recevrez une confirmation par email</p>
                <p>• La transaction sera finalisée</p>
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
  const { user } = useAuth()
  const payments = usePayments()
  const modals = usePaymentModal()

  // Ajouter l'état pour le modal de validation
  const [codeValidationModal, setCodeValidationModal] = useState<string | null>(null)

  // =============================================================================
  // GESTION DU TÉLÉCHARGEMENT DE FACTURES
  // =============================================================================

  const handleDownloadInvoice = async (deliveryId: string) => {
    try {
      console.log('📄 Téléchargement de la facture pour la livraison:', deliveryId)
      
      // Vérifier que la livraison existe localement
      const delivery = payments.deliveries.find(d => d.id === deliveryId)
      if (!delivery) {
        toast({
          title: 'Erreur',
          description: 'Livraison introuvable',
          variant: 'destructive',
        })
        return
      }

      // Vérifier que la livraison est payée (seules les livraisons payées ont des factures)
      if (delivery.status !== 'paid') {
        toast({
          title: 'Information',
          description: 'La facture sera disponible après validation de la livraison',
          variant: 'default',
        })
        return
      }

      // TODO: Quand le backend aura le champ stripeInvoiceId, utiliser la vraie API Stripe
      // Pour l'instant, essayer de télécharger via l'API temporaire
      try {
        // Vérifier si la livraison a une facture Stripe associée
        // const stripeInvoiceId = delivery.stripeInvoiceId // Quand le champ sera ajouté
        
        // if (stripeInvoiceId) {
        //   // Télécharger la vraie facture Stripe
        //   const stripeResponse = await apiClient.downloadInvoice(stripeInvoiceId)
        //   if (stripeResponse.success && stripeResponse.download_url) {
        //     const link = document.createElement('a')
        //     link.href = stripeResponse.download_url
        //     link.download = `facture-stripe-${deliveryId}.pdf`
        //     link.click()
        //     
        //     toast({
        //       title: '✅ Facture Stripe téléchargée',
        //       description: 'La facture officielle Stripe a été téléchargée',
        //     })
        //     return
        //   }
        // }
        
        // Fallback: Génération côté client en attendant
        const response = await apiClient.downloadDeliveryInvoice(deliveryId)
        
        if (response.success && response.invoice_data) {
          const invoiceData = {
            invoiceNumber: response.invoice_data.invoiceNumber,
            date: response.invoice_data.date,
            delivery: {
              id: delivery.id,
              name: delivery.name,
              destination: delivery.destination,
              price: delivery.price,
              deliveryDate: delivery.deliveryDate
            },
            client: user?.client || user,
            total: delivery.price,
            tax: delivery.price * 0.2, // TVA 20%
            subtotal: delivery.price * 0.8
          }
          
          generateInvoicePDF(invoiceData)
          
          toast({
            title: '✅ Facture générée',
            description: `Facture ${invoiceData.invoiceNumber} générée avec succès`,
          })
        } else {
          throw new Error('Impossible de récupérer les données de facturation')
        }
      } catch (apiError) {
        console.warn('API backend non disponible, génération locale')
        
        // Génération locale en dernier recours
        const invoiceData = {
          invoiceNumber: `ECO-${new Date().getFullYear()}-${deliveryId.padStart(5, '0')}`,
          date: new Date().toLocaleDateString('fr-FR'),
          delivery: {
            id: delivery.id,
            name: delivery.name,
            destination: delivery.destination,
            price: delivery.price,
            deliveryDate: delivery.deliveryDate
          },
          client: user?.client || user,
          total: delivery.price,
          tax: delivery.price * 0.2, // TVA 20%
          subtotal: delivery.price * 0.8
        }
        
        generateInvoicePDF(invoiceData)
        
        toast({
          title: '✅ Facture générée localement',
          description: `Facture ${invoiceData.invoiceNumber} générée avec succès`,
        })
      }

    } catch (error) {
      console.error('❌ Erreur téléchargement facture:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger la facture. Veuillez réessayer.',
        variant: 'destructive',
      })
    }
  }

  const generateInvoicePDF = (invoiceData: any) => {
    // Créer un contenu HTML pour la facture
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Facture ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .company { font-weight: bold; }
          .invoice-details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h2>EcoDeli</h2>
            <p>Service de livraison collaborative</p>
            <p>123 Rue de la Livraison, 75000 Paris</p>
          </div>
          <div class="invoice-details">
            <h3>Facture ${invoiceData.invoiceNumber}</h3>
            <p>Date: ${invoiceData.date}</p>
            <p>Client: ${invoiceData.client?.first_name} ${invoiceData.client?.last_name}</p>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Destination</th>
              <th>Date</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoiceData.delivery.name}</td>
              <td>${invoiceData.delivery.destination || 'N/A'}</td>
              <td>${new Date(invoiceData.delivery.deliveryDate).toLocaleDateString('fr-FR')}</td>
              <td>€${invoiceData.delivery.price.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          <p>Sous-total: €${invoiceData.subtotal.toFixed(2)}</p>
          <p>TVA (20%): €${invoiceData.tax.toFixed(2)}</p>
          <p><strong>Total: €${invoiceData.total.toFixed(2)}</strong></p>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Merci d'avoir utilisé EcoDeli pour votre livraison collaborative !
        </p>
      </body>
      </html>
    `

    // Ouvrir dans une nouvelle fenêtre pour impression/sauvegarde
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.focus()
      
      // Auto-imprimer après un court délai
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handleCodeValidation = async (code: string) => {
    if (!codeValidationModal) return

    try {
      console.log('🔐 Validation du code pour la livraison:', codeValidationModal)
      
      // Appeler l'API de validation avec le nouveau endpoint
      const response = await apiClient.post<{ 
        success: boolean
        message: string
        data?: {
          montant_libere: number
          livreur_id: number
          payment_status: string
        }
      }>('/codes-temporaire/validate-delivery', {
        user_info: `delivery-${codeValidationModal}`,
        code: code,
        livraison_id: parseInt(codeValidationModal)
      })

      if (response.success) {
        // Mettre à jour immédiatement le statut local
        const updatedDeliveries = payments.deliveries.map(item => 
          item.id === codeValidationModal 
            ? { ...item, status: 'paid' as const } 
            : item
        )
        console.log('📦 Statut mis à jour localement pour livraison:', codeValidationModal)

        // Afficher un message de succès détaillé
        toast({
          title: '✅ Livraison validée !',
          description: `${response.message} Montant libéré: €${response.data?.montant_libere?.toFixed(2) || '0.00'}`,
        })

        // Actualiser les données depuis le serveur
        await payments.refreshData()
        
        console.log('✅ Validation réussie:', response.data)
      } else {
        throw new Error(response.message || 'Erreur de validation')
      }
    } catch (error: any) {
      console.error('❌ Erreur validation code:', error)
      
      // Gestion des erreurs spécifiques selon le nouveau backend
      let errorMessage = 'Code invalide. Vérifiez le code avec votre livreur.'
      
      if (error.response?.data?.error_code === 'INSUFFICIENT_PENDING_BALANCE') {
        errorMessage = error.response.data.message + ' ' + error.response.data.details
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: '❌ Validation échouée',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleRating = async (rating: number, detailedRating?: any) => {
    if (modals.ratingModal) {
      const [type, id] = modals.ratingModal.split('-') as ['delivery' | 'service', string]
      
      try {
        const result = await payments.submitRating(type, id, rating, detailedRating)
        
        // Si le rating a été créé avec succès, fermer le modal
        if (result.success) {
          modals.closeRatingModal()
        }
        // Si l'erreur est "déjà évalué", fermer aussi le modal car les données vont être rechargées
        else if (result.reason === 'already_rated') {
          modals.closeRatingModal()
        }
      } catch (error) {
        // En cas d'erreur inattendue, garder le modal ouvert
        console.error('Erreur lors de la soumission du rating:', error)
      }
    }
  }

  const getModalItem = (modalId: string | null): DeliveryItem | ServiceItem | undefined => {
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
          onDownloadInvoice={handleDownloadInvoice}
          formatDate={payments.formatDate}
          formatPrice={payments.formatPrice}
          t={t}
        />

        {/* TODO: Ajouter ServicesTable quand l'API sera prête */}

        <StripePaymentModal
          isOpen={!!modals.paymentModal}
          onClose={modals.closePaymentModal}
          item={getModalItem(modals.paymentModal)}
          formatPrice={payments.formatPrice}
          t={t}
          onSuccess={async () => {
            // Fermer le modal immédiatement
            modals.closePaymentModal()
            
            // Mettre à jour immédiatement le statut local
            if (modals.paymentModal) {
              const [type, id] = modals.paymentModal.split('-')
              if (type === 'delivery') {
                payments.deliveries.find(item => item.id === id)!.status = 'authorized'
              }
            }
            
            // Afficher un message de succès
            toast({
              title: 'Paiement autorisé !',
              description: 'Votre paiement est sécurisé en escrow. Les fonds seront libérés au livreur après que vous validiez la réception avec le code.',
            })
            
            // Actualiser les données depuis le serveur
            await payments.refreshData()
          }}
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