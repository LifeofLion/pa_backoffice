"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Search, Loader2, MessageSquare } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { User } from "@/src/services/messaging/types"
import { cn } from "@/lib/utils"

// =============================================================================
// COMPOSANT SÉLECTEUR D'UTILISATEUR POUR NOUVELLE CONVERSATION
// =============================================================================

interface UserSelectorProps {
  isOpen: boolean
  onClose: () => void
  availableUsers: User[]
  isLoading: boolean
  onSelectUser: (userId: number, user: User) => void
  onLoadUsers: () => void
  userConfig: {
    canMessageRoles: string[]
  }
}

export function UserSelector({
  isOpen,
  onClose,
  availableUsers,
  isLoading,
  onSelectUser,
  onLoadUsers,
  userConfig
}: UserSelectorProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Charger les utilisateurs quand le composant s'ouvre (une seule fois)
  useEffect(() => {
    if (isOpen && !hasLoadedOnce && !isLoading && availableUsers.length === 0) {
      setHasLoadedOnce(true)
      onLoadUsers()
    }
    
    // Reset quand la modal se ferme
    if (!isOpen) {
      setHasLoadedOnce(false)
      setSearchQuery("")
    }
  }, [isOpen, hasLoadedOnce, isLoading, availableUsers.length, onLoadUsers])

  // Gestion de la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Filtrer les utilisateurs par recherche
  const filteredUsers = availableUsers.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    return fullName.includes(query) || user.role?.toLowerCase().includes(query)
  })

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (role: string) => {
    return t(`roles.${role}`)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Fermer si on clique sur l'overlay (pas sur la modal)
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold">{t("messages.newConversation")}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder={t("messages.searchUsers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              <span className="ml-2 text-gray-600">{t("common.loading")}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{searchQuery ? t("messages.noUsersFound") : t("messages.noAvailableUsers")}</p>
              {userConfig.canMessageRoles.length > 0 && (
                <p className="text-sm mt-2">
                  {t("messages.canMessageRoles")}: {userConfig.canMessageRoles.map(role => getRoleLabel(role)).join(", ")}
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectUser(user.id, user)
                    onClose()
                  }}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3 flex-shrink-0">
                      <Image
                        src={user.avatar || "/placeholder-user.jpg"}
                        alt={`${user.first_name} ${user.last_name}`}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {user.first_name} {user.last_name}
                      </h3>
                      {user.role && (
                        <p className="text-sm text-green-600">
                          {getRoleLabel(user.role)}
                        </p>
                      )}
                    </div>
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {t("messages.selectUserToStart")}
          </p>
        </div>
      </div>
    </div>
  )
} 