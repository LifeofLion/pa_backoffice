import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState, UserRole, getUserRole } from '@/src/types'
import { apiClient, getErrorMessage, isAuthError } from '@/src/lib/api'

// =============================================================================
// INTERFACE DU STORE D'AUTHENTIFICATION
// =============================================================================

interface AuthStore extends AuthState {
  // Actions d'authentification
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>

  // Actions de gestion utilisateur
  getCurrentUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>

  // Actions de gestion d'état
  setLoading: (loading: boolean) => void
  clearError: () => void

  // État d'erreur
  error: string | null

  // Méthodes utilitaires
  hasRole: (role: UserRole) => boolean
  isRole: (role: UserRole) => boolean
  requireAuth: () => boolean
  getUserRole: () => UserRole | null
}

// =============================================================================
// STORE ZUSTAND AVEC PERSISTANCE
// =============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // =======================================================================
      // ACTIONS D'AUTHENTIFICATION
      // =======================================================================

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null })

        try {
          const response = await apiClient.login(email, password)

          // Stocker le token selon la préférence utilisateur
          if (rememberMe) {
            localStorage.setItem('authToken', response.token)
            sessionStorage.removeItem('authToken')
          } else {
            sessionStorage.setItem('authToken', response.token)
            localStorage.removeItem('authToken')
          }

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = getErrorMessage(error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          await apiClient.logout()
        } catch (error) {
          // On ignore les erreurs de logout côté serveur
          console.warn('Erreur lors du logout:', getErrorMessage(error))
        } finally {
          // Nettoyer TOUS les tokens stockés
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken')
            sessionStorage.removeItem('authToken')
            localStorage.removeItem('ecodeli-auth-storage')
          }
          
          // Nettoyer le token du client API
          apiClient.clearToken()
          
          // Toujours nettoyer l'état local
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },



      // =======================================================================
      // ACTIONS DE GESTION UTILISATEUR
      // =======================================================================

      getCurrentUser: async () => {
        const { token } = get()

        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const user = await apiClient.getCurrentUser()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          // Si l'erreur est liée à l'auth, on déconnecte
          if (isAuthError(error)) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          } else {
            set({
              isLoading: false,
              error: getErrorMessage(error),
            })
          }
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get()
        if (!user) return

        set({ isLoading: true, error: null })

        try {
          // Note: Cette méthode devra être ajoutée au client API
          // const updatedUser = await apiClient.updateUser(user.id, userData)

          // Pour l'instant, on met à jour localement
          set({
            user: { ...user, ...userData },
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: getErrorMessage(error),
          })
          throw error
        }
      },

      // =======================================================================
      // ACTIONS DE GESTION D'ÉTAT
      // =======================================================================

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      clearError: () => {
        set({ error: null })
      },

      // =======================================================================
      // MÉTHODES UTILITAIRES
      // =======================================================================

      hasRole: (role: UserRole) => {
        const { user } = get()
        return user ? getUserRole(user) === role : false
      },

      isRole: (role: UserRole) => {
        const { user } = get()
        return user ? getUserRole(user) === role : false
      },

      requireAuth: () => {
        const { isAuthenticated, token } = get()
        return isAuthenticated && !!token
      },

      getUserRole: () => {
        const { user } = get()
        return user ? getUserRole(user) : null
      },
    }),
    {
      name: 'ecodeli-auth-storage',

      // Personnaliser ce qui est persisté
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),

      // Gestion de l'hydratation
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          // Réinitialiser le token dans le client API
          apiClient.setToken(state.token)
        }
      },
    }
  )
)

// =============================================================================
// HOOKS PERSONNALISÉS POUR L'AUTHENTIFICATION
// =============================================================================

/**
 * Hook pour accéder aux données utilisateur
 */
export const useUser = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return { user, isAuthenticated }
}

/**
 * Hook pour les actions d'authentification
 */
export const useAuth = () => {
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const getUserRole = useAuthStore((state) => state.getUserRole)

  return {
    login,
    logout,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    getUserRole,
  }
}

/**
 * Hook pour vérifier les permissions
 */
export const usePermissions = () => {
  const hasRole = useAuthStore((state) => state.hasRole)
  const isRole = useAuthStore((state) => state.isRole)
  const requireAuth = useAuthStore((state) => state.requireAuth)

  return {
    hasRole,
    isRole,
    requireAuth,
  }
}

/**
 * Hook pour l'initialisation de l'authentification
 */
export const useAuthInit = () => {
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser)
  const token = useAuthStore((state) => state.token)

  return {
    getCurrentUser,
    token,
  }
}
