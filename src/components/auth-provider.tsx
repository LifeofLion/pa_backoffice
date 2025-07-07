'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/src/stores/auth-store'
import { apiClient } from '@/src/lib/api'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provider qui initialise l'authentification au démarrage de l'application
 * Remplace l'ancien AuthContext défaillant
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { token, getCurrentUser, setLoading } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      // Si on a un token persisté, on vérifie qu'il est toujours valide
      if (token) {
        setLoading(true)
        
        try {
          // Réinitialiser le token dans le client API
          apiClient.setToken(token)
          
          // Vérifier que le token est toujours valide en récupérant l'utilisateur
          await getCurrentUser()
        } catch (error) {
          // Si le token n'est plus valide, on déconnecte silencieusement
          console.warn('Token invalide, déconnexion automatique')
          useAuthStore.getState().logout()
        } finally {
          setLoading(false)
        }
      }
    }

    initializeAuth()
  }, [token, getCurrentUser, setLoading])

  return <>{children}</>
}

/**
 * Hook pour vérifier si l'authentification est initialisée
 */
export function useAuthInitialized() {
  const isLoading = useAuthStore((state) => state.isLoading)
  const token = useAuthStore((state) => state.token)
  
  // L'auth est initialisée si :
  // - Pas de loading ET pas de token (utilisateur non connecté)
  // - Pas de loading ET token présent (utilisateur connecté et vérifié)
  return !isLoading
} 