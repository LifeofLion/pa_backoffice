"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  AlertTriangle,
  Download,
  Phone,
  Flag,
  Wifi,
  WifiOff,
  Eye,
  EyeOff
} from 'lucide-react'
import { useTracking } from '@/src/hooks/use-tracking'
import { ClientLayout } from '@/src/components/layouts'
import dynamic from 'next/dynamic'

// Import dynamique de la carte pour éviter les erreurs SSR
const TrackingMap = dynamic(() => import('@/src/components/tracking/tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
      </div>
    </div>
  )
})

export default function TrackingClientNew() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMap, setShowMap] = useState(false)
  const { 
    trackingData, 
    livePosition, 
    eta, 
    loading, 
    error, 
    wsConnected,
    isMockMode,
    availableTestPackages,
    searchPackageByTracking,
    reportIssue
  } = useTracking()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    await searchPackageByTracking(searchQuery.trim())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleTestPackageClick = (trackingNumber: string) => {
    setSearchQuery(trackingNumber)
    searchPackageByTracking(trackingNumber)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'en_transit':
      case 'en_cours_de_livraison':
        return 'bg-blue-500 text-white'
      case 'livre':
      case 'completed':
        return 'bg-green-500 text-white'
      case 'en_attente':
      case 'pending':
        return 'bg-yellow-500 text-white'
      case 'retarde':
      case 'delayed':
        return 'bg-orange-500 text-white'
      case 'probleme':
      case 'issue':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR')
    } catch {
      return dateString
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

  return (
    <ClientLayout activeRoute="tracking">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-500 mb-2">
              Suivi de colis
            </h1>
            <p className="text-gray-600">
              Suivez vos colis en temps réel avec notre système de tracking avancé
            </p>
          </div>

          {/* Mode développement - Bannière avec colis de test */}
          {isMockMode && availableTestPackages.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Mode développement</strong> - Colis de test disponibles : {' '}
                {availableTestPackages.map((trackingNumber, index) => (
                  <span key={trackingNumber}>
                    <button
                      onClick={() => handleTestPackageClick(trackingNumber)}
                      className="underline hover:no-underline font-medium"
                    >
                      {trackingNumber}
                    </button>
                    {index < availableTestPackages.length - 1 && ', '}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Barre de recherche */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Entrez votre numéro de suivi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !searchQuery.trim()}
                  className="sm:w-auto"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Recherche...' : 'Suivre'}
                </Button>
              </div>

              {/* Indicateur de connexion WebSocket */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {wsConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span>Suivi temps réel actif</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span>Connexion temps réel indisponible</span>
                    </>
                  )}
                  {isMockMode && (
                    <Badge variant="secondary" className="ml-2">Simulation</Badge>
                  )}
                </div>

                {trackingData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showMap ? 'Masquer' : 'Voir'} la carte
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gestion des erreurs */}
          {error && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Résultats du tracking */}
          {trackingData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Informations principales */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{trackingData.packageName}</h3>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Numéro :</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {trackingData.trackingNumber}
                            </code>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Statut :</span>
                            <Badge className={getStatusColor(trackingData.status)}>
                              {trackingData.status}
                            </Badge>
                          </div>

                          {trackingData.origin && trackingData.destination && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="text-muted-foreground text-xs">De :</div>
                                <div className="font-medium">{trackingData.origin}</div>
                                <div className="text-muted-foreground text-xs mt-1">Vers :</div>
                                <div className="font-medium">{trackingData.destination}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations temps réel */}
                      <div className="sm:w-64 space-y-3">
                        {livePosition && (
                          <div className="bg-primary/10 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-2">
                              <Truck className="h-4 w-4" />
                              Position en temps réel
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Lat: {livePosition.latitude?.toFixed(6)}</div>
                              <div>Lng: {livePosition.longitude?.toFixed(6)}</div>
                              {livePosition.speed && (
                                <div className="mt-1">Vitesse: {livePosition.speed} km/h</div>
                              )}
                            </div>
                          </div>
                        )}

                        {eta && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm mb-1">
                              <Clock className="h-4 w-4" />
                              Temps estimé
                            </div>
                            <div className="text-lg font-bold text-blue-700">
                              {formatETA(eta.estimatedMinutes)}
                            </div>
                            {eta.trafficDelay > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                +{eta.trafficDelay}min (trafic)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carte interactive */}
                {showMap && (
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Suivi sur carte
                      </h4>
                      <TrackingMap 
                        trackingData={trackingData}
                        livePosition={adaptedLivePosition}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                {/* Historique des événements */}
                {trackingData.events && trackingData.events.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold mb-4">Historique de livraison</h4>
                      <div className="space-y-4">
                        {trackingData.events.map((event: any, index: number) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                              }`} />
                              {index < trackingData.events.length - 1 && (
                                <div className="w-px h-8 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">{event.description}</h5>
                                <span className="text-sm text-muted-foreground">
                                  {event.date && event.time 
                                    ? formatDate(`${event.date} ${event.time}`) 
                                    : event.timestamp 
                                      ? formatDate(event.timestamp)
                                      : 'Date non disponible'
                                  }
                                </span>
                              </div>
                              {event.location && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  📍 {event.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4">Actions</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Phone className="h-4 w-4 mr-2" />
                        Contacter le livreur
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => reportIssue && reportIssue({ type: 'general', description: 'Problème signalé depuis l\'interface' })}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Signaler un problème
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* État vide */}
          {!trackingData && !loading && !error && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Suivez votre colis</h3>
                <p className="text-muted-foreground mb-4">
                  Entrez votre numéro de suivi pour voir l'état de votre livraison en temps réel
                </p>
                {isMockMode && (
                  <p className="text-sm text-amber-600">
                    💡 Utilisez un des numéros de test ci-dessus pour tester le système
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ClientLayout>
  )
}
