"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  MapPin, 
  Clock, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Navigation,
  ArrowRight
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useTracking } from "@/src/hooks/use-tracking"
import { useAuth } from "@/src/hooks/use-auth"
import { ClientLayout } from "@/src/components/layouts"

// =============================================================================
// COMPOSANT PRINCIPAL DE RECHERCHE DE TRACKING
// =============================================================================

export default function ClientTrackingSearch() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Utilisation du hook moderne de tracking
  const { 
    userTrackingHistory,
    loading,
    error,
    wsConnected,
    isMockMode,
    availableTestPackages,
    searchPackageByTracking,
    loadUserRecentPackages,
    clearError
  } = useTracking()

  // États locaux
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recentPackages, setRecentPackages] = useState<TrackingData[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const [createTestLoading, setCreateTestLoading] = useState(false)

  // Charger les colis récents de l'utilisateur
  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return
      
      setIsLoadingRecent(true)
      try {
        const recent = await loadUserRecentPackages()
        setRecentPackages(recent)
      } catch (error) {
        console.error('Erreur chargement colis récents:', error)
      } finally {
        setIsLoadingRecent(false)
      }
    }

    loadRecent()
  }, [user, loadUserRecentPackages])

  // Créer un colis de test pour démonstration
  const createTestPackage = async () => {
    if (!user) return

    setCreateTestLoading(true)
    try {
      const { apiClient } = await import('@/src/lib/api')
      
      // Créer d'abord une annonce de test
      const annonceData = {
        utilisateur_id: user.id,
        title: `Test Colis ${Date.now()}`,
        description: 'Colis de test créé pour démonstration du tracking',
        price: 25.00,
        type: 'transport_colis',
        status: 'active',
        desired_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Demain
        start_location: '123 Rue de la Paix, 75001 Paris',
        end_location: '456 Avenue des Champs, 69000 Lyon',
        priority: false
      }

      console.log('🔨 Création annonce de test:', annonceData)
      const annonceResponse = await apiClient.createAnnouncement(annonceData)
      console.log('✅ Annonce créée:', annonceResponse)

      if (annonceResponse?.annonce?.id) {
        // Créer un colis pour cette annonce
        const colisData = {
          annonce_id: annonceResponse.annonce.id,
          weight: 2.5,
          length: 30,
          width: 20,
          height: 15,
          content_description: 'Colis de test pour démonstration'
        }

        console.log('📦 Création colis de test:', colisData)
        const colisResponse = await apiClient.post('/colis/create', colisData)
        console.log('✅ Colis créé:', colisResponse)

        if (colisResponse?.trackingNumber) {
          // Rediriger vers le tracking du nouveau colis
          router.push(`/app_client/tracking/${colisResponse.trackingNumber}`)
        } else {
          alert('Colis créé mais pas de numéro de tracking retourné')
        }
      }
    } catch (error) {
      console.error('❌ Erreur création colis test:', error)
      alert(`Erreur lors de la création du colis de test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setCreateTestLoading(false)
    }
  }

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    clearError()
    
    // Rediriger vers la page de détail
    router.push(`/app_client/tracking/${searchQuery.trim()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleTestPackageClick = (trackingNumber: string) => {
    setSearchQuery(trackingNumber)
    router.push(`/app_client/tracking/${trackingNumber}`)
  }

  const handleRecentPackageClick = (trackingNumber: string) => {
    router.push(`/app_client/tracking/${trackingNumber}`)
  }

  // =============================================================================
  // FONCTIONS UTILITAIRES
  // =============================================================================

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-blue-500 text-white'
      case 'delivered':
      case 'completed':
        return 'bg-green-500 text-white'
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-500 text-white'
      case 'delayed':
        return 'bg-orange-500 text-white'
      case 'exception':
      case 'failed':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
      case 'scheduled':
        return <Package className="h-4 w-4" />
      case 'exception':
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR')
    } catch {
      return dateString
    }
  }

  // =============================================================================
  // RENDU PRINCIPAL
  // =============================================================================

  return (
    <ClientLayout activeRoute="tracking">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* En-tête */}
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-green-500 mb-2">
                Suivi de colis
              </h1>
              <p className="text-gray-600">
                Suivez vos colis en temps réel avec notre système de tracking avancé
              </p>
            </div>
          </div>
          
          {/* Mode développement - Bannière avec colis de test */}
          {isMockMode && availableTestPackages.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                <strong className="text-amber-800">Mode développement</strong>
                <span className="ml-2 text-amber-700">- Colis de test disponibles :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTestPackages.map((trackingNumber) => (
                  <button
                    key={trackingNumber}
                    onClick={() => handleTestPackageClick(trackingNumber)}
                    className="px-3 py-1 text-xs bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 transition-colors text-amber-800"
                  >
                    {trackingNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Entrez votre numéro de suivi..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Rechercher'
                )}
              </button>
            </div>

            {/* Indicateur de connexion temps réel */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
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
                  <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Simulation
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gestion des erreurs */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* État initial */}
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Suivez votre colis</h3>
              <p className="text-gray-600 mb-4">
                Entrez votre numéro de suivi pour voir l'état de votre livraison en temps réel
              </p>
              {isMockMode && (
                <p className="text-sm text-amber-600">
                  💡 Utilisez un des numéros de test ci-dessus pour tester le système
                </p>
              )}
            </div>
          )}

          {/* Colis récents de l'utilisateur */}
          {userTrackingHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Mes colis récents</h3>
                <button
                  onClick={loadUserRecentPackages}
                  className="text-sm text-green-600 hover:text-green-700 transition-colors"
                >
                  Actualiser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTrackingHistory.slice(0, 6).map((packageData) => (
                  <div 
                    key={packageData.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleRecentPackageClick(packageData.trackingNumber)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(packageData.status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{packageData.packageName}</h4>
                        <p className="text-xs text-gray-500 truncate font-mono">{packageData.trackingNumber}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 mb-3 ${getStatusColor(packageData.status)}`}>
                      {packageData.status}
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{packageData.origin}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span className="truncate">{packageData.destination}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{packageData.estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {userTrackingHistory.length > 6 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Et {userTrackingHistory.length - 6} autres colis...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section d'aide */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Comment utiliser le suivi ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Entrez votre numéro</h4>
                  <p className="text-gray-600">Saisissez le numéro de suivi reçu par email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Suivez en temps réel</h4>
                  <p className="text-gray-600">Voir la position et l'ETA de votre colis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Recevez votre colis</h4>
                  <p className="text-gray-600">Soyez notifié de l'arrivée de votre livreur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ClientLayout>
  )
} 