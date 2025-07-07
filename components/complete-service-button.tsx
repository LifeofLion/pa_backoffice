"use client"

import React, { useState } from "react"

interface Props {
  paymentIntentId: string  // récupéré après confirmCardPayment
}

export default function CompleteServiceButton({ paymentIntentId }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/capture-service-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la finalisation")
      }
      alert("Prestation terminée : fonds libérés au prestataire.")
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleComplete}
      disabled={isLoading}
      className={`w-full py-2 px-4 rounded-md transition-colors ${
        isLoading
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {isLoading ? "Traitement…" : "Marquer prestation terminée"}
    </button>
  )
}