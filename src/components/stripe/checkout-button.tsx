// =============================================================================
// STRIPE CHECKOUT BUTTON - COMPOSANT RÉUTILISABLE
// =============================================================================

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/src/lib/api'
import { CreditCard, Loader2 } from 'lucide-react'

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

export interface CheckoutButtonProps {
  type: 'delivery' | 'service' | 'subscription'
  amount?: number // En euros (sera converti en centimes)
  itemId?: number // ID de l'annonce ou du service
  planType?: 'starter' | 'premium' // Pour les abonnements
  description?: string
  buttonText?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

// =============================================================================
// COMPOSANT CHECKOUT BUTTON
// =============================================================================

export default function CheckoutButton({
  type,
  amount,
  itemId,
  planType,
  description,
  buttonText = 'Payer maintenant',
  onSuccess,
  onError,
  className = '',
  disabled = false
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      let checkoutUrl = ''

      switch (type) {
        case 'delivery':
          if (!amount || !itemId) {
            throw new Error('Montant et ID de livraison requis')
          }
          
          const deliveryResponse = await apiClient.createDeliveryPayment({
            amount: Math.round(amount * 100), // Convertir en centimes
            annonce_id: itemId,
            description: description || `Paiement livraison #${itemId}`
          })
          
          checkoutUrl = deliveryResponse.checkout_url || deliveryResponse.url
          break

        case 'service':
          if (!amount || !itemId) {
            throw new Error('Montant et ID de service requis')
          }
          
          const serviceResponse = await apiClient.createServicePayment({
            amount: Math.round(amount * 100),
            service_id: itemId,
            description: description || `Paiement service #${itemId}`
          })
          
          checkoutUrl = serviceResponse.checkout_url || serviceResponse.url
          break

        case 'subscription':
          if (!planType) {
            throw new Error('Type de plan requis')
          }
          
          const subscriptionResponse = await apiClient.subscribeUser({
            planId: planType,
            priceId: planType === 'starter' ? 'price_starter_monthly' : 'price_premium_monthly'
          })
          
          checkoutUrl = subscriptionResponse.checkout_url || subscriptionResponse.url
          break

        default:
          throw new Error('Type de paiement non supporté')
      }

      if (!checkoutUrl) {
        throw new Error('URL de checkout non retournée')
      }

      // Rediriger vers Stripe Checkout
      window.location.href = checkoutUrl
      
      // Le callback onSuccess sera appelé après redirection depuis la page de succès
      onSuccess?.()
      
    } catch (error) {
      console.error('❌ Erreur checkout:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du paiement'
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Traitement...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  )
} 