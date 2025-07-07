"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Calendar, Download, AlertCircle, Map, Phone } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { ClientLayout } from "@/src/components/layouts"
import { useTracking } from "@/src/hooks/use-tracking"

export default function TrackingDetailClientNew({ id }: { id: string }) {
  const { t } = useLanguage()
  const [showMap, setShowMap] = useState(false)
  const { 
    trackingData, 
    livePosition, 
    eta, 
    loading, 
    error, 
    wsConnected,
    searchPackageByTracking
  } = useTracking()

  useEffect(() => {
    if (id) {
      searchPackageByTracking(id)
    }
  }, [id, searchPackageByTracking])

  // Fonction pour obtenir la couleur et l'icône en fonction du statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
      case "pickup_pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <Package className="h-5 w-5 text-yellow-600" />,
          text: t("tracking.pending"),
        }
      case "in_transit":
      case "picked_up":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <Truck className="h-5 w-5 text-blue-600" />,
          text: t("tracking.inTransit"),
        }
      case "out_for_delivery":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: <Truck className="h-5 w-5 text-purple-600" />,
          text: t("tracking.outForDelivery"),
        }
      case "delivered":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: t("tracking.delivered"),
        }
      case "exception":
      case "failed":
        return {
          color: "bg-red-100 text-red-800",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          text: t("tracking.exception"),
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <Package className="h-5 w-5 text-gray-600" />,
          text: status,
        }
    }
  }

  const handleDownloadReport = () => {
    console.log("Téléchargement du rapport pour:", id)
  }

  const handleContactDeliveryman = () => {
    console.log("Contact livreur pour:", id)
  }

  const handleReportProblem = () => {
    console.log("Signalement de problème pour:", id)
  }

  if (loading) {
    return (
      <ClientLayout activeRoute="tracking">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </main>
      </ClientLayout>
    )
  }

  if (error || !trackingData) {
    return (
      <ClientLayout activeRoute="tracking">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-semibold mb-4">{t("tracking.packageNotFound")}</h1>
            <p className="text-gray-600 mb-6">
              {error || t("tracking.invalidTrackingId")}
            </p>
            <Link href="/app_client/tracking" className="inline-flex items-center text-green-500 hover:text-green-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("tracking.backToTracking")}
            </Link>
          </div>
        </main>
      </ClientLayout>
    )
  }

  const statusInfo = getStatusInfo(trackingData.status)

  return (
    <ClientLayout activeRoute="tracking">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/app_client/tracking" className="inline-flex items-center text-gray-600 hover:text-green-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("tracking.backToTracking")}
            </Link>
          </div>

          {wsConnected && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-green-700">{t("tracking.webSocketConnected")}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold">{t("tracking.trackingDetails")}</h1>
                <p className="text-gray-500">
                  {t("tracking.trackingId")}: {trackingData.trackingNumber}
                </p>
                {livePosition && (
                  <p className="text-sm text-green-600 mt-1">
                    {t("tracking.lastUpdate")}: {new Date(livePosition.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              <div className={`mt-2 sm:mt-0 px-3 py-1 rounded-full ${statusInfo.color} flex items-center`}>
                {statusInfo.icon}
                <span className="ml-2 font-medium">{statusInfo.text}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">{t("tracking.packageInfo")}</h2>
                <p className="font-medium">{trackingData.packageName || "Package"}</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">{t("tracking.sender")}</p>
                  <p>{trackingData.sender}</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">{t("tracking.recipient")}</p>
                  <p>{trackingData.recipient}</p>
                </div>
              </div>

              <div>
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t("tracking.from")}</p>
                    <p className="font-medium">{trackingData.origin}</p>
                  </div>
                </div>
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t("tracking.to")}</p>
                    <p className="font-medium">{trackingData.destination}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t("tracking.estimatedDelivery")}</p>
                    <p className="font-medium">
                      {eta ? new Date(eta.estimatedTime).toLocaleString() : trackingData.estimatedDelivery}
                    </p>
                    {eta && eta.delayMinutes > 0 && (
                      <p className="text-sm text-orange-600">
                        ({eta.delayMinutes} min {t("tracking.delayed")})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {livePosition && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Truck className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">{t("tracking.currentLocation")}</span>
                </div>
                <p className="text-blue-700">
                  Lat: {livePosition.latitude.toFixed(6)}, Lng: {livePosition.longitude.toFixed(6)}
                </p>
                <p className="text-sm text-blue-600">
                  Vitesse: {livePosition.speed || 0} km/h
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={handleDownloadReport}
                className="flex items-center text-green-500 hover:text-green-600 px-3 py-2 rounded-md hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("tracking.downloadReport")}
              </button>
              
              <button 
                onClick={handleContactDeliveryman}
                className="flex items-center text-blue-500 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-blue-50"
              >
                <Phone className="h-4 w-4 mr-2" />
                {t("tracking.contactDeliveryman")}
              </button>
              
              <button 
                onClick={handleReportProblem}
                className="flex items-center text-red-500 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t("tracking.reportProblem")}
              </button>
              
              <button 
                onClick={() => setShowMap(!showMap)}
                className="flex items-center text-purple-500 hover:text-purple-600 px-3 py-2 rounded-md hover:bg-purple-50"
              >
                <Map className="h-4 w-4 mr-2" />
                {showMap ? t("tracking.hideMap") : t("tracking.viewOnMap")}
              </button>
            </div>
          </div>

          {showMap && trackingData && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t("tracking.realTimeTracking")}</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">{t("tracking.realTimeTracking")}</p>
                  <p className="text-sm text-gray-400">{t("tracking.mapLoadError")}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">{t("tracking.eventHistory")}</h2>

            <div className="space-y-6">
              {trackingData.events && trackingData.events.map((event, index) => {
                const eventStatus = getStatusInfo(event.status)
                return (
                  <div key={index} className="relative pl-8">
                    {index < trackingData.events.length - 1 && (
                      <div className="absolute left-[0.9375rem] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="absolute left-0 top-1">
                      <div className={`p-1 rounded-full ${index === 0 ? "bg-green-100" : "bg-gray-100"}`}>
                        {eventStatus.icon}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-gray-500">{event.location}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} • {event.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {(!trackingData.events || trackingData.events.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t("tracking.noLiveData")}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </ClientLayout>
  )
} 