import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { trackingWebSocketService, type LivePosition, type LivreurLocationUpdate } from '@/src/services/tracking/websocket-service'
import { useAuth } from './use-auth'
import { getUserRole } from '@/src/types'

// =============================================================================
// TYPES POUR LE TRACKING
// =============================================================================

export interface TrackingData {
  id: string
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'cancelled' | 'picked_up' | 'sorting' | 'stored'
  packageName?: string
  trackingNumber: string
  sender: string
  recipient: string
  origin: string
  destination: string
  estimatedDelivery: string
  shippedDate?: string
  currentLocation?: LivePosition
  events: TrackingEvent[]
  route?: {
    start: { lat: number, lng: number }
    end: { lat: number, lng: number }
    waypoints: { lat: number, lng: number, name: string }[]
  }
  livraison?: {
    id: string
    status: string
    pickupLocation: string
    dropoffLocation: string
    livreurId?: number
  }
  livreur?: {
    id: number
    name: string
    phone?: string
    avatar?: string
  }
  eta?: {
    estimated: string
    accuracy: 'high' | 'medium' | 'low'
    trafficImpact?: number
  }
  colis?: {
    id: number
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    contentDescription: string
    status: string
    locationType: string
    currentAddress?: string
  }
}

export interface TrackingEvent {
  id: string
  date: string
  time: string
  location: string
  status: string
  description: string
  latitude?: number
  longitude?: number
}

