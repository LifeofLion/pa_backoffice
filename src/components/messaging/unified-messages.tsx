"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { Send, Search, ArrowLeft, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useMessaging } from "@/src/hooks/use-messaging"
import { ConversationFilter } from "@/src/services/messaging/types"

import { cn } from "@/lib/utils"

// =============================================================================
// COMPOSANT MESSAGERIE UNIFIÉ - REMPLACE TOUS LES COMPOSANTS MESSAGES DUPLIQUÉS
// =============================================================================

interface UnifiedMessagesProps {
  className?: string
}

export function UnifiedMessages({ className }: UnifiedMessagesProps) {
  const { t } = useLanguage()
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const {
    conversations,
    selectedConversation,
    selectedConversationId,
    isConnected,
    typingUsers,
    searchQuery,
    sendMessage,
    selectConversation,
    setSearchQuery,
    notifyTyping,
  } = useMessaging()

  // Gérer l'envoi de message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    sendMessage(selectedConversation.recipient.id, newMessage)
    setNewMessage("")
  }

  // Gérer la notification de frappe
  const handleTyping = () => {
    if (!selectedConversation || isTyping) return
    
    setIsTyping(true)
    notifyTyping(selectedConversation.recipient.id)
    
    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }

  // Scroll automatique vers le bas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedConversation?.messages])

  // Format date
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return `${t("common.yesterday")}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Couleur du statut
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
    <>
      <div className={cn("bg-white rounded-lg shadow-md overflow-hidden", className)}>
        {/* Indicateur de connexion */}
        {!isConnected && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
            {t("messages.reconnecting")}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row h-[calc(80vh-100px)]">
          {/* Liste des conversations */}
          <div
            className={cn(
              "w-full md:w-1/3 border-r border-gray-200 flex flex-col",
              selectedConversationId ? "hidden md:flex" : "flex"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t("messages.conversations")}</h3>
              </div>

              {/* Recherche */}
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


            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                      selectedConversationId === conversation.id && "bg-gray-50"
                    )}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <div className="flex items-start">
                      <div className="relative mr-3 flex-shrink-0">
                        <Image
                          src={conversation.recipient.avatar || "/placeholder-user.jpg"}
                          alt={`${conversation.recipient.first_name} ${conversation.recipient.last_name}`}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                            getStatusColor(conversation.status)
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium truncate">
                            {conversation.recipient.first_name} {conversation.recipient.last_name}
                            {conversation.recipient.role && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({t(`roles.${conversation.recipient.role}`)})
                              </span>
                            )}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatMessageDate(conversation.lastMessage.createdAt).split(",")[0]}
                            </span>
                          )}
                        </div>
                        {conversation.isTyping ? (
                          <p className="text-sm text-green-500 italic">{t("messages.typing")}</p>
                        ) : conversation.lastMessage ? (
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">{t("messages.noMessages")}</p>
                        )}
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
                <div className="p-8 text-center text-gray-500">
                  <Image
                    src="/placeholder.svg"
                    alt={t("messages.noConversations")}
                    width={100}
                    height={100}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <p className="mb-4">{t("messages.noConversations")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Détail de la conversation */}
          <div className={cn(
            "w-full md:w-2/3 flex flex-col",
            !selectedConversationId ? "hidden md:flex" : "flex"
          )}>
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
                <div className="text-center">
                  <Image
                    src="/placeholder.svg"
                    alt={t("messages.selectConversation")}
                    width={100}
                    height={100}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <p className="mb-4">{t("messages.selectConversation")}</p>
                </div>
              </div>
            ) : (
              <>
                {/* En-tête de conversation */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <button
                    onClick={() => selectConversation(null)}
                    className="md:hidden mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="relative mr-3">
                    <Image
                      src={selectedConversation.recipient.avatar || "/placeholder-user.jpg"}
                      alt={`${selectedConversation.recipient.first_name} ${selectedConversation.recipient.last_name}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                        getStatusColor(selectedConversation.status)
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {selectedConversation.recipient.first_name} {selectedConversation.recipient.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.isTyping ? (
                        <span className="text-green-500">{t("messages.typing")}</span>
                      ) : selectedConversation.status === "online" ? (
                        t("messages.online")
                      ) : selectedConversation.status === "away" ? (
                        t("messages.away")
                      ) : (
                        t("messages.offline")
                      )}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>{t("messages.noMessages")}</p>
                    </div>
                  ) : (
                    selectedConversation.messages.map((message) => (
                      <div
                        key={message.id || message.tempId}
                        className={cn(
                          "flex",
                          message.senderId === selectedConversation.recipient.id ? "justify-start" : "justify-end"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                            message.senderId === selectedConversation.recipient.id
                              ? "bg-gray-200 text-gray-800"
                              : "bg-green-500 text-white"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.senderId === selectedConversation.recipient.id
                              ? "text-gray-500"
                              : "text-green-100"
                          )}>
                            {formatMessageDate(message.createdAt)}
                            {message.tempId && !message.id && (
                              <Loader2 className="inline-block ml-1 h-3 w-3 animate-spin" />
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        if (selectedConversation) {
                          handleTyping()
                        }
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={t("messages.typeMessage")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                      className={cn(
                        "px-4 py-2 rounded-md transition-colors",
                        "bg-green-500 text-white hover:bg-green-600",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
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

    </>
  )
}