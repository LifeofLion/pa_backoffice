"use client"

import React, { useState } from "react"
import { getStripe } from "../utils/stripe" 

interface SubscribeButtonProps {
  planName: string
  priceId: string
  children: React.ReactNode
}

export default function SubscribeButton({
  planName,
  priceId,
  children,
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/create-subscription-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Erreur create-subscription-session :", data.error)
        setIsLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      if (data.sessionId) {
        const stripe = await getStripe()
        if (!stripe) {
          console.error("Impossible de charger Stripe.js")
          setIsLoading(false)
          return
        }

        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })

        if (error) {
          console.error("Erreur redirectToCheckout :", error.message)
          setIsLoading(false)
        }

        return
      }

      console.error("Réponse inattendue de l’API :", data)
      setIsLoading(false)
    } catch (error) {
      console.error("Erreur lors de l’appel à l’API :", error)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`w-full py-2 px-4 rounded-md transition-colors ${
        planName === "Premium"
          ? "bg-white text-green-500 hover:bg-green-50"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      }`}
    >
      {isLoading ? "Loading..." : children}
    </button>
  )
}