"use client"

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/src/lib/api'

// Charger Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// =============================================================================
// COMPOSANT FORMULAIRE DE PAIEMENT
// =============================================================================

interface PaymentFormProps {
  livraisonId: number
  amount: number
  description: string
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({ livraisonId, amount, description, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      // 1. Créer le Payment Intent côté serveur
      const response = await apiClient.createLivraisonPayment({
        amount: amount * 100, // Convertir en centimes
        livraison_id: livraisonId,
        description,
      })

      const { client_secret } = response

      if (!client_secret) {
        throw new Error('Impossible de créer le paiement')
      }

      // 2. Confirmer le paiement avec Stripe Elements
      const cardElement = elements.getElement(CardElement)
      
      const { error: stripeError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement!,
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // 3. Paiement réussi
      onSuccess()
    } catch (error: any) {
      console.error('Erreur paiement:', error)
      onError(error.message || 'Erreur lors du paiement')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full"
      >
        {processing ? 'Traitement...' : `Payer €${(amount).toFixed(2)}`}
      </Button>
    </form>
  )
}

// =============================================================================
// COMPOSANT PRINCIPAL AVEC PROVIDER STRIPE
// =============================================================================

interface StripePaymentProps {
  livraisonId: number
  amount: number
  description: string
  onSuccess: () => void
  onCancel: () => void
}

export default function StripePayment({
  livraisonId,
  amount,
  description,
  onSuccess,
  onCancel
}: StripePaymentProps) {
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = () => {
    setError(null)
    onSuccess()
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Paiement sécurisé</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <Elements stripe={stripePromise}>
            <PaymentForm
              livraisonId={livraisonId}
              amount={amount}
              description={description}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 