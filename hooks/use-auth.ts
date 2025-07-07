import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useUser, useAuth as useAuthActions, usePermissions } from '@/src/stores/auth-store'
import { UserRole, getUserRole } from '@/src/types'

// =============================================================================
// HOOK PRINCIPAL D'AUTHENTIFICATION
// =============================================================================

/**
 * Hook principal qui combine toutes les fonctionnalités d'authentification
 * Remplace l'ancien useAuth du contexte..
 */
export function useAuth() {
  const { user, isAuthenticated } = useUser()
  const { login, logout, register, isLoading, error, clearError, getUserRole: getStoreUserRole } = useAuthActions()
  const permissions = usePermissions()
  const updateUser = useAuthStore((state) => state.updateUser)
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser)
  const router = useRouter()

  return {
    // Données utilisateur
    user,
    isAuthenticated,
    
    // Actions
    login,
    logout,
    register,
    updateUser,
    getCurrentUser,
    isLoading,
    error,
    clearError,
    
    // Permissions
    ...permissions,
    
    // Utilitaires
    getUserRole: getStoreUserRole,
    redirectToLogin: () => router.push('/login'),
    redirectToDashboard: () => {
      if (user) {
        const userRole = getUserRole(user)
        const dashboardPath = getDashboardPath(userRole)
        router.push(dashboardPath)
      }
    },
  }
}

// =============================================================================
// HOOKS SPÉCIALISÉS
// =============================================================================

/**
 * Hook pour protéger les routes
 */
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, router, redirectTo])

  return isAuthenticated
}

/**
 * Hook pour protéger les routes par rôle
 */
export function useRequireRole(requiredRole: UserRole, redirectTo = '/login') {
  const { isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !hasRole(requiredRole)) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, hasRole, requiredRole, router, redirectTo])

  return isAuthenticated && hasRole(requiredRole)
}

/**
 * Hook pour rediriger les utilisateurs déjà connectés
 */
export function useRedirectIfAuthenticated(redirectTo?: string) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = getUserRole(user)
      const targetPath = redirectTo || getDashboardPath(userRole)
      router.push(targetPath)
    }
  }, [isAuthenticated, user, router, redirectTo])

  return !isAuthenticated
}

/**
 * Hook pour vérifier si l'utilisateur peut accéder à une ressource
 */
export function useCanAccess(requiredRole: UserRole | UserRole[]) {
  const { hasRole } = useAuth()

  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => hasRole(role))
  }

  return hasRole(requiredRole)
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Retourne le chemin du dashboard selon le rôle utilisateur
 */
function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'client':
      return '/app_client'
    case 'delivery_man':
      return '/app_deliveryman'
    case 'service_provider':
      return '/app_service-provider'
    case 'shopkeeper':
      return '/app_shopkeeper'
    case 'admin':
      return '/admin'
    default:
      return '/login'
  }
}

/**
 * Vérifie si un rôle peut accéder à une ressource
 */
export function canRoleAccess(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }
  
  return userRole === requiredRole
}

/**
 * Vérifie si l'utilisateur est un admin
 */
export function isAdmin(role?: UserRole): boolean {
  return role === 'admin'
}

/**
 * Vérifie si l'utilisateur est un client
 */
export function isClient(role?: UserRole): boolean {
  return role === 'client'
}

/**
 * Vérifie si l'utilisateur est un livreur
 */
export function isDeliveryMan(role?: UserRole): boolean {
  return role === 'delivery_man'
}

/**
 * Vérifie si l'utilisateur est un prestataire
 */
export function isServiceProvider(role?: UserRole): boolean {
  return role === 'service_provider'
}

/**
 * Vérifie si l'utilisateur est un commerçant
 */
export function isShopkeeper(role?: UserRole): boolean {
  return role === 'shopkeeper'
} 