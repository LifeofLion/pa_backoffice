import { useState, useEffect, useCallback } from 'react'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { useAuth } from '@/src/hooks/use-auth'

// =============================================================================
// TYPES POUR LES PAIEMENTS
// =============================================================================

export interface DeliveryItem {
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

export interface ServiceItem {
  id: string
  image?: string
  name: string
  provider: string
  price: number
  date?: string
  rating: number
  status: "paid" | "unpaid"
  prestataire_id?: number
  client_id?: number
}

export type PaymentFilter = "all" | "unpaid" | "paid"

// =============================================================================
// HOOK DE GESTION DES PAIEMENTS
// =============================================================================

export function usePayments() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<PaymentFilter>("all")

  // =============================================================================
  // CHARGEMENT DES DONNÉES
  // =============================================================================

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
        amount: 1, // TODO: Récupérer le bon nombre de colis
        deliveryDate: delivery.scheduled_delivery_date || delivery.created_at,
        status: delivery.payment_status || "unpaid", // TODO: Implémenter le statut de paiement
        rating: delivery.rating || 0,
        annonce_id: delivery.annonce_id,
        livreur_id: delivery.livreur_id
      }))

      setDeliveries(transformedDeliveries)

      // TODO: Charger les services réservés par l'utilisateur
      // Cela nécessiterait une route API pour récupérer les services réservés par un client
      // Pour l'instant, on laisse un tableau vide
      setServices([])

    } catch (error) {
      console.error("Error loading payments:", error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [user])

  // Charger au montage et quand l'utilisateur change
  useEffect(() => {
    loadUserPayments()
  }, [loadUserPayments])

  // =============================================================================
  // FILTRAGE DES DONNÉES
  // =============================================================================

  const filteredDeliveries = deliveries.filter((item) => {
    if (activeTab === "all") return true
    return item.status === activeTab
  })

  const filteredServices = services.filter((item) => {
    if (activeTab === "all") return true
    return item.status === activeTab
  })

  // =============================================================================
  // GESTION DES PAIEMENTS
  // =============================================================================

  const processPayment = useCallback(async (type: "delivery" | "service", id: string, amount: number) => {
    try {
      // Créer un payment intent Stripe
      const paymentIntent = await apiClient.createPaymentIntent({
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        currency: 'eur',
        metadata: {
          type,
          itemId: id,
          userId: user?.id?.toString() || ''
        }
      })

      // TODO: Intégrer avec Stripe Elements pour le formulaire de paiement
      // Pour l'instant, on simule le paiement réussi
      console.log('🏦 Payment Intent créé:', paymentIntent)
      
      // Simuler le paiement réussi après 2 secondes
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

      return { success: true, paymentIntentId: paymentIntent.id }

    } catch (error) {
      console.error("Payment error:", error)
      throw new Error(getErrorMessage(error))
    }
  }, [user])

  // =============================================================================
  // GESTION DES ÉVALUATIONS  
  // =============================================================================

  const submitRating = useCallback(async (type: "delivery" | "service", id: string, rating: number) => {
    try {
      if (type === "delivery") {
        // TODO: Implémenter l'API de notation pour les livraisons
        // await apiClient.rateDelivery(id, rating)
        setDeliveries(prev => 
          prev.map(item => 
            item.id === id ? { ...item, rating } : item
          )
        )
      } else {
        // TODO: Implémenter l'API de notation pour les services  
        // await apiClient.rateService(id, rating)
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

  // =============================================================================
  // FONCTIONS UTILITAIRES
  // =============================================================================

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

  const getTotalAmount = useCallback((type: "delivery" | "service", status?: PaymentFilter) => {
    const items = type === "delivery" ? deliveries : services
    const filtered = status && status !== "all" 
      ? items.filter(item => item.status === status)
      : items
    
    return filtered.reduce((sum, item) => sum + item.price, 0)
  }, [deliveries, services])

  const getItemsCount = useCallback((type: "delivery" | "service", status?: PaymentFilter) => {
    const items = type === "delivery" ? filteredDeliveries : filteredServices
    const filtered = status && status !== "all" 
      ? items.filter(item => item.status === status)
      : items
    
    return filtered.length
  }, [filteredDeliveries, filteredServices])

  // =============================================================================
  // RETOUR DU HOOK
  // =============================================================================

  return {
    // État
    deliveries: filteredDeliveries,
    services: filteredServices,
    loading,
    error,
    activeTab,

    // Actions
    setActiveTab,
    processPayment,
    submitRating,
    refreshData: loadUserPayments,

    // Utilitaires
    formatDate,
    formatPrice,
    getTotalAmount,
    getItemsCount,

    // Métadonnées
    hasDeliveries: deliveries.length > 0,
    hasServices: services.length > 0,
    hasAnyItems: deliveries.length > 0 || services.length > 0
  }
} 