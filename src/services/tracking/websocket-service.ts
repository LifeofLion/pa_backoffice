import { io, Socket } from 'socket.io-client'
import { API_CONFIG } from '@/src/lib/api-routes'

// =============================================================================
// TYPES POUR LE TRACKING TEMPS RÉEL
// =============================================================================

export interface LivePosition {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
}

export interface LivreurLocationUpdate {
  livraisonId: string
  livreurId: number
  location: LivePosition
}

export interface TrackingEvent {
  type: 'location_update' | 'status_change' | 'eta_update' | 'detour_alert'
  data: any
  timestamp: string
}

// =============================================================================
// SERVICE WEBSOCKET POUR LE TRACKING
// =============================================================================

class TrackingWebSocketService {
  private socket: Socket | null = null
  private token: string | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Initialise la connexion WebSocket
   */
  connect(token: string): void {
    this.token = token
    
    if (this.socket?.connected) {
      console.log('🔗 WebSocket déjà connecté pour le tracking')
      return
    }

    console.log('🔗 Connexion WebSocket pour le tracking...')
    
    this.socket = io(API_CONFIG.BASE_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    })

    this.setupEventListeners()
  }

  /**
   * Configuration des écouteurs d'événements WebSocket
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Connexion réussie
    this.socket.on('connect', () => {
      console.log('✅ WebSocket tracking connecté:', this.socket?.id)
      this.reconnectAttempts = 0
      this.emit('connected', { socketId: this.socket?.id })
    })

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket tracking:', error)
      this.emit('connection_error', error)
      this.handleReconnect()
    })

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket tracking déconnecté:', reason)
      this.emit('disconnected', { reason })
      
      if (reason === 'io server disconnect') {
        // Reconnexion automatique si déconnecté par le serveur
        this.handleReconnect()
      }
    })

    // Mise à jour de position de livreur
    this.socket.on('livreur_location_update', (data: LivreurLocationUpdate) => {
      console.log('📍 Mise à jour position livreur:', data)
      this.emit('livreur_location_update', data)
    })

    // Mise à jour d'ETA
    this.socket.on('eta_update', (data: any) => {
      console.log('⏱️ Mise à jour ETA:', data)
      this.emit('eta_update', data)
    })

    // Alerte de détour
    this.socket.on('detour_alert', (data: any) => {
      console.log('🚨 Alerte détour:', data)
      this.emit('detour_alert', data)
    })

    // Changement de statut de livraison
    this.socket.on('livraison_status_change', (data: any) => {
      console.log('📦 Changement statut livraison:', data)
      this.emit('livraison_status_change', data)
    })

    // Positions live (pour la carte)
    this.socket.on('live_positions_update', (data: any) => {
      console.log('🗺️ Mise à jour positions live:', data)
      this.emit('live_positions_update', data)
    })

    // Confirmation d'inscription au tracking
    this.socket.on('tracking_subscription_confirmed', (data: any) => {
      console.log('✅ Abonnement tracking confirmé:', data)
      this.emit('tracking_subscription_confirmed', data)
    })
  }

  /**
   * S'abonner au tracking d'une livraison spécifique
   */
  subscribeToLivraison(livraisonId: string): void {
    if (this.socket?.connected) {
      console.log(`📡 Abonnement au tracking de la livraison ${livraisonId}`)
      this.socket.emit('subscribe_to_tracking', { livraisonId })
    } else {
      console.warn('⚠️ WebSocket non connecté pour l\'abonnement tracking')
    }
  }

  /**
   * Se désabonner du tracking d'une livraison
   */
  unsubscribeFromLivraison(livraisonId: string): void {
    if (this.socket?.connected) {
      console.log(`📡 Désabonnement du tracking de la livraison ${livraisonId}`)
      this.socket.emit('unsubscribe_from_tracking', { livraisonId })
    }
  }

  /**
   * S'abonner aux positions live de tous les livreurs (admins)
   */
  subscribeToLivePositions(): void {
    if (this.socket?.connected) {
      console.log('📡 Abonnement aux positions live')
      this.socket.emit('subscribe_to_live_positions')
    }
  }

  /**
   * Signaler un détour ou un problème
   */
  reportDetour(data: {
    livraisonId: string
    currentLocation: LivePosition
    reason: string
    estimatedDelay?: number
  }): void {
    if (this.socket?.connected) {
      console.log('🚨 Signalement de détour:', data)
      this.socket.emit('report_detour', data)
    }
  }

  /**
   * Écouter un événement spécifique
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)?.push(callback)
  }

  /**
   * Arrêter d'écouter un événement
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      const listeners = this.eventListeners.get(event) || []
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      this.eventListeners.delete(event)
    }
  }

  /**
   * Émettre un événement local
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Erreur dans le callback pour l'événement ${event}:`, error)
      }
    })
  }

  /**
   * Gestion de la reconnexion automatique
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint')
      this.emit('max_reconnect_attempts_reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`)
    
    setTimeout(() => {
      if (this.token) {
        this.connect(this.token)
      }
    }, delay)
  }

  /**
   * Fermer la connexion WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Fermeture de la connexion WebSocket tracking')
      this.socket.disconnect()
      this.socket = null
    }
    this.eventListeners.clear()
    this.reconnectAttempts = 0
  }

  /**
   * Vérifier l'état de la connexion
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Obtenir l'ID du socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }
}

// =============================================================================
// INSTANCE SINGLETON DU SERVICE
// =============================================================================

export const trackingWebSocketService = new TrackingWebSocketService()

// =============================================================================
// TYPES EXPORTÉS DÉJÀ DÉFINIS AU DÉBUT DU FICHIER
// ============================================================================= 