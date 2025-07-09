"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Download, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Wifi, 
  WifiOff, 
  Clock,
  User,
  Phone,
  Navigation,
  AlertTriangle
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useTracking } from "@/src/hooks/use-tracking"
import { ClientLayout } from "@/src/components/layouts"
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import dynamique de la carte pour éviter les erreurs SSR
const EnhancedTrackingMap = dynamic(() => import('@/src/components/tracking/enhanced-tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      Chargement de la carte...
    </div>
  )
})

// =============================================================================
// COMPOSANT PRINCIPAL DE TRACKING DETAIL REFACTORISÉ
// =============================================================================

interface ClientTrackingDetailProps {
  id: string
}

export default function ClientTrackingDetail({ id }: ClientTrackingDetailProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [showMap, setShowMap] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  
  // Utilisation du hook moderne de tracking
  const { 
    trackingData,
    livePosition,
    eta,
    loading,
    error,
    wsConnected,
    searchPackageByTracking,
    reportIssue
  } = useTracking()

  // Rechercher automatiquement le colis au montage
  useEffect(() => {
    if (id && searchPackageByTracking) {
      console.log('🔍 Recherche du colis:', id)
      searchPackageByTracking(id)
    }
  }, [id, searchPackageByTracking])

  // Test API direct pour debug
  const testApiDirect = async () => {
    try {
      setDebugMode(true)
      const { apiClient } = await import('@/src/lib/api')
      
      console.log('🧪 Test API direct pour:', id)
      const response = await apiClient.getPackageTracking(id)
      console.log('📦 Réponse API brute:', response)
      setDebugData(response)
    } catch (error) {
      console.error('❌ Erreur API:', error)
      setDebugData({ error: error instanceof Error ? error.message : 'Erreur inconnue' })
    }
  }

  // =============================================================================
  // FONCTIONS UTILITAIRES
  // =============================================================================

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
      case "created":
      case "scheduled":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <Package className="h-5 w-5 text-yellow-600" />,
          text: t("tracking.pending"),
        }
      case "in_transit":
      case "in_progress":
      case "picked_up":
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <Truck className="h-5 w-5 text-blue-600" />,
          text: t("tracking.inTransit"),
        }
      case "out_for_delivery":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: <Navigation className="h-5 w-5 text-purple-600" />,
          text: "En cours de livraison",
        }
      case "delivered":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: t("tracking.delivered"),
        }
      case "exception":
      case "cancelled":
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // =============================================================================
  // GESTION DES ÉTATS DE CHARGEMENT ET D'ERREUR
  // =============================================================================

  if (loading) {
    return (
      <ClientLayout activeRoute="tracking">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Recherche du colis en cours...</p>
              </div>
            </div>
          </div>
        </main>
      </ClientLayout>
    )
  }

  if (error) {
    return (
      <ClientLayout activeRoute="tracking">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 space-y-4">
              <Button
                onClick={() => router.push('/app_client/tracking')}
                variant="outline"
                className="w-full"
              >
                Retour à la recherche
              </Button>
              
              <Button
                onClick={testApiDirect}
                variant="secondary"
                className="w-full"
              >
                🧪 Test API Direct (Debug)
              </Button>
              
              {debugMode && debugData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Debug - Réponse API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </ClientLayout>
    )
  }

  if (!trackingData) {
    return (
      <ClientLayout activeRoute="tracking">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Aucune donnée de tracking trouvée pour ce numéro.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 space-y-4">
              <Button
                onClick={() => router.push('/app_client/tracking')}
                variant="outline"
                className="w-full"
              >
                Retour à la recherche
              </Button>
              
              <Button
                onClick={testApiDirect}
                variant="secondary"
                className="w-full"
              >
                🧪 Test API Direct (Debug)
              </Button>
              
              {debugMode && debugData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Debug - Réponse API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </ClientLayout>
    )
  }

  const statusInfo = getStatusInfo(trackingData.status)

  // Adapter la position live au format attendu par la carte
  const adaptedLivePosition = livePosition && 
    typeof livePosition.latitude === 'number' && 
    typeof livePosition.longitude === 'number' ? {
    lat: livePosition.latitude,
    lng: livePosition.longitude
  } : null

  // =============================================================================
  // RENDU PRINCIPAL
  // =============================================================================

  return (
    <ClientLayout activeRoute="tracking">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link href="/app_client/tracking" className="inline-flex items-center text-gray-600 hover:text-green-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tracking
            </Link>
          </div>

          {/* En-tête avec statut */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Suivi de votre colis</h1>
                <p className="text-gray-500 mb-1">
                  Numéro de suivi: <span className="font-mono font-medium">{trackingData.trackingNumber}</span>
                </p>
                {trackingData.packageName && (
                  <p className="text-gray-600">
                    <strong>{trackingData.packageName}</strong>
                  </p>
                )}
                
                {/* Indicateur de connexion temps réel */}
                <div className="flex items-center mt-2 text-xs">
                  {wsConnected ? (
                    <div className="flex items-center text-green-600">
                      <Wifi className="h-3 w-3 mr-1" />
                      <span>Suivi en temps réel</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <WifiOff className="h-3 w-3 mr-1" />
                      <span>Données mises à jour périodiquement</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Badge de statut */}
              <div className={`mt-4 sm:mt-0 px-4 py-2 rounded-full ${statusInfo.color} flex items-center`}>
                {statusInfo.icon}
                <span className="ml-2 font-medium">{statusInfo.text}</span>
              </div>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Colonne gauche - Informations du colis */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Informations du colis</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <User className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Expéditeur</p>
                        <p className="font-medium">{trackingData.sender}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <User className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Destinataire</p>
                        <p className="font-medium">{trackingData.recipient}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations du livreur */}
                {trackingData.livreur && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-700 font-medium text-sm mb-2">
                      <Truck className="h-4 w-4 mr-2" />
                      Votre livreur
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-800">{trackingData.livreur.name}</div>
                      {trackingData.livreur.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {trackingData.livreur.phone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Position temps réel */}
                {livePosition && typeof livePosition.latitude === 'number' && typeof livePosition.longitude === 'number' && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-blue-700 font-medium text-sm mb-2">
                      <Navigation className="h-4 w-4 mr-2" />
                      Position en temps réel
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Live
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Latitude:</span> {livePosition.latitude.toFixed(6)}
                      </div>
                      <div>
                        <span className="font-medium">Longitude:</span> {livePosition.longitude.toFixed(6)}
                      </div>
                      {livePosition.speed && typeof livePosition.speed === 'number' && (
                        <div>
                          <span className="font-medium">Vitesse:</span> {livePosition.speed.toFixed(0)} km/h
                        </div>
                      )}
                      {livePosition.timestamp && (
                        <div>
                          <span className="font-medium">Dernière MAJ:</span> {formatTime(livePosition.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Colonne droite - Adresses et dates */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Itinéraire</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Point de départ</p>
                        <p className="font-medium">{trackingData.origin}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="font-medium">{trackingData.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Dates importantes</h3>
                  
                  <div className="space-y-3">
                    {trackingData.shippedDate && (
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Date d'expédition</p>
                          <p className="font-medium">{formatDate(trackingData.shippedDate)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Livraison estimée</p>
                        <p className="font-medium">{trackingData.estimatedDelivery}</p>
                      </div>
                    </div>

                    {/* ETA temps réel */}
                    {eta && (
                      <div className="flex items-start">
                        <Clock className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Temps d'arrivée estimé</p>
                          <p className="font-medium text-green-600">{formatETA(eta.estimatedMinutes)}</p>
                          {eta.trafficDelay > 0 && (
                            <p className="text-xs text-orange-600">+{eta.trafficDelay}min (trafic)</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={() => setShowMap(!showMap)}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showMap ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showMap ? 'Masquer' : 'Voir'} la carte
              </button>
              
              <button className="flex items-center text-green-600 hover:text-green-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le récépissé
              </button>
              
              <button 
                onClick={() => reportIssue && reportIssue({ 
                  type: 'other', 
                  description: 'Problème signalé depuis l\'interface de tracking' 
                })}
                className="flex items-center text-red-600 hover:text-red-700 transition-colors"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Signaler un problème
              </button>
            </div>
          </div>

          {/* Carte interactive */}
          {showMap && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Localisation en temps réel
                {livePosition && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Position live
                  </span>
                )}
              </h3>
              
              <EnhancedTrackingMap 
                trackingData={trackingData}
                livePosition={adaptedLivePosition}
                deliveryAddress={trackingData.destination}
                className="w-full h-[400px]"
                showInstructions={false}
                onRouteCalculated={(route) => {
                  console.log('📍 Trajet calculé côté client:', route)
                }}
              />
              
              {/* Informations supplémentaires du trajet */}
              {livePosition && typeof livePosition.latitude === 'number' && typeof livePosition.longitude === 'number' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Position actuelle:</span>
                      <div className="font-mono text-xs text-gray-600">
                        {livePosition.latitude.toFixed(6)}, {livePosition.longitude.toFixed(6)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Dernière mise à jour:</span>
                      <div className="text-gray-600">
                        {livePosition.timestamp ? formatTime(livePosition.timestamp) : 'N/A'}
                      </div>
                    </div>
                    {eta && (
                      <div>
                        <span className="text-gray-500">Temps estimé:</span>
                        <div className="text-green-600 font-medium">
                          {formatETA(eta.estimatedMinutes)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historique des événements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Historique du colis</h2>

            <div className="space-y-6">
              {trackingData.events && trackingData.events.length > 0 ? (
                trackingData.events.map((event, index) => {
                  const eventStatus = getStatusInfo(event.status)
                  return (
                    <div key={event.id || index} className="relative pl-8">
                      {index < trackingData.events.length - 1 && (
                        <div className="absolute left-[0.9375rem] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-1">
                        <div className={`p-1 rounded-full ${index === 0 ? "bg-green-100" : "bg-gray-100"}`}>
                          {eventStatus.icon}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.description}</p>
                        <p className="text-sm text-gray-600">{event.location}</p>
                        <p className="text-sm text-gray-500">
                          {event.date} • {event.time}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun événement de tracking disponible pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ClientLayout>
  )
} 