export interface TrackingFilters {
  status?: string[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}

// =============================================================================
// HOOK DE TRACKING
// =============================================================================

export function useTracking() {
  const { user } = useAuth()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [userTrackingHistory, setUserTrackingHistory] = useState<TrackingData[]>([])
  const [livePosition, setLivePosition] = useState<LivePosition | null>(null)
  const [eta, setEta] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  
  // Références pour les callbacks WebSocket
  const currentTrackingRef = useRef<string | null>(null)
  
  // =============================================================================
  // FONCTIONS DE TRANSFORMATION DES DONNÉES
  // =============================================================================
  
  const mapBackendStatusToFrontend = (backendStatus: string): TrackingData['status'] => {
    switch (backendStatus) {
      case 'created':
      case 'scheduled':
        return 'pending'
      case 'stored':
        return 'stored'
      case 'in_progress':
      case 'picked_up':
        return 'in_transit'
      case 'out_for_delivery':
        return 'out_for_delivery'
      case 'delivered':
        return 'delivered'
      case 'cancelled':
        return 'cancelled'
      case 'exception':
      case 'lost':
        return 'exception'
      case 'sorting':
        return 'sorting'
      default:
        return 'pending'
    }
  }

  const transformLocationHistoryToEvents = (locationHistory: any[]): TrackingEvent[] => {
    return locationHistory.map((location, index) => ({
      id: location.id?.toString() || index.toString(),
      date: new Date(location.moved_at || location.createdAt).toLocaleDateString('fr-FR'),
      time: new Date(location.moved_at || location.createdAt).toLocaleTimeString('fr-FR'),
      location: location.address || location.location_name || `${location.latitude || 'N/A'}, ${location.longitude || 'N/A'}`,
      status: location.location_type || location.status || 'in_progress',
      description: location.description || location.remarks || 'Événement de tracking',
      latitude: location.latitude,
      longitude: location.longitude
    }))
  }

  const updateTrackingWithNewPosition = (newPosition: LivePosition) => {
    if (trackingData) {
      setTrackingData(prev => prev ? {
        ...prev,
        currentLocation: newPosition,
        events: [
          {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('fr-FR'),
            time: new Date().toLocaleTimeString('fr-FR'),
            location: `${newPosition.latitude}, ${newPosition.longitude}`,
            status: 'in_transit',
            description: 'Position mise à jour en temps réel',
            latitude: newPosition.latitude,
            longitude: newPosition.longitude
          },
          ...prev.events
        ]
      } : null)
    }
  }

  // =============================================================================
  // RECHERCHE DE COLIS PAR NUMÉRO DE TRACKING
  // =============================================================================

  const searchPackageByTracking = useCallback(async (trackingNumber: string): Promise<TrackingData | null> => {
    if (!trackingNumber?.trim()) {
      setError('Veuillez saisir un numéro de tracking')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Récupération des données du colis
      const packageResponse = await apiClient.getPackageTracking(trackingNumber)
      console.log('📦 Données colis reçues:', packageResponse)

      if (!packageResponse?.colis) {
        setError('Colis non trouvé')
        return null
      }

      const colis = packageResponse.colis
      
      // 2. Récupération de l'historique de localisation
      const locationHistoryResponse = await apiClient.getPackageLocationHistory(trackingNumber)
      console.log('📍 Historique localisation:', locationHistoryResponse)

      // 3. Construction des données de tracking de base
      const transformedData: TrackingData = {
        id: colis.id?.toString() || trackingNumber,
        trackingNumber: colis.trackingNumber || trackingNumber,
        status: mapBackendStatusToFrontend(colis.status),
        packageName: colis.contentDescription || 'Colis',
        sender: 'Expéditeur', // Sera enrichi avec les données d'annonce
        recipient: 'Destinataire',
        origin: 'Point de départ',
        destination: 'Destination',
        estimatedDelivery: '',
        shippedDate: colis.createdAt,
        events: transformLocationHistoryToEvents(Array.isArray(locationHistoryResponse) ? locationHistoryResponse : []),
        colis: {
          id: colis.id,
          weight: colis.weight,
          dimensions: {
            length: colis.length,
            width: colis.width,
            height: colis.height
          },
          contentDescription: colis.contentDescription,
          status: colis.status,
          locationType: colis.locationType,
          currentAddress: colis.currentAddress
        }
      }

      // 4. Enrichissement avec les données d'annonce si disponibles
      if (colis.annonce) {
        const annonce = colis.annonce
        transformedData.origin = annonce.start_location || annonce.starting_address || 'Point de départ'
        transformedData.destination = annonce.end_location || annonce.destination_address || 'Destination'
        transformedData.estimatedDelivery = annonce.desired_date || annonce.scheduled_date || ''
        
        if (annonce.utilisateur) {
          transformedData.sender = `${annonce.utilisateur.first_name} ${annonce.utilisateur.last_name}`
        }
      }

      // 5. Gestion des livraisons actives
      if (colis.livraisons?.length > 0) {
        const livraison = colis.livraisons[0]
        console.log('🚛 Livraison trouvée:', livraison)

        transformedData.livraison = {
          id: livraison.id.toString(),
          status: livraison.status,
          pickupLocation: livraison.pickupLocation,
          dropoffLocation: livraison.dropoffLocation,
          livreurId: livraison.livreurId
        }

        try {
          // Récupération du tracking de la livraison
          const trackingResponse = await apiClient.getLivraisonTracking(livraison.id)
          console.log('📡 Tracking livraison:', trackingResponse)

          if (trackingResponse.tracking?.length > 0) {
            const lastPosition = trackingResponse.tracking[trackingResponse.tracking.length - 1]
            transformedData.currentLocation = {
              latitude: lastPosition.latitude,
              longitude: lastPosition.longitude,
              accuracy: lastPosition.accuracy || 10,
              speed: lastPosition.speed || 0,
              heading: lastPosition.heading || 0,
              timestamp: lastPosition.timestamp
            }
            setLivePosition(transformedData.currentLocation)
          }

          // Création de la route si on a une position actuelle
          if (transformedData.currentLocation && transformedData.origin && transformedData.destination) {
            // Pour l'instant, route simple - peut être enrichie avec une API de routing
            transformedData.route = {
              start: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
              end: { lat: 45.7640, lng: 4.8357 },   // Lyon par défaut
              waypoints: [
                { lat: 48.8566, lng: 2.3522, name: transformedData.origin },
                { lat: transformedData.currentLocation.latitude, lng: transformedData.currentLocation.longitude, name: 'Position actuelle' },
                { lat: 45.7640, lng: 4.8357, name: transformedData.destination }
              ]
            }
          }

          // Abonnement aux mises à jour WebSocket
          if (wsConnected && livraison.livreurId) {
            trackingWebSocketService.subscribeToLivraison(livraison.id.toString())
            currentTrackingRef.current = livraison.id.toString()
          }

          // Calcul de l'ETA
          try {
            const etaResponse = await apiClient.calculateETA(livraison.id)
            transformedData.eta = {
              estimated: etaResponse.estimatedTime,
              accuracy: etaResponse.confidence > 0.8 ? 'high' : 'medium',
              trafficImpact: etaResponse.delayMinutes
            }
            setEta(etaResponse)
          } catch (etaError) {
            console.log('Impossible de calculer l\'ETA:', etaError)
          }

        } catch (trackingError) {
          console.log('Erreur tracking livraison:', trackingError)
        }
      }

      console.log('✅ Données transformées:', transformedData)
      setTrackingData(transformedData)
      return transformedData

    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setError(`Erreur lors de la recherche: ${errorMessage}`)
      console.error('❌ Erreur lors de la recherche de tracking:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [wsConnected])

  // =============================================================================
  // GESTION DES LIVRAISONS UTILISATEUR
  // =============================================================================

  const loadUserTrackingHistory = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Si l'utilisateur est un client, récupérer ses livraisons
      const userRole = getUserRole(user)
      if (userRole === 'client') {
        const deliveries = await apiClient.getClientDeliveries(user.id.toString())
        console.log('📦 Livraisons client:', deliveries)
        
        // Transformer en données de tracking
        const trackingHistory = await Promise.all(
          deliveries.map(async (delivery: any) => {
            try {
              if (delivery.colis?.[0]?.trackingNumber) {
                return await searchPackageByTracking(delivery.colis[0].trackingNumber)
              }
              return null
            } catch (error) {
              console.log('Erreur chargement colis:', error)
              return null
            }
          })
        )
        
        setUserTrackingHistory(trackingHistory.filter(Boolean) as TrackingData[])
      }
      
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }, [user, searchPackageByTracking])

  // =============================================================================
  // SIGNALEMENT DE PROBLÈMES
  // =============================================================================

  const reportIssue = useCallback(async (issueData: {
    description: string
    type: 'delay' | 'damage' | 'lost' | 'other'
    location?: string
  }) => {
    if (!trackingData) return

    try {
      // Signalement via l'API backend
      await apiClient.reportDetour({
        livraisonId: trackingData.livraison?.id,
        trackingNumber: trackingData.trackingNumber,
        issueType: issueData.type,
        description: issueData.description,
        reportedAt: new Date().toISOString(),
        location: issueData.location
      })

      console.log('✅ Problème signalé avec succès')
      
      // Ajouter un événement local
      if (trackingData) {
        const newEvent: TrackingEvent = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('fr-FR'),
          time: new Date().toLocaleTimeString('fr-FR'),
          location: issueData.location || 'Position actuelle',
          status: 'exception',
          description: `Problème signalé: ${issueData.description}`
        }

        setTrackingData(prev => prev ? {
          ...prev,
          events: [newEvent, ...prev.events]
        } : null)
      }

    } catch (error) {
      console.error('❌ Erreur signalement:', error)
      throw error
    }
  }, [trackingData])

  // =============================================================================
  // GESTION DU WEBSOCKET
  // =============================================================================

  useEffect(() => {
    // Initialisation de la connexion WebSocket
    const initWebSocket = async () => {
      try {
        // Récupérer le token depuis localStorage ou sessionStorage
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        if (!token) {
          console.log('Pas de token disponible pour WebSocket')
          return
        }

        trackingWebSocketService.connect(token)
        setWsConnected(true)
        
        // Abonnement aux événements de position
        trackingWebSocketService.on('livreur_location_update', (data: LivreurLocationUpdate) => {
          if (currentTrackingRef.current === data.livraisonId) {
            const newPosition: LivePosition = {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              accuracy: data.location.accuracy || 10,
              speed: data.location.speed || 0,
              heading: data.location.heading || 0,
              timestamp: data.location.timestamp
            }
            
            setLivePosition(newPosition)
            updateTrackingWithNewPosition(newPosition)
          }
        })

        // Abonnement aux mises à jour d'ETA
        trackingWebSocketService.on('eta_update', (data: any) => {
          if (currentTrackingRef.current === data.livraisonId) {
            setEta(data.eta)
          }
        })

      } catch (error) {
        console.error('Erreur connexion WebSocket:', error)
        setWsConnected(false)
      }
    }

    initWebSocket()

    return () => {
      trackingWebSocketService.disconnect()
      setWsConnected(false)
    }
  }, [])

  // =============================================================================
  // NETTOYAGE
  // =============================================================================

  useEffect(() => {
    return () => {
      if (currentTrackingRef.current) {
        // Désabonnement du tracking actuel
        currentTrackingRef.current = null
      }
    }
  }, [])

  return {
    trackingData,
    userTrackingHistory,
    livePosition,
    eta,
    loading,
    error,
    wsConnected,
    searchPackageByTracking,
    reportIssue,
    loadUserTrackingHistory,
    isTrackingActive: !!trackingData && ['in_transit', 'out_for_delivery'].includes(trackingData.status),
    hasLiveTracking: !!livePosition && wsConnected,
    clearError: () => setError(null),
    clearTracking: () => {
      setTrackingData(null)
      setLivePosition(null)
      setEta(null)
      currentTrackingRef.current = null
    }
  }
}
