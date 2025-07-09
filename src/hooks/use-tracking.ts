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
// FONCTIONS UTILITAIRES POUR SIMULATION (EN DEHORS DU HOOK)
// =============================================================================

const isTestTrackingNumber = (trackingNumber: string): boolean => {
  return trackingNumber.startsWith('ECO-TEST-')
}

const getMockTrackingData = (trackingNumber: string): TrackingData => {
  // Dates fixes pour éviter les changements à chaque render
  const baseDate = new Date('2025-06-27T15:00:00.000Z')
  const now = baseDate.getTime()
  
  const mockDataMap: Record<string, TrackingData> = {
    'ECO-TEST-001': {
      id: 'ECO-TEST-001',
      trackingNumber: 'ECO-TEST-001',
      status: 'in_transit',
      packageName: 'Chaussures de sport Nike',
      sender: 'SportShop Paris',
      recipient: 'Marie Dubois',
      origin: 'Paris, France',
      destination: 'Lyon, France',
      estimatedDelivery: new Date(now + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      shippedDate: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      currentLocation: {
        latitude: 46.7516,
        longitude: 4.8467,
        accuracy: 5,
        speed: 65,
        heading: 180,
        timestamp: baseDate.toISOString()
      },
      events: [
        {
          id: '1',
          date: new Date(now).toLocaleDateString('fr-FR'),
          time: new Date(now).toLocaleTimeString('fr-FR'),
          location: 'Autoroute A6, Mâcon',
          status: 'in_transit',
          description: 'Colis en cours de transport vers Lyon',
          latitude: 46.7516,
          longitude: 4.8467
        },
        {
          id: '2',
          date: new Date(now - 3 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          time: new Date(now - 3 * 60 * 60 * 1000).toLocaleTimeString('fr-FR'),
          location: 'Centre de tri, Dijon',
          status: 'sorting',
          description: 'Colis trié et chargé dans le véhicule de livraison',
          latitude: 47.3220,
          longitude: 5.0415
        },
        {
          id: '3',
          date: new Date(now - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          time: new Date(now - 1 * 24 * 60 * 60 * 1000).toLocaleTimeString('fr-FR'),
          location: 'Entrepôt EcoDeli, Paris',
          status: 'picked_up',
          description: 'Colis récupéré par le transporteur',
          latitude: 48.8566,
          longitude: 2.3522
        }
      ],
      eta: {
        estimated: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
        accuracy: 'high',
        trafficImpact: 15
      }
    },
    'ECO-TEST-002': {
      id: 'ECO-TEST-002',
      trackingNumber: 'ECO-TEST-002',
      status: 'out_for_delivery',
      packageName: 'Livre "Clean Code"',
      sender: 'Librairie Technique',
      recipient: 'Jean Martin',
      origin: 'Toulouse, France',
      destination: 'Bordeaux, France',
      estimatedDelivery: new Date(now + 1 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      shippedDate: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      currentLocation: {
        latitude: 44.8404,
        longitude: -0.5801,
        accuracy: 8,
        speed: 30,
        heading: 90,
        timestamp: baseDate.toISOString()
      },
      events: [
        {
          id: '1',
          date: new Date(now).toLocaleDateString('fr-FR'),
          time: new Date(now).toLocaleTimeString('fr-FR'),
          location: 'En cours de livraison, Bordeaux Centre',
          status: 'out_for_delivery',
          description: 'Colis en cours de livraison - Arrivée prévue dans 1h',
          latitude: 44.8404,
          longitude: -0.5801
        },
        {
          id: '2',
          date: new Date(now - 2 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          time: new Date(now - 2 * 60 * 60 * 1000).toLocaleTimeString('fr-FR'),
          location: 'Dépôt local, Bordeaux',
          status: 'sorting',
          description: 'Colis arrivé au dépôt local',
          latitude: 44.8378,
          longitude: -0.5792
        }
      ],
      eta: {
        estimated: new Date(now + 1 * 60 * 60 * 1000).toISOString(),
        accuracy: 'high',
        trafficImpact: 5
      }
    },
    'ECO-TEST-003': {
      id: 'ECO-TEST-003',
      trackingNumber: 'ECO-TEST-003',
      status: 'delivered',
      packageName: 'Casque audio Bose',
      sender: 'TechStore',
      recipient: 'Sophie Leroy',
      origin: 'Lille, France',
      destination: 'Bruxelles, Belgique',
      estimatedDelivery: new Date(now - 1 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      shippedDate: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      events: [
        {
          id: '1',
          date: new Date(now - 1 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          time: new Date(now - 1 * 60 * 60 * 1000).toLocaleTimeString('fr-FR'),
          location: 'Bruxelles, Belgique',
          status: 'delivered',
          description: 'Colis livré avec succès - Signé par Sophie L.',
          latitude: 50.8503,
          longitude: 4.3517
        },
        {
          id: '2',
          date: new Date(now - 3 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          time: new Date(now - 3 * 60 * 60 * 1000).toLocaleTimeString('fr-FR'),
          location: 'En cours de livraison, Bruxelles',
          status: 'out_for_delivery',
          description: 'Colis en cours de livraison',
          latitude: 50.8503,
          longitude: 4.3517
        }
      ]
    }
  }
  
  return mockDataMap[trackingNumber] || mockDataMap['ECO-TEST-001']
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Géocode une adresse française vers des coordonnées GPS
 * Utilise l'API gouvernementale française (gratuite)
 */
const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
  if (!address || address === 'Point de départ' || address === 'Destination') {
    console.log('⚠️ Adresse générique ignorée:', address)
    return null
  }

  try {
    console.log('🗺️ Géocodage de:', address)
    
    // Nettoyer l'adresse pour améliorer les résultats
    let cleanAddress = address.trim()
    
    // Si l'adresse contient un code postal, l'utiliser pour améliorer la précision
    const postalCodeMatch = cleanAddress.match(/(\d{5})/)
    if (postalCodeMatch) {
      console.log('📮 Code postal détecté:', postalCodeMatch[1])
    }
    
    // Utiliser l'API Adresse du gouvernement français (gratuite et fiable)
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cleanAddress)}&limit=1`
    console.log('🌐 URL géocodage:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.log('❌ Erreur HTTP géocodage:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    console.log('📍 Réponse géocodage:', data)
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const coordinates = feature.geometry.coordinates
      const result = { lat: coordinates[1], lng: coordinates[0] }
      const confidence = feature.properties.score || 0
      
      console.log('✅ Géocodage réussi:', address, '→', result, `(confiance: ${confidence})`)
      
      // Vérifier que les coordonnées sont en France métropolitaine
      if (result.lat >= 41 && result.lat <= 51 && result.lng >= -5 && result.lng <= 10) {
        return result
      } else {
        console.log('⚠️ Coordonnées hors de France:', result)
        return null
      }
    }
    
    console.log('⚠️ Aucun résultat de géocodage pour:', address)
    return null
  } catch (error) {
    console.error('❌ Erreur géocodage:', error)
    return null
  }
}

/**
 * Coordonnées par défaut pour les villes principales françaises
 */
const getDefaultCoordinates = (address: string): { lat: number, lng: number } | null => {
  const cityCoords: Record<string, { lat: number, lng: number }> = {
    'paris': { lat: 48.8566, lng: 2.3522 },
    'lyon': { lat: 45.7640, lng: 4.8357 },
    'marseille': { lat: 43.2965, lng: 5.3698 },
    'toulouse': { lat: 43.6047, lng: 1.4442 },
    'nice': { lat: 43.7102, lng: 7.2620 },
    'nantes': { lat: 47.2184, lng: -1.5536 },
    'strasbourg': { lat: 48.5734, lng: 7.7521 },
    'montpellier': { lat: 43.6110, lng: 3.8767 },
    'bordeaux': { lat: 44.8378, lng: -0.5792 },
    'lille': { lat: 50.6292, lng: 3.0573 },
    'rennes': { lat: 48.1173, lng: -1.6778 },
    'reims': { lat: 49.2583, lng: 4.0317 },
    'le havre': { lat: 49.4944, lng: 0.1079 },
    'saint-étienne': { lat: 45.4397, lng: 4.3872 },
    'toulon': { lat: 43.1242, lng: 5.9280 },
    'angers': { lat: 47.4784, lng: -0.5632 },
    'grenoble': { lat: 45.1885, lng: 5.7245 },
    'dijon': { lat: 47.3220, lng: 5.0415 },
    'nîmes': { lat: 43.8367, lng: 4.3601 },
    'aix-en-provence': { lat: 43.5297, lng: 5.4474 }
  }

  // Rechercher par nom de ville dans l'adresse
  const addressLower = address.toLowerCase()
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (addressLower.includes(city)) {
      console.log('📍 Coordonnées par défaut pour', city, ':', coords)
      return coords
    }
  }

  return null
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
    currentTrackingRef.current = trackingNumber

    try {
      // MODE SIMULATION - Retourner des données de test
      if (isTestTrackingNumber(trackingNumber)) {
        console.log('🧪 Mode simulation activé pour:', trackingNumber)
        
        // Simuler un délai de chargement réaliste
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockData = getMockTrackingData(trackingNumber)
        
        // Simuler la position live si le colis est en transit
        if (mockData.currentLocation && ['in_transit', 'out_for_delivery'].includes(mockData.status)) {
          setLivePosition(mockData.currentLocation)
          
          // Démarrer la simulation de mouvement
          startLivePositionSimulation(mockData.currentLocation, mockData.destination)
        }
        
        // Simuler l'ETA si disponible
        if (mockData.eta) {
          setEta({
            estimatedMinutes: Math.floor((new Date(mockData.eta.estimated).getTime() - Date.now()) / (1000 * 60)),
            estimatedTime: mockData.eta.estimated,
            confidence: mockData.eta.accuracy === 'high' ? 0.9 : 0.7,
            delayMinutes: mockData.eta.trafficImpact || 0,
            trafficDelay: mockData.eta.trafficImpact || 0
          })
        }
        
        console.log('✅ Données de test chargées:', mockData)
        setTrackingData(mockData)
        return mockData
      }

      // MODE PRODUCTION - Appels API réels
      console.log('🔍 Recherche du colis:', trackingNumber)
      
      // 1. Récupération des données du colis
      const packageResponse = await apiClient.getPackageTracking(trackingNumber)
      console.log('📦 Données colis reçues:', packageResponse)
      console.log('📦 Structure détaillée:', JSON.stringify(packageResponse, null, 2))

      if (!packageResponse?.colis) {
        setError('Colis non trouvé')
        return null
      }

      const colis = packageResponse.colis
      console.log('📦 Colis extrait:', colis)
      console.log('📦 Annonce dans colis:', colis.annonce)
      console.log('📦 AnnonceId dans colis:', colis.annonceId || colis.annonce_id)
      console.log('📦 Livraisons dans colis:', colis.livraisons)
      
      // 2. Récupération de l'historique de localisation (déjà inclus dans la réponse du colis)
      let locationHistoryResponse = packageResponse.locationHistory || []
      
      // Si pas d'historique dans la réponse principale, faire un appel séparé
      if (!locationHistoryResponse || locationHistoryResponse.length === 0) {
        try {
          const historyResponse = await apiClient.getPackageLocationHistory(trackingNumber)
          locationHistoryResponse = historyResponse.locationHistory || historyResponse || []
          console.log('📍 Historique localisation (appel séparé):', locationHistoryResponse)
        } catch (error) {
          console.log('⚠️ Impossible de récupérer l\'historique:', error)
          locationHistoryResponse = []
        }
      } else {
        console.log('📍 Historique localisation (inclus):', locationHistoryResponse)
      }

      // 3. Enrichir avec les données d'annonce si disponible
      let annonceData = null
      
      // Priorité 1: Utiliser l'annonce préchargée si disponible
      if (colis.annonce) {
        annonceData = colis.annonce
        console.log('📋 Données annonce préchargées utilisées:', annonceData)
      }
      // Priorité 2: Récupérer via annonceId du colis
      else if (colis.annonceId || colis.annonce_id) {
        try {
          const annonceId = colis.annonceId || colis.annonce_id
          const annonceResponse = await apiClient.getAnnouncement(annonceId.toString())
          annonceData = annonceResponse?.annonce
          console.log('📋 Données annonce récupérées via ID colis:', annonceData)
        } catch (error) {
          console.log('⚠️ Impossible de récupérer l\'annonce via ID colis:', error)
        }
      }
      // Priorité 3: Récupérer via livraison si disponible
      else if (colis.livraisons?.[0]?.annonce_id) {
        try {
          const annonceId = colis.livraisons[0].annonce_id
          const annonceResponse = await apiClient.getAnnouncement(annonceId.toString())
          annonceData = annonceResponse?.annonce
          console.log('📋 Données annonce récupérées via livraison:', annonceData)
        } catch (error) {
          console.log('⚠️ Impossible de récupérer l\'annonce via livraison:', error)
        }
      }
      // Priorité 4: Fallback - essayer de trouver l'annonce par utilisateur et colis
      else if (user?.id) {
        try {
          console.log('🔍 Tentative de récupération de l\'annonce via utilisateur...')
          const userAnnoncesResponse = await apiClient.getUserAnnouncements(user.id.toString())
          
          if (userAnnoncesResponse.annonces && Array.isArray(userAnnoncesResponse.annonces)) {
            // Chercher l'annonce qui contient ce colis
            for (const annonce of userAnnoncesResponse.annonces) {
              if (annonce.colis && Array.isArray(annonce.colis)) {
                const foundColis = annonce.colis.find((c: any) => 
                  (c.tracking_number === trackingNumber) || 
                  (c.trackingNumber === trackingNumber) ||
                  (c.id === colis.id)
                )
                
                if (foundColis) {
                  annonceData = annonce
                  console.log('📋 Annonce trouvée via recherche utilisateur:', annonceData)
                  break
                }
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Impossible de trouver l\'annonce via utilisateur:', error)
        }
      }
      
      // Log final pour debug
      if (!annonceData) {
        console.log('⚠️ Aucune donnée d\'annonce trouvée - utilisation des fallbacks')
        console.log('🔍 Données colis disponibles:', {
          annonceId: colis.annonceId || colis.annonce_id,
          livraisons: colis.livraisons?.length || 0,
          annonce: !!colis.annonce
        })
      } else {
        console.log('✅ Données d\'annonce récupérées avec succès:', {
          id: annonceData.id,
          title: annonceData.title,
          start_location: annonceData.start_location,
          end_location: annonceData.end_location,
          desired_date: annonceData.desired_date
        })
      }

      // 4. Enrichir avec les données de livraison si disponible
      let livraisonData = null
      let livreurData = null
      
      // Vérifier si des livraisons sont préchargées
      if (colis.livraisons && Array.isArray(colis.livraisons) && colis.livraisons.length > 0) {
        livraisonData = colis.livraisons[0] // Prendre la première livraison
        console.log('🚚 Données livraison préchargées:', livraisonData)
        
        // Récupérer les données du livreur si disponible
        if (livraisonData?.livreur_id) {
          try {
            const livreurResponse = await apiClient.get(`/livreurs/${livraisonData.livreur_id}/profile`)
            livreurData = livreurResponse?.livreur || livreurResponse?.data || livreurResponse
            console.log('🚛 Données livreur récupérées:', livreurData)
          } catch (error) {
            console.log('⚠️ Impossible de récupérer les données du livreur:', error)
          }
        }
      } else if (colis.livraison?.id) {
        // Fallback : appel API séparé pour la livraison
        try {
          const livraisonResponse = await apiClient.getDelivery(colis.livraison.id.toString())
          livraisonData = livraisonResponse?.livraison || livraisonResponse
          console.log('🚚 Données livraison (appel séparé):', livraisonData)
          
          // Récupérer les données du livreur si disponible
          if (livraisonData?.livreur_id) {
            try {
              const livreurResponse = await apiClient.get(`/livreurs/${livraisonData.livreur_id}/profile`)
              livreurData = livreurResponse?.livreur || livreurResponse?.data || livreurResponse
              console.log('🚛 Données livreur récupérées:', livreurData)
            } catch (error) {
              console.log('⚠️ Impossible de récupérer les données du livreur:', error)
            }
          }
        } catch (error) {
          console.log('⚠️ Impossible de récupérer les données de livraison:', error)
        }
      }

      // 5. Récupérer la position en temps réel du livreur si disponible
      if (livraisonData?.livreur_id) {
        try {
          const positionResponse = await apiClient.getLastLivreurPosition(livraisonData.livreur_id.toString())
          if (positionResponse?.position) {
            const position: LivePosition = {
              latitude: positionResponse.position.latitude,
              longitude: positionResponse.position.longitude,
              accuracy: positionResponse.position.accuracy || 10,
              speed: positionResponse.position.speed || 0,
              heading: positionResponse.position.heading || 0,
              timestamp: positionResponse.position.recorded_at || new Date().toISOString()
            }
            setLivePosition(position)
            console.log('📍 Position temps réel du livreur:', position)
          }
        } catch (error) {
          console.log('⚠️ Position temps réel non disponible:', error)
        }
      }

      // 6. Construction des données de tracking enrichies
      const transformedData: TrackingData = {
        id: colis.id?.toString() || trackingNumber,
        trackingNumber: colis.trackingNumber || trackingNumber,
        status: mapBackendStatusToFrontend(colis.status),
        packageName: colis.contentDescription || annonceData?.title || 'Colis',
        sender: annonceData?.utilisateur ? 
          `${annonceData.utilisateur.first_name || ''} ${annonceData.utilisateur.last_name || ''}`.trim() : 
          'Expéditeur',
        recipient: livraisonData?.recipient_name || 'Destinataire',
        origin: annonceData?.startLocation || livraisonData?.pickup_location || 'Point de départ',
        destination: annonceData?.endLocation || livraisonData?.dropoff_location || 'Destination',
        estimatedDelivery: annonceData?.desiredDate ? 
          new Date(annonceData.desiredDate).toLocaleDateString('fr-FR') : 
          'Non spécifié',
        shippedDate: colis.createdAt,
        events: transformLocationHistoryToEvents(Array.isArray(locationHistoryResponse) ? locationHistoryResponse : []),
        colis: {
          id: colis.id,
          weight: colis.weight,
          dimensions: {
            length: colis.length || 0,
            width: colis.width || 0,
            height: colis.height || 0
          },
          contentDescription: colis.contentDescription,
          status: colis.status,
          locationType: colis.location_type,
          currentAddress: colis.current_address
        },
        livraison: livraisonData ? {
          id: livraisonData.id?.toString(),
          status: livraisonData.status,
          pickupLocation: livraisonData.pickup_location,
          dropoffLocation: livraisonData.dropoff_location,
          livreurId: livraisonData.livreur_id
        } : undefined,
        livreur: livreurData ? {
          id: livreurData.id,
          name: `${livreurData.utilisateur?.first_name || ''} ${livreurData.utilisateur?.last_name || ''}`.trim() || 'Livreur',
          phone: livreurData.utilisateur?.phone_number,
          avatar: livreurData.avatar_url
        } : undefined
      }

      // 7. Calculer l'ETA si on a une position livreur et une destination
      if (livePosition && transformedData.destination) {
        try {
          const etaData = await calculateETA(livePosition, transformedData.destination)
          if (etaData) {
            setEta(etaData)
            console.log('⏰ ETA calculé:', etaData)
          }
        } catch (error) {
          console.log('⚠️ Impossible de calculer l\'ETA:', error)
        }
      }

      console.log('✅ Données de tracking enrichies:', transformedData)
      setTrackingData(transformedData)
      
      // 8. Démarrer la surveillance WebSocket si disponible
      if (livraisonData?.livreur_id && trackingWebSocketService) {
        try {
          console.log('🔄 WebSocket tracking disponible pour livreur:', livraisonData.livreur_id)
        } catch (error) {
          console.log('⚠️ WebSocket non disponible:', error)
        }
      }

      return transformedData
      
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      setError(getErrorMessage(error))
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // =============================================================================
  // SIMULATION DE POSITION LIVE (POUR LES TESTS)
  // =============================================================================

  const startLivePositionSimulation = useCallback((startPosition: LivePosition, destination: string) => {
    // Simulation uniquement pour les numéros de test
    if (!currentTrackingRef.current?.startsWith('ECO-TEST-')) return

    console.log('🎮 Démarrage simulation position live')
    
    let currentPos = { ...startPosition }
    const updateInterval = setInterval(() => {
      // Simuler un petit mouvement aléatoire
      currentPos.latitude += (Math.random() - 0.5) * 0.001
      currentPos.longitude += (Math.random() - 0.5) * 0.001
      currentPos.speed = Math.random() * 80 + 20 // 20-100 km/h
      currentPos.timestamp = new Date().toISOString()
      
      setLivePosition({ ...currentPos })
      
      // Recalculer l'ETA
      calculateETA(currentPos, destination).then(eta => {
        if (eta) setEta(eta)
      }).catch(console.error)
      
    }, 10000) // Mise à jour toutes les 10 secondes

    // Nettoyer après 5 minutes
    setTimeout(() => {
      clearInterval(updateInterval)
      console.log('🛑 Arrêt simulation position live')
    }, 5 * 60 * 1000)
  }, [])

  // =============================================================================
  // CALCUL D'ETA AMÉLIORÉ
  // =============================================================================

  const calculateETA = useCallback(async (currentPosition: LivePosition, destination: string) => {
    try {
      // Géocoder la destination si nécessaire
      let destCoords = null
      
      // Essayer de géocoder l'adresse
      destCoords = await geocodeAddress(destination)
      
      if (!destCoords) {
        // Fallback sur les coordonnées par défaut
        destCoords = getDefaultCoordinates(destination)
      }
      
      if (!destCoords) {
        console.log('⚠️ Impossible de géocoder la destination:', destination)
        return null
      }

      // Calculer la distance à vol d'oiseau
      const R = 6371 // Rayon de la Terre en km
      const dLat = (destCoords.lat - currentPosition.latitude) * Math.PI / 180
      const dLng = (destCoords.lng - currentPosition.longitude) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(currentPosition.latitude * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c

      // Estimer le temps de trajet (vitesse moyenne en ville : 30 km/h)
      const averageSpeed = 30 // km/h
      const estimatedHours = distance / averageSpeed
      const estimatedMinutes = Math.ceil(estimatedHours * 60)
      
      // Ajouter un délai pour le trafic (5-15 minutes)
      const trafficDelay = Math.floor(Math.random() * 10) + 5
      
      const etaData = {
        estimatedMinutes: estimatedMinutes + trafficDelay,
        estimatedTime: new Date(Date.now() + (estimatedMinutes + trafficDelay) * 60 * 1000).toISOString(),
        confidence: distance < 5 ? 0.9 : distance < 20 ? 0.7 : 0.5,
        delayMinutes: trafficDelay,
        trafficDelay: trafficDelay,
        distance: distance.toFixed(1)
      }

      console.log('⏰ ETA calculé:', etaData)
      return etaData
      
    } catch (error) {
      console.error('❌ Erreur calcul ETA:', error)
      return null
    }
  }, [])

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
  }, [user])

  // =============================================================================
  // RÉCUPÉRATION DES COLIS RÉCENTS DE L'UTILISATEUR
  // =============================================================================

  const loadUserRecentPackages = useCallback(async (): Promise<TrackingData[]> => {
    if (!user) {
      console.log('👤 Aucun utilisateur connecté')
      return []
    }

    try {
      setLoading(true)
      const userRole = getUserRole(user)
      console.log('👤 Chargement des colis pour:', userRole, user.id)

      if (userRole === 'client') {
        // Récupérer les annonces du client avec leurs colis
        const response = await apiClient.getUserAnnouncements(user.id.toString())
        console.log('📋 Annonces utilisateur:', response)
        console.log('📋 Structure complète de la réponse:', JSON.stringify(response, null, 2))

        const recentPackages: TrackingData[] = []
        
        if (response.annonces && Array.isArray(response.annonces)) {
          for (const annonce of response.annonces) {
            console.log('🔍 Traitement annonce:', annonce.id, 'Type:', annonce.type)
            
            // Récupérer uniquement les colis réels avec tracking
            if (annonce.colis && Array.isArray(annonce.colis) && annonce.colis.length > 0) {
              console.log('📦 Colis trouvés dans l\'annonce:', annonce.colis.length)
              
              for (const colis of annonce.colis) {
                // Utiliser uniquement les colis avec tracking_number réel
                if (colis.tracking_number || colis.trackingNumber) {
                  const trackingNumber = colis.tracking_number || colis.trackingNumber
                  console.log('✅ Colis avec tracking réel:', trackingNumber, 'Status:', colis.status)
                  
                  // ❌ LOGIQUE INCORRECTE - À CORRIGER
                  // Déterminer le statut correct selon le workflow métier EcoDeli :
                  // 1. Annonce 'active' = Colis 'stored' (en attente de prise en charge)
                  // 2. Annonce 'pending' = Colis 'in_transit' (pris en charge par livreur)  
                  // 3. Annonce 'completed' = Colis 'delivered' (livré)
                  
                  let status: TrackingData['status'] = 'stored' // Défaut : en attente
                  
                  // Priorité 1 : Utiliser le statut du colis s'il existe (plus précis)
                  if (colis.status) {
                    status = mapBackendStatusToFrontend(colis.status)
                    console.log('📦 Statut du colis utilisé:', colis.status, '→', status)
                  }
                  // Priorité 2 : Mapper depuis le statut de l'annonce
                  else if (annonce.status) {
                    switch (annonce.status) {
                      case 'active':
                        status = 'stored' // Annonce active = colis en attente de prise en charge
                        break
                      case 'pending':
                        status = 'in_transit' // Annonce prise en charge = colis en transit
                        break
                      case 'completed':
                        status = 'delivered' // Annonce terminée = colis livré
                        break
                      case 'cancelled':
                        status = 'cancelled' // Annonce annulée = colis annulé
                        break
                      default:
                        status = 'pending' // Statut par défaut
                    }
                    console.log('📋 Statut mappé depuis annonce:', annonce.status, '→', status)
                  }
                  
                  // Priorité 3 : Vérifier la cohérence avec la livraison si elle existe
                  if (annonce.livraisons && annonce.livraisons.length > 0) {
                    const livraison = annonce.livraisons[0]
                    if (livraison.status) {
                      const livraisonStatus = mapBackendStatusToFrontend(livraison.status)
                      console.log('🚚 Statut livraison détecté:', livraison.status, '→', livraisonStatus)
                      
                      // Utiliser le statut de livraison s'il est plus avancé
                      const statusPriority: Record<TrackingData['status'], number> = {
                        'pending': 1,
                        'stored': 2,
                        'picked_up': 3,
                        'sorting': 3,
                        'in_transit': 4,
                        'out_for_delivery': 5,
                        'delivered': 6,
                        'cancelled': 0,
                        'exception': 0
                      }
                      
                      if (statusPriority[livraisonStatus] > statusPriority[status]) {
                        status = livraisonStatus
                        console.log('🔄 Statut mis à jour depuis livraison:', status)
                      }
                    }
                  }
                  
                  const trackingData: TrackingData = {
                    id: trackingNumber,
                    trackingNumber: trackingNumber,
                    status: status,
                    packageName: colis.content_description || colis.contentDescription || annonce.title || 'Colis',
                    sender: `${user.firstName} ${user.lastName}`,
                    recipient: 'Destinataire',
                    origin: annonce.start_location || annonce.startLocation || 'Point de départ',
                    destination: annonce.end_location || annonce.endLocation || 'Destination',
                    estimatedDelivery: annonce.desired_date ? 
                      new Date(annonce.desired_date).toLocaleDateString('fr-FR') : 
                      new Date(Date.now() + 86400000).toLocaleDateString('fr-FR'),
                    shippedDate: colis.created_at || colis.createdAt || annonce.created_at || annonce.createdAt,
                    events: [{
                      id: '1',
                      date: new Date(colis.created_at || colis.createdAt || annonce.created_at).toLocaleDateString('fr-FR'),
                      time: new Date(colis.created_at || colis.createdAt || annonce.created_at).toLocaleTimeString('fr-FR'),
                      location: colis.current_address || colis.currentAddress || annonce.start_location || 'Point de départ',
                      status: colis.status || 'pending',
                      description: status === 'in_transit' ? 
                        'Colis pris en charge par un livreur' : 
                        status === 'delivered' ? 
                        'Colis livré avec succès' :
                        `Colis créé - ${colis.content_description || 'En attente de prise en charge'}`
                    }],
                    colis: {
                      id: colis.id,
                      weight: colis.weight || 0,
                      dimensions: {
                        length: colis.length || 0,
                        width: colis.width || 0,
                        height: colis.height || 0
                      },
                      contentDescription: colis.content_description || colis.contentDescription || '',
                      status: colis.status || 'pending',
                      locationType: colis.location_type || colis.locationType || '',
                      currentAddress: colis.current_address || colis.currentAddress
                    }
                  }
                  recentPackages.push(trackingData)
                } else {
                  console.log('⚠️ Colis sans tracking_number ignoré:', colis.id)
                }
              }
            } else {
              console.log('ℹ️ Annonce sans colis - doit être créé côté backend:', annonce.id)
            }

            // Fallback: Vérifier aussi les livraisons si elles existent (pour compatibilité)
            if (annonce.livraisons && Array.isArray(annonce.livraisons)) {
              for (const livraison of annonce.livraisons) {
                if (livraison.colis && Array.isArray(livraison.colis)) {
                  for (const colis of livraison.colis) {
                    if (colis.tracking_number && !recentPackages.find(pkg => pkg.trackingNumber === colis.tracking_number)) {
                      console.log('✅ Colis supplémentaire via livraison:', colis.tracking_number)
                      
                      const trackingData: TrackingData = {
                        id: colis.tracking_number,
                        trackingNumber: colis.tracking_number,
                        status: mapBackendStatusToFrontend(livraison.status || colis.status || 'pending'),
                        packageName: colis.content_description || annonce.title || 'Colis',
                        sender: `${user.firstName} ${user.lastName}`,
                        recipient: 'Destinataire',
                        origin: annonce.start_location || 'Point de départ',
                        destination: annonce.end_location || 'Destination',
                        estimatedDelivery: annonce.desired_date || new Date(Date.now() + 86400000).toLocaleDateString('fr-FR'),
                        shippedDate: livraison.created_at || annonce.created_at,
                        events: [],
                        livraison: {
                          id: livraison.id.toString(),
                          status: livraison.status,
                          pickupLocation: annonce.start_location || '',
                          dropoffLocation: annonce.end_location || '',
                          livreurId: livraison.livreur_id
                        }
                      }
                      recentPackages.push(trackingData)
                    }
                  }
                }
              }
            }
          }
        }

        console.log(`✅ ${recentPackages.length} colis trouvés pour l'utilisateur`)
        setUserTrackingHistory(recentPackages)
        return recentPackages

      } else {
        console.log('ℹ️ Utilisateur non-client - pas de colis à afficher')
        return []
      }

    } catch (error) {
      console.error('❌ Erreur chargement colis récents:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Charger automatiquement les colis récents quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      loadUserRecentPackages()
    } else {
      setUserTrackingHistory([])
    }
  }, [user, loadUserRecentPackages])

  // =============================================================================
  // SIGNALEMENT DE PROBLÈMES
  // =============================================================================

  const reportIssue = useCallback(async (issueData: {
    description: string
    type: 'delay' | 'damage' | 'lost' | 'other'
    location?: string
  }) => {
    try {
      // Utiliser la fonction de mise à jour pour accéder à trackingData sans dépendance
      setTrackingData(currentTrackingData => {
        if (!currentTrackingData) return currentTrackingData

        console.log('📝 Problème signalé (local):', issueData)

        // Ajouter un événement local
        const newEvent: TrackingEvent = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('fr-FR'),
          time: new Date().toLocaleTimeString('fr-FR'),
          location: issueData.location || 'Position actuelle',
          status: 'exception',
          description: `Problème signalé: ${issueData.description}`
        }

        return {
          ...currentTrackingData,
          events: [newEvent, ...currentTrackingData.events]
        }
      })

    } catch (error) {
      console.error('❌ Erreur signalement:', error)
      throw error
    }
  }, []) // Aucune dépendance

  // =============================================================================
  // GESTION DU WEBSOCKET - TEMPORAIREMENT DÉSACTIVÉ
  // =============================================================================

  useEffect(() => {
    // 🚫 WEBSOCKET TEMPORAIREMENT DÉSACTIVÉ pour éviter l'erreur "User ID not provided or invalid"
    // Le token récupéré depuis localStorage ne semble pas contenir l'ID utilisateur requis par le backend
    
    console.log('🔌 WebSocket tracking temporairement désactivé pour éviter les erreurs en boucle')
    console.log('ℹ️ Utilisateur connecté:', user?.id ? `ID ${user.id}` : 'Non connecté')
    
    // Marquer comme non connecté pour que l'interface s'adapte
    setWsConnected(false)

    return () => {
      // Nettoyage si jamais le WebSocket était connecté
      trackingWebSocketService.disconnect()
      setWsConnected(false)
    }
  }, [user]) // Dépendre de user pour debug

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
    loadUserRecentPackages,
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
