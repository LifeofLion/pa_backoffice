import { useState, useCallback } from 'react'
import { type DeliveryItem, type ServiceItem } from './use-payments'

// =============================================================================
// TYPES POUR LES MODALES
// =============================================================================

export interface PaymentModalData {
  type: 'delivery' | 'service'
  id: string
  item: DeliveryItem | ServiceItem
}

export interface RatingModalData {
  type: 'delivery' | 'service'
  id: string
  item: DeliveryItem | ServiceItem
}

// =============================================================================
// HOOK DE GESTION DES MODALES
// =============================================================================

export function usePaymentModal() {
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null)
  const [ratingModal, setRatingModal] = useState<RatingModalData | null>(null)
  const [tempRating, setTempRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)

  // =============================================================================
  // GESTION DU MODAL DE PAIEMENT
  // =============================================================================

  const openPaymentModal = useCallback((type: 'delivery' | 'service', id: string, item: DeliveryItem | ServiceItem) => {
    setPaymentModal({ type, id, item })
  }, [])

  const closePaymentModal = useCallback(() => {
    setPaymentModal(null)
  }, [])

  // =============================================================================
  // GESTION DU MODAL DE NOTATION
  // =============================================================================

  const openRatingModal = useCallback((type: 'delivery' | 'service', id: string, item: DeliveryItem | ServiceItem) => {
    setRatingModal({ type, id, item })
    setTempRating(0)
    setHoveredRating(0)
  }, [])

  const closeRatingModal = useCallback(() => {
    setRatingModal(null)
    setTempRating(0)
    setHoveredRating(0)
  }, [])

  // =============================================================================
  // GESTION DE LA NOTATION TEMPORAIRE
  // =============================================================================

  const handleStarClick = useCallback((rating: number) => {
    setTempRating(rating)
  }, [])

  const handleStarHover = useCallback((rating: number) => {
    setHoveredRating(rating)
  }, [])

  const handleStarLeave = useCallback(() => {
    setHoveredRating(0)
  }, [])

  const getCurrentRating = useCallback((displayRating: number) => {
    return hoveredRating || tempRating || displayRating
  }, [hoveredRating, tempRating])

  // =============================================================================
  // RETOUR DU HOOK
  // =============================================================================

  return {
    // État des modales
    paymentModal,
    ratingModal,
    
    // État de la notation
    tempRating,
    hoveredRating,
    
    // Actions de paiement
    openPaymentModal,
    closePaymentModal,
    
    // Actions de notation
    openRatingModal,
    closeRatingModal,
    handleStarClick,
    handleStarHover,
    handleStarLeave,
    getCurrentRating,
    
    // État utilitaire
    isPaymentModalOpen: !!paymentModal,
    isRatingModalOpen: !!ratingModal,
    canSubmitRating: tempRating > 0
  }
} 