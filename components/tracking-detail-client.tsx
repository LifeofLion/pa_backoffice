"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Calendar, Download, AlertCircle, Eye, EyeOff, Wifi, WifiOff, Clock } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useTracking } from "@/src/hooks/use-tracking"
import dynamic from 'next/dynamic'

// Import dynamique de la carte pour éviter les erreurs SSR
const TrackingMap = dynamic(() => import('@/src/components/tracking/tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
    </div>
  )
})

// Types pour les données de suivi
interface TrackingEvent {
  date: string
  time: string
  location: string
  status: string
  description: string
}

interface TrackingData {
  id: string
  status: "pending" | "in-transit" | "delivered" | "exception"
  packageName: string
  sender: string
  recipient: string
  origin: string
  destination: string
  estimatedDelivery: string
  shippedDate: string
  events: TrackingEvent[]
}

export default function TrackingDetailClient({ id }: { id: string }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [showMap, setShowMap] = useState(false)
  
  // Intégration des fonctionnalités avancées
  const { 
    trackingData: liveTrackingData,
    livePosition,
    eta,
    wsConnected,
    searchPackageByTracking,
    reportIssue
  } = useTracking()

  useEffect(() => {
    // Rechercher automatiquement avec le système avancé
    if (searchPackageByTracking) {
      searchPackageByTracking(id)
    }

    // Simuler le chargement des données de suivi (fallback original)
    const timer = setTimeout(() => {
      if (!liveTrackingData) {
        // Dans une application réelle, vous feriez un appel API ici
        const mockData: TrackingData = {
          id,
          status: "in-transit",
          packageName: "Running Shoes",
          sender: "SportShop Paris",
          recipient: "John Doe",
          origin: "Paris, France",
          destination: "London, UK",
          estimatedDelivery: "May 15, 2025",
          shippedDate: "May 5, 2025",
          events: [
            {
              date: "May 8, 2025",
              time: "14:30",
              location: "Distribution Center, Calais",
              status: "in-transit",
              description: "Package in transit to next facility",
            },
            {
              date: "May 7, 2025",
              time: "09:15",
              location: "Sorting Facility, Paris",
              status: "in-transit",
              description: "Package sorted and processed",
            },
            {
              date: "May 6, 2025",
              time: "16:45",
              location: "Collection Point, Paris",
              status: "in-transit",
              description: "Package received at collection point",
            },
            {
              date: "May 5, 2025",
              time: "10:00",
              location: "Sender Location, Paris",
              status: "pending",
              description: "Shipping label created",
            },
          ],
        }
        setTrackingData(mockData)
      }
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [id, searchPackageByTracking, liveTrackingData])

  // Utiliser les données live si disponibles, sinon fallback
  const displayData = liveTrackingData || trackingData

  // Fonction pour obtenir la couleur et l'icône en fonction du statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <Package className="h-5 w-5 text-yellow-600" />,
          text: t("tracking.pending"),
        }
      case "in-transit":
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <Truck className="h-5 w-5 text-gray-600" />,
          text: t("tracking.inTransit"),
        }
      case "delivered":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: t("tracking.delivered"),
        }
      case "exception":
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

  const formatETA = (etaMinutes: number) => {
    if (etaMinutes < 60) {
      return `${etaMinutes} min`
    }
    const hours = Math.floor(etaMinutes / 60)
    const minutes = etaMinutes % 60
    return `${hours}h ${minutes}min`
  }

  // Adapter la position live au format attendu par la carte
  const adaptedLivePosition = livePosition ? {
    lat: livePosition.latitude,
    lng: livePosition.longitude
  } : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!displayData) {
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
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-semibold mb-4">{t("tracking.packageNotFound")}</h1>
            <p className="text-gray-600 mb-6">{t("tracking.invalidTrackingId")}</p>
            <Link href="/app_client/tracking" className="inline-flex items-center text-green-500 hover:text-green-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("tracking.backToTracking")}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const statusInfo = getStatusInfo(displayData.status)

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
          <div className="mb-6">
            <Link href="/app_client/tracking" className="inline-flex items-center text-gray-600 hover:text-green-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("tracking.backToTracking")}
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold">{t("tracking.trackingDetails")}</h1>
                <p className="text-gray-500">
                  {t("tracking.trackingId")}: {displayData.id}
                </p>
                {/* Indicateur de connexion temps réel - style original */}
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  {wsConnected ? (
                    <div className="flex items-center">
                      <Wifi className="h-3 w-3 mr-1" />
                      <span>Temps réel</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <WifiOff className="h-3 w-3 mr-1" />
                      <span>Hors ligne</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`mt-2 sm:mt-0 px-3 py-1 rounded-full ${statusInfo.color} flex items-center`}>
                {statusInfo.icon}
                <span className="ml-2 font-medium">{statusInfo.text}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">{t("tracking.packageInfo")}</h2>
                <p className="font-medium">{displayData.packageName}</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">{t("tracking.sender")}</p>
                  <p>{displayData.sender}</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">{t("tracking.recipient")}</p>
                  <p>{displayData.recipient}</p>
                </div>
                
                {/* Informations temps réel - style original */}
                {livePosition && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-600 font-medium text-sm mb-2">
                      <Truck className="h-4 w-4 mr-1" />
                      Position en temps réel
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Lat: {livePosition.latitude.toFixed(6)}</div>
                      <div>Lng: {livePosition.longitude.toFixed(6)}</div>
                      {livePosition.speed && (
                        <div className="mt-1">Vitesse: {livePosition.speed} km/h</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t("tracking.from")}</p>
                    <p className="font-medium">{displayData.origin}</p>
                  </div>
                </div>
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t("tracking.to")}</p>
                    <p className="font-medium">{displayData.destination}</p>
                  </div>
                </div>
                <div className="flex items-start mb-4">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t("tracking.estimatedDelivery")}</p>
                    <p className="font-medium">{displayData.estimatedDelivery}</p>
                  </div>
                </div>
                
                {/* ETA temps réel - style original */}
                {eta && (
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">ETA estimé</p>
                      <p className="font-medium text-green-500">{formatETA(eta.estimatedMinutes)}</p>
                      {eta.trafficDelay > 0 && (
                        <p className="text-xs text-gray-500">+{eta.trafficDelay}min (trafic)</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex gap-4">
                <button className="flex items-center text-green-500 hover:text-green-600">
                  <Download className="h-5 w-5 mr-2" />
                  {t("tracking.downloadInvoice")}
                </button>
                <button 
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center text-gray-500 hover:text-gray-600"
                >
                  {showMap ? <EyeOff className="h-5 w-5 mr-2" /> : <Eye className="h-5 w-5 mr-2" />}
                  {showMap ? 'Masquer' : 'Voir'} la carte
                </button>
              </div>
              <button 
                onClick={() => reportIssue && reportIssue({ type: 'other', description: 'Problème signalé depuis l\'interface' })}
                className="flex items-center text-red-500 hover:text-red-600"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                {t("tracking.reportIssue")}
              </button>
            </div>
          </div>

          {/* Carte interactive - nouvelle fonctionnalité intégrée */}
          {showMap && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Localisation temps réel
              </h3>
              <TrackingMap 
                trackingData={displayData}
                livePosition={adaptedLivePosition}
                className="w-full"
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">{t("tracking.shipmentProgress")}</h2>

            <div className="space-y-6">
              {displayData.events?.map((event, index) => {
                const eventStatus = getStatusInfo(event.status)
                return (
                  <div key={index} className="relative pl-8">
                    {index < displayData.events.length - 1 && (
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
                        {event.date} • {event.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}

