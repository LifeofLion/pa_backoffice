"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, Search, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-context"

// =============================================================================
// TYPES CENTRALISÉS POUR LA MESSAGERIE
// =============================================================================

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isRead: boolean
  isFromUser: boolean
}

interface Conversation {
  id: string
  recipientId: string
  recipientName: string
  recipientAvatar: string
  recipientType: "delivery" | "service" | "client" | "shopkeeper"
  serviceType?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
  status: "online" | "offline" | "away"
}

// Configuration des filtres selon le rôle
type FilterConfig = {
  showAll: boolean
  filters: Array<{
    key: string
    label: string
    type: "delivery" | "service" | "client" | "shopkeeper"
  }>
}

interface MessagesInterfaceProps {
  title: string
  filterConfig: FilterConfig
  conversations: Conversation[]
  onSendMessage?: (conversationId: string, message: string) => void
}

// =============================================================================
// COMPOSANT MESSAGES INTERFACE CENTRALISÉ - ÉLIMINATION MASSIVE DE DUPLICATION
// =============================================================================

export default function MessagesInterface({
  title,
  filterConfig,
  conversations: initialConversations,
  onSendMessage,
}: MessagesInterfaceProps) {
  const { t } = useLanguage()
  
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Filter conversations based on active tab and search query
  const filteredConversations = conversations.filter((conversation) => {
    // Filter by type
    if (activeTab !== "all") {
      const filterType = filterConfig.filters.find(f => f.key === activeTab)?.type
      if (filterType && conversation.recipientType !== filterType) return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        conversation.recipientName.toLowerCase().includes(query) ||
        (conversation.serviceType && conversation.serviceType.toLowerCase().includes(query))
      )
    }

    return true
  })

  // Get the selected conversation
  const currentConversation = conversations.find((c) => c.id === selectedConversation)

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id === selectedConversation) {
        // Create new message
        const newMsg: Message = {
          id: `m${Date.now()}`,
          senderId: "user",
          senderName: "You",
          content: newMessage,
          timestamp: new Date().toISOString(),
          isRead: true,
          isFromUser: true,
        }

        // Update conversation
        return {
          ...conversation,
          lastMessage: newMessage,
          lastMessageTime: new Date().toISOString(),
          messages: [...conversation.messages, newMsg],
        }
      }
      return conversation
    })

    setConversations(updatedConversations)
    setNewMessage("")

    // Call external handler if provided
    if (onSendMessage) {
      onSendMessage(selectedConversation, newMessage)
    }
  }

  useEffect(() => {
    if (selectedConversation) {
      setConversations((prevConversations) =>
        prevConversations.map((conversation) => {
          if (conversation.id === selectedConversation) {
            return {
              ...conversation,
              unreadCount: 0,
              messages: conversation.messages.map((message) => ({
                ...message,
                isRead: true,
              })),
            }
          }
          return conversation
        }),
      )
    }
  }, [selectedConversation])

  // Scroll to bottom of messages when a new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentConversation?.messages])

  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // Otherwise return full date
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-semibold text-center text-green-400 mb-8">
        {title}
      </h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row h-[calc(80vh-100px)]">
          {/* Conversations List */}
          <div
            className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? "hidden md:flex" : "flex"}`}
          >
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder={t("messages.searchConversations")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>

              {/* Dynamic filter tabs */}
              {filterConfig.showAll && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 px-4 py-2 text-sm rounded-md ${
                      activeTab === "all" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    }`}
                  >
                    {t("common.all")}
                  </button>
                  {filterConfig.filters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveTab(filter.key)}
                      className={`flex-1 px-4 py-2 text-sm rounded-md ${
                        activeTab === filter.key ? "bg-white shadow-sm" : "hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conversation.id ? "bg-gray-50" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start">
                      <div className="relative mr-3 flex-shrink-0">
                        <Image
                          src={conversation.recipientAvatar || "/placeholder.svg"}
                          alt={conversation.recipientName}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`}
                        ></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium truncate">{conversation.recipientName}</h3>
                          <span className="text-xs text-gray-500">
                            {formatMessageDate(conversation.lastMessageTime).split(",")[0]}
                          </span>
                        </div>
                        {conversation.serviceType && (
                          <p className="text-xs text-green-500 mb-1">{conversation.serviceType}</p>
                        )}
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="ml-2 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">{t("messages.noConversations")}</div>
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className={`w-full md:w-2/3 flex flex-col ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
            {!currentConversation ? (
              <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
                <div className="text-center">
                  <div className="mb-4">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt={t("messages.selectConversation")}
                      width={100}
                      height={100}
                      className="mx-auto opacity-50"
                    />
                  </div>
                  <p>{t("messages.selectConversation")}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden mr-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="relative mr-3">
                    <Image
                      src={currentConversation.recipientAvatar || "/placeholder.svg"}
                      alt={currentConversation.recipientName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(currentConversation.status)}`}
                    ></span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{currentConversation.recipientName}</h3>
                    <p className="text-sm text-gray-500">
                      {currentConversation.status === "online"
                        ? t("messages.online")
                        : currentConversation.status === "away"
                        ? t("messages.away")
                        : t("messages.offline")}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromUser
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isFromUser ? "text-green-100" : "text-gray-500"}`}>
                          {formatMessageDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={t("messages.typeMessage")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

// =============================================================================
// UTILITY FUNCTIONS POUR CONFIGURATIONS
// =============================================================================

export const createClientFilterConfig = () => ({
  showAll: true,
  filters: [
    { key: "delivery", label: "Livraison", type: "delivery" as const },
    { key: "service", label: "Services", type: "service" as const }
  ]
})

export const createDeliverymanFilterConfig = () => ({
  showAll: true,
  filters: [
    { key: "client", label: "Clients", type: "client" as const },
    { key: "shopkeeper", label: "Commerçants", type: "shopkeeper" as const }
  ]
})

export const createServiceProviderFilterConfig = () => ({
  showAll: false,
  filters: [
    { key: "client", label: "Clients", type: "client" as const }
  ]
})

export const createShopkeeperFilterConfig = () => ({
  showAll: true,
  filters: [
    { key: "delivery", label: "Livreurs", type: "delivery" as const },
    { key: "client", label: "Clients", type: "client" as const }
  ]
})

// =============================================================================
// MOCK DATA POUR TESTS
// =============================================================================

export const createMockConversations = () => [
  {
    id: "c1",
    recipientId: "d1",
    recipientName: "Thomas (Delivery)",
    recipientAvatar: "/placeholder.svg?height=40&width=40",
    recipientType: "delivery" as const,
    lastMessage: "Your package will be delivered tomorrow between 2-4 PM.",
    lastMessageTime: "2025-04-02T14:30:00",
    unreadCount: 1,
    status: "online" as const,
    messages: [
      {
        id: "m1",
        senderId: "d1",
        senderName: "Thomas",
        content: "Hello! I'll be delivering your package tomorrow.",
        timestamp: "2025-04-01T10:15:00",
        isRead: true,
        isFromUser: false,
      },
      {
        id: "m2",
        senderId: "user",
        senderName: "You",
        content: "Great! What time should I expect it?",
        timestamp: "2025-04-01T10:20:00",
        isRead: true,
        isFromUser: true,
      },
      {
        id: "m3",
        senderId: "d1",
        senderName: "Thomas",
        content: "Your package will be delivered tomorrow between 2-4 PM.",
        timestamp: "2025-04-02T14:30:00",
        isRead: false,
        isFromUser: false,
      },
    ],
  },
  {
    id: "c2",
    recipientId: "s1",
    recipientName: "Emma (Baby-sitter)",
    recipientAvatar: "/placeholder.svg?height=40&width=40",
    recipientType: "service" as const,
    serviceType: "Baby-sitting",
    lastMessage: "I can take care of your children this Saturday from 7 PM.",
    lastMessageTime: "2025-04-02T09:45:00",
    unreadCount: 2,
    status: "online" as const,
    messages: [
      {
        id: "m4",
        senderId: "user",
        senderName: "You",
        content: "Hi Emma, are you available for baby-sitting this Saturday evening?",
        timestamp: "2025-04-01T18:30:00",
        isRead: true,
        isFromUser: true,
      },
      {
        id: "m5",
        senderId: "s1",
        senderName: "Emma",
        content: "Hello! Yes, I'm available. What time do you need me?",
        timestamp: "2025-04-01T19:15:00",
        isRead: true,
        isFromUser: false,
      },
    ],
  },
] 