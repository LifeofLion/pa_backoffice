import { useState, useCallback } from 'react'
import { apiClient } from '../lib/api'

// =============================================================================
// HOOK USEAPI - GESTION AUTOMATIQUE DES APPELS API
// =============================================================================

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook générique pour les appels API avec gestion d'état automatique
 * @param endpoint - L'endpoint à appeler
 * @param options - Options de configuration
 */
export function useApi<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    data?: any
    autoFetch?: boolean
  } = {}
): UseApiReturn<T> {
  const { method = 'GET', data, autoFetch = false } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      let response: T

      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(endpoint)
          break
        case 'POST':
          response = await apiClient.post<T>(endpoint, data)
          break
        case 'PUT':
          response = await apiClient.put<T>(endpoint, data)
          break
        case 'DELETE':
          response = await apiClient.delete<T>(endpoint)
          break
        default:
          throw new Error(`Méthode HTTP non supportée: ${method}`)
      }

      setState({
        data: response,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'Une erreur est survenue',
      })
    }
  }, [endpoint, method, data])

  return {
    ...state,
    execute,
    refetch: execute, // Alias pour la cohérence
  }
}

// =============================================================================
// HOOKS SPÉCIALISÉS
// =============================================================================

/**
 * Hook pour les requêtes GET
 */
export function useGet<T>(endpoint: string, autoFetch = false) {
  return useApi<T>(endpoint, { method: 'GET', autoFetch })
}

/**
 * Hook pour les requêtes POST
 */
export function usePost<T>(endpoint: string) {
  return useApi<T>(endpoint, { method: 'POST' })
}

/**
 * Hook pour les requêtes PUT
 */
export function usePut<T>(endpoint: string) {
  return useApi<T>(endpoint, { method: 'PUT' })
}

/**
 * Hook pour les requêtes DELETE
 */
export function useDelete<T>(endpoint: string) {
  return useApi<T>(endpoint, { method: 'DELETE' })
} 