"use client"

import React, { useState } from "react"
import { getStripe } from "../utils/stripe"

interface Props {
  customerId: string         // ID Stripe du client
  amount: number             // montant en centimes
  currency: string           // ex. 'eur'
  providerAccountId: string  // ID du compte Stripe Connect du prestataire
  serviceId: string          // votre identifiant interne de la prestation
}

export default function PayServiceButton({
  customerId,
  amount,
  currency,
  providerAccountId,
  serviceId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePay = async () => {
    setIsLoading(true)
    try {
      // 1) Initier l'autorisation côté backend
      const res = await fetch("/api/initiate-service-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          amount,
          currency,
          providerAccountId,
          serviceId,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Erreur lors de la réservation du service")
      }

      // 2) Confirmer l'autorisation via Stripe.js
      const stripe = await getStripe()
      if (!stripe) throw new Error("Impossible de charger Stripe.js")

      const { error } = await stripe.confirmCardPayment(data.clientSecret)
      if (error) throw error

      alert("Réservation effectuée ! Paiement en attente de validation de la prestation.")
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
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {isLoading ? "Réservation en cours…" : "Réserver et payer le prestataire"}
    </button>
  )
}
