"use client"

import React, { useState } from "react"

interface Props {
  customerId: string
}

export const CustomerPortalButton: React.FC<Props> = ({ customerId }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)

    try {
      // 1) Appel au backend pour obtenir l'URL du Customer Portal
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur création Portal session")
      }

      // 2) Redirection vers l’URL du Customer Portal fourni par Stripe
      window.location.href = data.url
    } catch (err: any) {
      console.error("Erreur Customer Portal :", err.message)
      alert(err.message)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full py-2 px-4 rounded-md transition-colors ${
        isLoading
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isLoading ? "Ouverture..." : "Gérer mon abonnement"}
    </button>
  )
}
