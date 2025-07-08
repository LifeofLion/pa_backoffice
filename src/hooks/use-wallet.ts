// =============================================================================
// HOOK PORTEFEUILLE ECODELI - GESTION COMPLÈTE DU WALLET
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/src/lib/api'
import { useAuth } from './use-auth'

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

export interface WalletData {
  id: number
  soldeDisponible: number
  soldeEnAttente: number
  soldeTotal: number
  virementAutoActif: boolean
  seuilVirementAuto: number | null
  iban: string | null // Masqué (ex: ****1234)
}

export interface Transaction {
  id: number
  typeTransaction: 'credit' | 'debit' | 'liberation' | 'virement' | 'commission'
  montant: number
  soldeAvant: number
  soldeApres: number
  description: string
  statut: 'pending' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  metadata?: any
}

export interface VirementConfig {
  iban: string
  bic: string
  seuil: number
}

// =============================================================================
// HOOK USE WALLET
// =============================================================================

export function useWallet() {
  // États
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Auth
  const { user } = useAuth()

  // ==========================================================================
  // RÉCUPÉRATION DU PORTEFEUILLE
  // ==========================================================================

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('💰 Récupération du portefeuille pour user:', user.id)
      
      const response = await apiClient.get<{
        success: boolean
        data: WalletData
      }>(`/portefeuille/user/${user.id}`)

      if (response.success && response.data) {
        setWallet(response.data)
        console.log('✅ Portefeuille récupéré:', response.data)
      }
    } catch (error) {
      console.error('❌ Erreur récupération portefeuille:', error)
      setError('Impossible de récupérer le portefeuille')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // ==========================================================================
  // RÉCUPÉRATION DE L'HISTORIQUE
  // ==========================================================================

  const fetchTransactions = useCallback(async (page = 1, limit = 20) => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('📜 Récupération historique transactions')
      
      const response = await apiClient.get<{
        success: boolean
        data: {
          data: Transaction[]
          meta: {
            total: number
            perPage: number
            currentPage: number
            lastPage: number
          }
        }
      }>(`/portefeuille/user/${user.id}/historique?page=${page}&limit=${limit}`)

      if (response.success && response.data) {
        setTransactions(response.data.data)
        console.log('✅ Transactions récupérées:', response.data.data.length)
        return response.data
      }
    } catch (error) {
      console.error('❌ Erreur récupération transactions:', error)
      setError('Impossible de récupérer l\'historique')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // ==========================================================================
  // CONFIGURATION VIREMENT AUTOMATIQUE
  // ==========================================================================

  const configureAutoTransfer = useCallback(async (config: VirementConfig) => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('⚙️ Configuration virement auto:', config)
      
      const response = await apiClient.post<{
        success: boolean
        message: string
      }>(`/portefeuille/user/${user.id}/configure-virement`, config)

      if (response.success) {
        console.log('✅ Virement auto configuré')
        // Recharger le portefeuille pour avoir les nouvelles données
        await fetchWallet()
        return true
      }
    } catch (error) {
      console.error('❌ Erreur configuration virement:', error)
      setError('Impossible de configurer le virement automatique')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, fetchWallet])

  // ==========================================================================
  // DÉSACTIVATION VIREMENT AUTOMATIQUE
  // ==========================================================================

  const disableAutoTransfer = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚫 Désactivation virement auto')
      
      const response = await apiClient.post<{
        success: boolean
        message: string
      }>(`/portefeuille/user/${user.id}/desactiver-virement`)

      if (response.success) {
        console.log('✅ Virement auto désactivé')
        await fetchWallet()
        return true
      }
    } catch (error) {
      console.error('❌ Erreur désactivation virement:', error)
      setError('Impossible de désactiver le virement automatique')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, fetchWallet])

  // ==========================================================================
  // DEMANDE DE VIREMENT MANUEL
  // ==========================================================================

  const requestManualTransfer = useCallback(async (montant: number, iban: string, bic: string) => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('💸 Demande virement manuel:', { montant, iban: `****${iban.slice(-4)}` })
      
      const response = await apiClient.post<{
        success: boolean
        message: string
      }>(`/portefeuille/user/${user.id}/demander-virement`, {
        montant,
        iban,
        bic
      })

      if (response.success) {
        console.log('✅ Demande de virement enregistrée')
        // Recharger le portefeuille et les transactions
        await Promise.all([fetchWallet(), fetchTransactions()])
        return true
      }
    } catch (error) {
      console.error('❌ Erreur demande virement:', error)
      setError('Impossible de demander le virement')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, fetchWallet, fetchTransactions])

  // ==========================================================================
  // CALCUL DES STATISTIQUES
  // ==========================================================================

  const getStatistics = useCallback(() => {
    if (!transactions.length) return null

    const stats = {
      totalCredits: 0,
      totalDebits: 0,
      totalCommissions: 0,
      totalVirements: 0,
      pendingAmount: 0
    }

    transactions.forEach(transaction => {
      if (transaction.statut === 'completed') {
        switch (transaction.typeTransaction) {
          case 'credit':
            stats.totalCredits += transaction.montant
            break
          case 'debit':
            stats.totalDebits += transaction.montant
            break
          case 'commission':
            stats.totalCommissions += transaction.montant
            break
          case 'virement':
            stats.totalVirements += transaction.montant
            break
        }
      } else if (transaction.statut === 'pending') {
        stats.pendingAmount += transaction.montant
      }
    })

    return stats
  }, [transactions])

  // ==========================================================================
  // FORMATAGE DES MONTANTS
  // ==========================================================================

  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }, [])

  // ==========================================================================
  // EFFET - CHARGEMENT INITIAL
  // ==========================================================================

  useEffect(() => {
    if (user?.id) {
      fetchWallet()
      fetchTransactions()
    }
  }, [user?.id, fetchWallet, fetchTransactions])

  // ==========================================================================
  // RETOUR DU HOOK
  // ==========================================================================

  return {
    // Données
    wallet,
    transactions,
    statistics: getStatistics(),
    
    // États
    isLoading,
    error,
    
    // Actions
    refreshWallet: fetchWallet,
    refreshTransactions: fetchTransactions,
    configureAutoTransfer,
    disableAutoTransfer,
    requestManualTransfer,
    
    // Utilitaires
    formatAmount
  }
} 