"use client"

import React, { useState } from "react"
import { getStripe } from "../utils/stripe" // voir utils/stripe.ts

interface Props {
  customerId: string       // ID Stripe du client payeur
  amount: number           // montant en cents
  currency: string         // 'eur', 'usd', etc.
  delivererAccountId: string // ID Stripe Connect du livreur
}

export default function PayDeliveryButton({
  customerId,
  amount,
  currency,
  delivererAccountId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePay = async () => {
    setIsLoading(true)
    try {
      // 1) On initie l'autorisation côté backend
      const res = await fetch("/api/initiate-delivery-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, amount, currency, delivererAccountId }),
      })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Erreur init payment intent")
      }

      // 2) On confirme côté client pour autoriser la carte
      const stripe = await getStripe()
      if (!stripe) throw new Error("Stripe.js non chargé")

      const { error } = await stripe.confirmCardPayment(data.clientSecret)
      if (error) throw error

      alert("Paiement autorisé et mis en attente jusqu’à la livraison.")
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={isLoading}
      className={`w-full py-2 px-4 rounded-md transition-colors ${
        isLoading
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {isLoading ? "Veuillez patienter…" : "Payer le livreur"}
    </button>
  )
}
