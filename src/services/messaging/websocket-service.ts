import { io, Socket } from 'socket.io-client'
import { Message, SendMessageData, MarkReadData, TypingData, UserStatusChange, SocketEvents } from './types'

class WebSocketService {
  private socket: Socket | null = null
  private userId: number | null = null
  private messageHandlers: Set<(message: Message) => void> = new Set()
  private typingHandlers: Set<(data: { userId: number }) => void> = new Set()
  private statusHandlers: Set<(data: UserStatusChange) => void> = new Set()
  private errorHandlers: Set<(error: { message: string }) => void> = new Set()
  private connectionHandlers: Set<(connected: boolean) => void> = new Set()

  // Initialiser la connexion WebSocket
  connect(userId: number, token?: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    this.userId = userId
    
    // Obtenir l'URL du backend depuis les variables d'environnement
    const wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3333'
    
    // Créer la connexion Socket.io avec l'authentification
    this.socket = io(wsUrl, {
      auth: {
        userId: userId
      },
      extraHeaders: {
        'user_id': userId.toString()
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Configurer les event listeners
    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Connexion établie
    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.connectionHandlers.forEach(handler => handler(true))
      
      // S'authentifier après connexion
      if (this.userId) {
        this.socket!.emit('authenticate', { userId: this.userId })
      }
    })

    // Déconnexion
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      this.connectionHandlers.forEach(handler => handler(false))
    })

    // Nouveau message reçu
    this.socket.on('new_message', (message: Message) => {
      console.log('New message received:', message)
      this.messageHandlers.forEach(handler => handler(message))
    })

    // Confirmation d'envoi de message
    this.socket.on('message_sent', (message: Message) => {
      console.log('Message sent confirmation:', message)
      this.messageHandlers.forEach(handler => handler(message))
    })

    // Notification de frappe
    this.socket.on('user_typing', (data: { userId: number }) => {
      console.log('User typing:', data.userId)
      this.typingHandlers.forEach(handler => handler(data))
    })

    // Changement de statut utilisateur
    this.socket.on('user_status_change', (data: UserStatusChange) => {
      console.log('User status change:', data)
      this.statusHandlers.forEach(handler => handler(data))
    })

    // Erreurs
    this.socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error)
      this.errorHandlers.forEach(handler => handler(error))
    })
  }

  // Déconnecter
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.userId = null
    }
  }

  // Envoyer un message
  sendMessage(data: SendMessageData) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected')
      return
    }
    
    this.socket.emit('send_message', data)
  }

  // Marquer comme lu
  markAsRead(messageId: number) {
    if (!this.socket?.connected) return
    
    this.socket.emit('mark_read', { messageId })
  }

  // Notifier de la frappe
  sendTyping(receiverId: number) {
    if (!this.socket?.connected) return
    
    this.socket.emit('typing', { receiverId })
  }

  // Gestion des handlers
  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onTyping(handler: (data: { userId: number }) => void) {
    this.typingHandlers.add(handler)
    return () => this.typingHandlers.delete(handler)
  }

  onStatusChange(handler: (data: UserStatusChange) => void) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  onError(handler: (error: { message: string }) => void) {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  onConnectionChange(handler: (connected: boolean) => void) {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  // Vérifier si connecté
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Obtenir l'instance du socket (pour des cas d'usage avancés)
  getSocket(): Socket | null {
    return this.socket
  }
}

// Singleton pour partager la même instance dans toute l'application
export const messagingService = new WebSocketService() 