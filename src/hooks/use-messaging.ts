import { useState, useEffect, useCallback, useRef } from 'react'
import { messagingService } from '@/src/services/messaging/websocket-service'
import { Message, Conversation, ConversationFilter, USER_MESSAGING_CONFIG } from '@/src/services/messaging/types'
import { User } from '@/src/types'
import { useAuth } from '@/src/hooks/use-auth'
import { apiClient } from '@/src/lib/api'

export function useMessaging() {
  const { user, getUserRole } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const typingTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())

  // Configuration selon le rôle de l'utilisateur
  const userRole = user ? getUserRole() : 'client'
  const userConfig = USER_MESSAGING_CONFIG[userRole || 'client'] || USER_MESSAGING_CONFIG.client

  // Initialiser WebSocket
  useEffect(() => {
    if (!user?.id) return

    // Connecter au WebSocket
    messagingService.connect(user.id)

    // Gérer les événements
    const unsubscribeMessage = messagingService.onMessage(handleIncomingMessage)
    const unsubscribeTyping = messagingService.onTyping(handleTyping)
    const unsubscribeStatus = messagingService.onStatusChange(handleStatusChange)
    const unsubscribeConnection = messagingService.onConnectionChange(setIsConnected)
    const unsubscribeError = messagingService.onError(handleError)

    // Charger les conversations initiales
    loadConversations()

    return () => {
      unsubscribeMessage()
      unsubscribeTyping()
      unsubscribeStatus()
      unsubscribeConnection()
      unsubscribeError()
      messagingService.disconnect()
    }
  }, [user?.id])

  // Charger les conversations depuis l'API
  const loadConversations = async () => {
    try {
      const response = await apiClient.getConversations()
      console.log('API conversations response:', response)
      
      if (response?.conversations && Array.isArray(response.conversations)) {
        // Déduplication basée sur recipientId
        const uniqueConversations = new Map()
        
        response.conversations.forEach((conv: any) => {
          const recipientId = conv.recipientId
          if (!uniqueConversations.has(recipientId)) {
            uniqueConversations.set(recipientId, {
              id: `conv-${recipientId}`,
              recipient: {
                id: recipientId,
                first_name: conv.recipientName?.split(' ')[0] || 'Utilisateur',
                last_name: conv.recipientName?.split(' ').slice(1).join(' ') || '',
                role: undefined, // Sera mis à jour si nécessaire
                avatar: undefined
              },
              lastMessage: conv.lastMessage ? {
                id: 0,
                senderId: 0,
                receiverId: 0,
                content: conv.lastMessage,
                isRead: true,
                createdAt: conv.lastMessageTime || new Date().toISOString()
              } : null,
              unreadCount: conv.unreadCount || 0,
              messages: [], // Chargés à la demande
              status: conv.status || 'offline',
              isTyping: false
            })
          }
        })

        const formattedConversations: Conversation[] = Array.from(uniqueConversations.values())
        console.log('Formatted unique conversations:', formattedConversations)
        setConversations(formattedConversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  // Charger les messages d'une conversation
  const loadMessages = async (recipientId: number) => {
    try {
      console.log('Loading messages for user:', recipientId)
      
      // Utiliser l'API inbox pour récupérer tous les messages de l'utilisateur
      const response = await apiClient.getInbox()
      console.log('API inbox response:', response)
      
      if (response?.messages && Array.isArray(response.messages)) {
        // Filtrer les messages pour cette conversation spécifique
        const conversationMessages = response.messages.filter((msg: any) => {
          const senderId = msg.senderId || msg.sender_id
          const receiverId = msg.receiverId || msg.receiver_id
          return (senderId === user?.id && receiverId === recipientId) ||
                 (senderId === recipientId && receiverId === user?.id)
        })
        
        console.log(`Found ${conversationMessages.length} messages for conversation with user ${recipientId}`)
        
        const messages: Message[] = conversationMessages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId || msg.sender_id,
          receiverId: msg.receiverId || msg.receiver_id,
          content: msg.content,
          isRead: msg.isRead !== undefined ? msg.isRead : msg.is_read,
          createdAt: msg.createdAt || msg.created_at,
          sender: msg.sender,
          receiver: msg.receiver
        }))
        
        // Trier les messages par date (du plus ancien au plus récent)
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        
        // Calculer le vrai nombre de messages non lus (reçus par l'utilisateur actuel)
        const actualUnreadCount = sortedMessages.filter(msg => 
          !msg.isRead && msg.receiverId === user?.id
        ).length
        
        console.log('Sorted messages:', sortedMessages)
        console.log('Actual unread count:', actualUnreadCount)
        
        setConversations(prev => prev.map(conv => {
          if (conv.recipient.id === recipientId) {
            return { 
              ...conv, 
              messages: sortedMessages,
              unreadCount: actualUnreadCount // Utiliser le vrai compteur
            }
          }
          return conv
        }))
      } else {
        console.warn('No messages found in API response:', response)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Gérer un message entrant (nouveau message ou confirmation d'envoi)
  const handleIncomingMessage = useCallback((message: Message) => {
    setConversations(prev => {
      const updatedConversations = [...prev]
      const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId
      
      // Trouver la conversation existante
      let convIndex = updatedConversations.findIndex(c => c.recipient.id === otherUserId)
      
      if (convIndex === -1) {
        // Créer une nouvelle conversation (nouveau message reçu)
        const newConv: Conversation = {
          id: `conv-${otherUserId}`,
          recipient: message.sender || {
            id: otherUserId,
            first_name: 'Utilisateur',
            last_name: '',
          },
          lastMessage: message,
          unreadCount: message.senderId !== user?.id ? 1 : 0,
          messages: [message],
          status: 'online',
          isTyping: false
        }
        updatedConversations.unshift(newConv)
      } else {
        // Mettre à jour conversation existante
        const conv = updatedConversations[convIndex]
        
        // Vérifier si c'est un remplacement d'un message temporaire
        let messageExists = false
        const updatedMessages = conv.messages.map(existingMsg => {
          // Si c'est notre propre message et qu'il a un tempId qui correspond
          if (message.tempId && existingMsg.tempId === message.tempId) {
            messageExists = true
            return { ...message, tempId: existingMsg.tempId } // Garder le tempId pour l'identification
          }
          // Ou si l'ID correspond déjà (éviter les vrais doublons)
          if (existingMsg.id === message.id) {
            messageExists = true
            return existingMsg
          }
          return existingMsg
        })
        
        // Si le message n'existe pas encore, l'ajouter
        if (!messageExists) {
          updatedMessages.push(message)
        }
        
        updatedConversations[convIndex] = {
          ...conv,
          lastMessage: message,
          unreadCount: message.senderId !== user?.id && selectedConversationId !== conv.id 
            ? conv.unreadCount + 1 
            : conv.unreadCount,
          messages: updatedMessages
        }
        
        // Déplacer la conversation en haut
        const [updated] = updatedConversations.splice(convIndex, 1)
        updatedConversations.unshift(updated)
      }
      
      return updatedConversations
    })
    
    // Marquage automatique si la conversation est active (en dehors du setState)
    if (selectedConversationId === `conv-${message.senderId}` && message.senderId !== user?.id && !message.isRead) {
      console.log(`Auto-marking received message ${message.id} as read (conversation is active)`)
      // Utiliser un timeout pour éviter les problèmes de synchronisation
      setTimeout(async () => {
        try {
          await apiClient.markMessageAsRead(message.id.toString())
          messagingService.markAsRead(message.id)
          // Mettre à jour le message dans l'état
          setConversations(prev => prev.map(conv => {
            if (conv.id === selectedConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === message.id ? { ...msg, isRead: true } : msg
                ),
                unreadCount: Math.max(0, conv.unreadCount - 1)
              }
            }
            return conv
          }))
        } catch (error) {
          console.error('Failed to auto-mark message as read:', error)
        }
      }, 100)
    }
  }, [user?.id, selectedConversationId])

  // Gérer la notification de frappe
  const handleTyping = useCallback((data: { userId: number }) => {
    // Ajouter l'utilisateur qui tape
    setTypingUsers(prev => new Set(prev).add(data.userId))
    
    // Supprimer après 3 secondes
    const existingTimeout = typingTimeouts.current.get(data.userId)
    if (existingTimeout) clearTimeout(existingTimeout)
    
    const timeout = setTimeout(() => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
      typingTimeouts.current.delete(data.userId)
    }, 3000)
    
    typingTimeouts.current.set(data.userId, timeout)
    
    // Mettre à jour l'état de frappe dans la conversation
    setConversations(prev => prev.map(conv => {
      if (conv.recipient.id === data.userId) {
        return { ...conv, isTyping: true }
      }
      return conv
    }))
    
    // Retirer après timeout
    setTimeout(() => {
      setConversations(prev => prev.map(conv => {
        if (conv.recipient.id === data.userId) {
          return { ...conv, isTyping: false }
        }
        return conv
      }))
    }, 3000)
  }, [])

  // Gérer le changement de statut
  const handleStatusChange = useCallback((data: { userId: number, status: 'online' | 'offline' | 'away' }) => {
    setConversations(prev => prev.map(conv => {
      if (conv.recipient.id === data.userId) {
        return { ...conv, status: data.status }
      }
      return conv
    }))
  }, [])

  // Gérer les erreurs
  const handleError = useCallback((error: { message: string }) => {
    console.error('WebSocket error:', error)
    // TODO: Afficher un toast ou une notification
  }, [])

  // Envoyer un message
  const sendMessage = useCallback((recipientId: number, content: string) => {
    if (!content.trim()) return
    
    const tempId = `temp-${Date.now()}`
    
    // Ajouter le message optimistiquement
    const optimisticMessage: Message = {
      id: parseInt(tempId),
      senderId: user?.id || 0,
      receiverId: recipientId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      tempId,
      sender: user ? {
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      } : undefined
    }
    
    handleIncomingMessage(optimisticMessage)
    
    // Envoyer via WebSocket
    messagingService.sendMessage({
      receiverId: recipientId,
      content: content,
      tempId: tempId
    })
  }, [user, handleIncomingMessage])

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId)
    if (!conv || conv.unreadCount === 0) return
    
    console.log(`Marking messages as read for conversation ${conversationId}`)
    
    // Marquer localement d'abord pour une réponse immédiate
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        const updatedMessages = c.messages.map(msg => {
          if (!msg.isRead && msg.receiverId === user?.id) {
            return { ...msg, isRead: true }
          }
          return msg
        })
        return { ...c, unreadCount: 0, messages: updatedMessages }
      }
      return c
    }))
    
    // Marquer sur le serveur via API REST et WebSocket
    const unreadMessages = conv.messages.filter(m => !m.isRead && m.receiverId === user?.id)
    
    console.log(`Found ${unreadMessages.length} unread messages to mark as read`)
    
    for (const message of unreadMessages) {
      try {
        // Marquer via API REST pour persistance
        await apiClient.markMessageAsRead(message.id.toString())
        console.log(`Message ${message.id} marked as read via API`)
        
        // Marquer via WebSocket pour temps réel  
        messagingService.markAsRead(message.id)
      } catch (error) {
        console.error(`Failed to mark message ${message.id} as read:`, error)
      }
    }
  }, [conversations, user?.id])

  // Notifier de la frappe
  const notifyTyping = useCallback((recipientId: number) => {
    messagingService.sendTyping(recipientId)
  }, [])

  // Sélectionner une conversation
  const selectConversation = useCallback(async (conversationId: string | null) => {
    setSelectedConversationId(conversationId)
    
    if (conversationId) {
      const conv = conversations.find(c => c.id === conversationId)
      if (conv) {
        // Charger les messages si pas déjà chargés
        if (conv.messages.length === 0) {
          await loadMessages(conv.recipient.id)
        }
        
        // Marquer comme lu (attendre la completion)
        await markAsRead(conversationId)
      }
    }
  }, [conversations, markAsRead])

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    // Filtrer par type
    if (activeFilter !== 'all') {
      const recipientRole = conv.recipient.role
      if (activeFilter === 'delivery' && recipientRole !== 'deliveryman') return false
      if (activeFilter === 'service' && recipientRole !== 'service_provider') return false
      if (activeFilter === 'client' && recipientRole !== 'client') return false
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = `${conv.recipient.first_name} ${conv.recipient.last_name}`.toLowerCase()
      return fullName.includes(query) || conv.lastMessage?.content.toLowerCase().includes(query)
    }
    
    return true
  })

  // Obtenir la conversation sélectionnée
  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Charger les utilisateurs disponibles pour démarrer une conversation
  const loadAvailableUsers = useCallback(async () => {
    if (isLoadingUsers || hasLoadedOnce) return
    
    try {
      setIsLoadingUsers(true)
      const response = await apiClient.getAvailableUsers()
      console.log('API response for available users:', response)
      
      // L'API retourne { data: User[] }
      if (response?.data && Array.isArray(response.data)) {
        setAvailableUsers(response.data)
      } else {
        console.warn('API returned unexpected format:', response)
        setAvailableUsers([])
      }
      
      setHasLoadedOnce(true)
    } catch (error) {
      console.error('Failed to load available users:', error)
      setAvailableUsers([])
      setHasLoadedOnce(true)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [isLoadingUsers, hasLoadedOnce])

  // Démarrer une nouvelle conversation
  const startConversation = useCallback(async (recipientId: number, recipientUser: User) => {
    // Vérifier si la conversation existe déjà
    const existingConv = conversations.find(c => c.recipient.id === recipientId)
    if (existingConv) {
      setSelectedConversationId(existingConv.id)
      return
    }

    // Créer une nouvelle conversation localement
    const newConversation: Conversation = {
      id: `conv-${recipientId}`,
      recipient: recipientUser,
      lastMessage: null,
      unreadCount: 0,
      messages: [],
      status: 'offline',
      isTyping: false
    }

    setConversations(prev => [newConversation, ...prev])
    setSelectedConversationId(newConversation.id)
  }, [conversations])

  return {
    conversations: filteredConversations,
    selectedConversation,
    selectedConversationId,
    isConnected,
    typingUsers,
    activeFilter,
    searchQuery,
    userConfig,
    availableUsers,
    isLoadingUsers,
    
    // Actions
    sendMessage,
    selectConversation,
    setActiveFilter,
    setSearchQuery,
    notifyTyping,
    markAsRead,
    loadConversations,
    loadAvailableUsers,
    startConversation,
  }
} 