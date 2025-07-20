"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Package, ArrowRight, Truck, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-context"
import { useTracking } from "@/src/hooks/use-tracking"

export default function TrackingClient() {
  const { t } = useLanguage()
  const router = useRouter()
  const [trackingId, setTrackingId] = useState("")
  const [error, setError] = useState("")
  
  // Intégration des fonctionnalités avancées
  const { 
    wsConnected,
    isMockMode,
    availableTestPackages,
    searchPackageByTracking
  } = useTracking()

  // Données récentes de suivi (enrichies avec les données réelles si disponibles)
  const recentlyTracked = [
    {
      id: "ECO-123456",
      status: "in-transit",
      from: "Paris, France",
      to: "London, UK",
      estimatedDelivery: "May 15, 2025",
    },
    {
      id: "ECO-789012",
      status: "delivered",
      from: "Berlin, Germany",
      to: "Madrid, Spain",
      estimatedDelivery: "April 30, 2025",
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingId.trim()) {
      setError(t("tracking.pleaseEnterTrackingId"))
      return
    }

    // Intégrer la recherche avancée si disponible
    if (searchPackageByTracking) {
      await searchPackageByTracking(trackingId.trim())
    }

    // Rediriger vers la page de détails de suivi
    router.push(`/app_client/tracking/${trackingId}`)
  }

  const handleTestPackageClick = (trackingNumber: string) => {
    setTrackingId(trackingNumber)
    setError("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="EcoDeli Logo"
              width={120}
              height={40}
              className="h-auto"
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-center text-green-500 mb-8">
            {t("tracking.trackYourPackage")}
          </h1>

          {/* Bannière mode développement - style original */}
          {isMockMode && availableTestPackages.length > 0 && (
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Package className="h-4 w-4 mr-2 text-gray-500" />
                <strong className="text-gray-700">Mode développement actif</strong>
                <span className="ml-2 text-gray-500">- Colis de test disponibles :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTestPackages.map((trackingNumber) => (
                  <button
                    key={trackingNumber}
                    onClick={() => handleTestPackageClick(trackingNumber)}
                    className="px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                  >
                    {trackingNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire de recherche */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("tracking.trackingId")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => {
                      setTrackingId(e.target.value)
                      setError("")
                    }}
                    placeholder={t("tracking.enterTrackingId")}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                {t("tracking.trackPackage")}
              </button>
            </form>
            
            {/* Indicateur de connexion temps réel - style original */}
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              {wsConnected ? (
                <div className="flex items-center">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span>Connecté - Mises à jour en temps réel</span>
                  {isMockMode && <span className="ml-2">(Mode simulation)</span>}
                </div>
              ) : (
                <div className="flex items-center">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span>Mode hors ligne</span>
                </div>
              )}
            </div>
          </div>

          {/* Suivis récents */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t("tracking.recentlyTracked")}</h2>

            <div className="space-y-4">
              {recentlyTracked.map((item) => (
                <Link
                  key={item.id}
                  href={`/app_client/tracking/${item.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {item.status === "in-transit" ? (
                        <div className="bg-gray-100 p-2 rounded-full mr-4">
                          <Truck className="h-6 w-6 text-gray-600" />
                        </div>
                      ) : (
                        <div className="bg-green-100 p-2 rounded-full mr-4">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.id}</p>
                        <p className="text-sm text-gray-500">
                          {item.status === "in-transit" ? t("tracking.inTransit") : t("tracking.delivered")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">{t("tracking.from")}</p>
                      <p className="font-medium">{item.from}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("tracking.to")}</p>
                      <p className="font-medium">{item.to}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("tracking.estimatedDelivery")}</p>
                      <p className="font-medium">{item.estimatedDelivery}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}