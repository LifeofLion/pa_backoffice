import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { trackingWebSocketService } from '@/src/services/tracking/websocket-service'
import { useAuth } from './use-auth'
import { getUserRole } from '@/src/types'

// =============================================================================
// TYPES POUR LES LIVREURS
// =============================================================================

export interface Livraison {
  id: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  pickupLocation: string
  dropoffLocation: string
  clientId: string
  client: {
    name: string
    phone?: string
    address: string
  }
  colis: {
    id: string
    trackingNumber: string
    contentDescription: string
    weight: number
    dimensions: string
  }[]
  estimatedPickupTime?: string
  estimatedDeliveryTime?: string
  actualPickupTime?: string
  actualDeliveryTime?: string
  distance?: number
  amount?: number
  instructions?: string
}

export interface LivreurPosition {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
}

export interface AvailableLivraison {
  id: string
  pickupLocation: string
  dropoffLocation: string
  distance: number
  estimatedDuration: number
  amount: number
  packageCount: number
  priority: 'normal' | 'urgent'
  scheduledDate: string
}

// =============================================================================
// HOOK POUR LES LIVREURS
// =============================================================================

export function useDeliveryman() {
  const { user } = useAuth()
  const [myLivraisons, setMyLivraisons] = useState<Livraison[]>([])
  const [availableLivraisons, setAvailableLivraisons] = useState<AvailableLivraison[]>([])
  const [currentPosition, setCurrentPosition] = useState<LivreurPosition | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  // Références pour le suivi GPS
  const positionWatchRef = useRef<number | null>(null)
  const positionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // =============================================================================
  // GESTION DES LIVRAISONS
  // =============================================================================

  const loadMyLivraisons = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const userRole = getUserRole(user)
      
      if (userRole !== 'delivery_man') {
        setError('Accès réservé aux livreurs')
        return
      }

      // Récupérer les livraisons du livreur via l'API
      const response = await apiClient.get(`/livreurs/${user.livreur?.id}/livraisons`)
      console.log('📦 Livraisons livreur:', response)

      // Transformer les données pour le frontend
      const transformedLivraisons: Livraison[] = response.map((livraison: any) => ({
        id: livraison.id.toString(),
        status: livraison.status,
        pickupLocation: livraison.pickupLocation,
        dropoffLocation: livraison.dropoffLocation,
        clientId: livraison.clientId?.toString() || '',
        client: {
          name: livraison.client ? `${livraison.client.user.first_name} ${livraison.client.user.last_name}` : 'Client',
          phone: livraison.client?.user?.phone_number,
          address: livraison.dropoffLocation
        },
        colis: livraison.colis?.map((colis: any) => ({
          id: colis.id.toString(),
          trackingNumber: colis.trackingNumber,
          contentDescription: colis.contentDescription,
          weight: colis.weight,
          dimensions: `${colis.length}x${colis.width}x${colis.height}`
        })) || [],
        estimatedPickupTime: livraison.estimatedPickupTime,
        estimatedDeliveryTime: livraison.estimatedDeliveryTime,
        actualPickupTime: livraison.actualPickupTime,
        actualDeliveryTime: livraison.actualDeliveryTime,
        amount: livraison.amount,
        instructions: livraison.instructions
      }))

      setMyLivraisons(transformedLivraisons)

    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(`Erreur chargement livraisons: ${errorMessage}`)
      console.error('❌ Erreur chargement livraisons:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadAvailableLivraisons = useCallback(async () => {
    if (!user) return

    try {
      const response = await apiClient.get('/livreurs/available-livraisons')
      console.log('📦 Livraisons disponibles:', response)

      const transformedAvailable: AvailableLivraison[] = response.map((livraison: any) => ({
        id: livraison.id.toString(),
        pickupLocation: livraison.pickupLocation,
        dropoffLocation: livraison.dropoffLocation,
        distance: livraison.distance || 0,
        estimatedDuration: livraison.estimatedDuration || 60,
        amount: livraison.amount || 0,
        packageCount: livraison.colis?.length || 1,
        priority: livraison.priority || 'normal',
        scheduledDate: livraison.scheduledDate || new Date().toISOString()
      }))

      setAvailableLivraisons(transformedAvailable)

    } catch (error) {
      console.error('❌ Erreur chargement livraisons disponibles:', error)
    }
  }, [user])

  // =============================================================================
  // GESTION DES STATUTS DE LIVRAISON
  // =============================================================================

  const acceptLivraison = useCallback(async (livraisonId: string) => {
    if (!user?.livreur?.id) return

    try {
      setLoading(true)
      await apiClient.post(`/livreurs/${user.livreur.id}/livraisons/${livraisonId}/accept`)
      
      // Recharger les livraisons
      await loadMyLivraisons()
      await loadAvailableLivraisons()
      
      console.log('✅ Livraison acceptée:', livraisonId)

    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(`Erreur acceptation livraison: ${errorMessage}`)
      console.error('❌ Erreur acceptation livraison:', error)
    } finally {
      setLoading(false)
    }
  }, [user, loadMyLivraisons, loadAvailableLivraisons])

  const updateLivraisonStatus = useCallback(async (
    livraisonId: string, 
    newStatus: 'in_progress' | 'completed' | 'cancelled',
    location?: { latitude: number, longitude: number }
  ) => {
    if (!user?.livreur?.id) return

    try {
      setLoading(true)
      
      const updateData: any = { status: newStatus }
      if (location) {
        updateData.latitude = location.latitude
        updateData.longitude = location.longitude
        updateData.timestamp = new Date().toISOString()
      }

      await apiClient.put(`/livreurs/${user.livreur.id}/livraisons/${livraisonId}/status`, updateData)
      
      // Recharger les livraisons
      await loadMyLivraisons()
      
      console.log('✅ Statut livraison mis à jour:', livraisonId, newStatus)

    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(`Erreur mise à jour statut: ${errorMessage}`)
      console.error('❌ Erreur mise à jour statut:', error)
    } finally {
      setLoading(false)
    }
  }, [user, loadMyLivraisons])

  // =============================================================================
  // GESTION DE LA POSITION GPS
  // =============================================================================

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur')
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

    // Démarrer le suivi de position
    positionWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition: LivreurPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: new Date().toISOString()
        }

        setCurrentPosition(newPosition)
        console.log('📍 Nouvelle position GPS:', newPosition)

        // Envoyer la position au backend via WebSocket si connecté
        if (wsConnected && user?.livreur?.id) {
          trackingWebSocketService.reportDetour({
            livraisonId: 'current', // ou l'ID de la livraison en cours
            currentLocation: newPosition,
            reason: 'position_update'
          })
        }
      },
      (error) => {
        console.error('❌ Erreur géolocalisation:', error)
        setError('Impossible de récupérer la position GPS')
      },
      options
    )

    // Envoyer la position au backend toutes les 30 secondes
    positionUpdateIntervalRef.current = setInterval(async () => {
      if (currentPosition && user?.livreur?.id) {
        try {
          await apiClient.post(`/tracking/livreur/${user.livreur.id}/update-position`, {
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            accuracy: currentPosition.accuracy,
            speed: currentPosition.speed,
            heading: currentPosition.heading,
            timestamp: currentPosition.timestamp
          })
        } catch (error) {
          console.error('❌ Erreur envoi position:', error)
        }
      }
    }, 30000) // 30 secondes

    console.log('🎯 Suivi GPS démarré')

  }, [wsConnected, user, currentPosition])

  const stopLocationTracking = useCallback(() => {
    if (positionWatchRef.current) {
      navigator.geolocation.clearWatch(positionWatchRef.current)
      positionWatchRef.current = null
    }

    if (positionUpdateIntervalRef.current) {
      clearInterval(positionUpdateIntervalRef.current)
      positionUpdateIntervalRef.current = null
    }

    console.log('⏹️ Suivi GPS arrêté')
  }, [])

  // =============================================================================
  // GESTION DE LA DISPONIBILITÉ
  // =============================================================================

  const updateAvailability = useCallback(async (available: boolean) => {
    if (!user?.livreur?.id) return

    try {
      await apiClient.put(`/livreurs/${user.livreur.id}/availability`, {
        availabilityStatus: available ? 'available' : 'offline'
      })

      setIsAvailable(available)

      if (available) {
        startLocationTracking()
        await loadAvailableLivraisons()
      } else {
        stopLocationTracking()
      }

      console.log('✅ Disponibilité mise à jour:', available)

    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(`Erreur mise à jour disponibilité: ${errorMessage}`)
      console.error('❌ Erreur mise à jour disponibilité:', error)
    }
  }, [user, startLocationTracking, stopLocationTracking, loadAvailableLivraisons])

  // =============================================================================
  // GESTION DU WEBSOCKET
  // =============================================================================

  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        if (!token) return

        trackingWebSocketService.connect(token)
        setWsConnected(true)

        // Écouter les nouvelles livraisons disponibles
        trackingWebSocketService.on('new_delivery_available', (data: any) => {
          console.log('🆕 Nouvelle livraison disponible:', data)
          loadAvailableLivraisons()
        })

        // Écouter les mises à jour de livraison
        trackingWebSocketService.on('livraison_status_change', (data: any) => {
          console.log('📦 Changement statut livraison:', data)
          loadMyLivraisons()
        })

      } catch (error) {
        console.error('❌ Erreur connexion WebSocket livreur:', error)
        setWsConnected(false)
      }
    }

    if (user && getUserRole(user) === 'delivery_man') {
      initWebSocket()
    }

    return () => {
      stopLocationTracking()
      trackingWebSocketService.disconnect()
      setWsConnected(false)
    }
  }, [user, loadAvailableLivraisons, loadMyLivraisons, stopLocationTracking])

  // =============================================================================
  // CHARGEMENT INITIAL
  // =============================================================================

  useEffect(() => {
    if (user && getUserRole(user) === 'delivery_man') {
      loadMyLivraisons()
      loadAvailableLivraisons()
      
      // Récupérer le statut de disponibilité actuel
      if (user.livreur?.availabilityStatus === 'available') {
        setIsAvailable(true)
        startLocationTracking()
      }
    }
  }, [user, loadMyLivraisons, loadAvailableLivraisons, startLocationTracking])

  return {
    // Données
    myLivraisons,
    availableLivraisons,
    currentPosition,
    isAvailable,
    loading,
    error,
    wsConnected,

    // Actions
    acceptLivraison,
    updateLivraisonStatus,
    updateAvailability,
    startLocationTracking,
    stopLocationTracking,
    refreshData: () => {
      loadMyLivraisons()
      loadAvailableLivraisons()
    },
    clearError: () => setError(null),

    // Utilitaires
    isDeliveryman: user ? getUserRole(user) === 'delivery_man' : false,
    hasActiveDeliveries: myLivraisons.some(l => l.status === 'in_progress'),
    todayDeliveries: myLivraisons.filter(l => {
      const today = new Date().toDateString()
      const deliveryDate = new Date(l.estimatedDeliveryTime || '').toDateString()
      return deliveryDate === today
    })
  }
} 