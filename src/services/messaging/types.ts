// Types pour le système de messagerie unifié
export interface User {
  id: number
  first_name: string
  last_name: string
  role?: 'client' | 'deliveryman' | 'service_provider' | 'shopkeeper' | 'admin'
  avatar?: string
}

export interface Message {
  id: number
  senderId: number
  receiverId: number
  content: string
  isRead: boolean
  createdAt: string
  timestamp?: string
  tempId?: string
  sender?: User
  receiver?: User
}

export interface Conversation {
  id: string
  recipient: User
  lastMessage: Message | null
  unreadCount: number
  messages: Message[]
  status: 'online' | 'offline' | 'away'
  isTyping?: boolean
}

export interface SendMessageData {
  receiverId: number
  content: string
  tempId: string
}

export interface MarkReadData {
  messageId: number
}

export interface TypingData {
  receiverId: number
}

export interface UserStatusChange {
  userId: number
  status: 'online' | 'offline' | 'away'
}

export interface SocketEvents {
  // Client -> Server
  send_message: (data: SendMessageData) => void
  mark_read: (data: MarkReadData) => void
  typing: (data: TypingData) => void
  authenticate: (data: { userId: number }) => void
  register_user: (data: { userId: number }) => void
  
  // Server -> Client
  new_message: (message: Message) => void
  message_sent: (message: Message) => void
  user_typing: (data: { userId: number }) => void
  user_status_change: (data: UserStatusChange) => void
  error: (data: { message: string }) => void
}

// Types pour les filtres de conversation
export type ConversationFilter = 'all' | 'delivery' | 'service' | 'client'

// Configuration pour chaque type d'utilisateur
export interface UserMessagingConfig {
  availableFilters: ConversationFilter[]
  defaultFilter: ConversationFilter
  canMessageRoles: string[]
}

export const USER_MESSAGING_CONFIG: Record<string, UserMessagingConfig> = {
  client: {
    availableFilters: ['all', 'delivery', 'service'],
    defaultFilter: 'all',
    canMessageRoles: ['deliveryman', 'service_provider']
  },
  deliveryman: {
    availableFilters: ['all'],
    defaultFilter: 'all',
    canMessageRoles: ['client', 'shopkeeper']
  },
  service_provider: {
    availableFilters: ['all'],
    defaultFilter: 'all',
    canMessageRoles: ['client']
  },
  shopkeeper: {
    availableFilters: ['all', 'delivery', 'client'],
    defaultFilter: 'all',
    canMessageRoles: ['client', 'deliveryman']
  }
} 