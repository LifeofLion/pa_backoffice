"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useLanguage } from "@/components/language-context"
import LanguageSelector from "@/components/language-selector"
import { 
  Package, 
  ChevronDown, 
  MapPin, 
  Navigation, 
  Play, 
  Square, 
  RefreshCw,
  Route,
  Map
} from "lucide-react"
import { useDeliveryman } from "@/src/hooks/use-deliveryman"
import { useTracking } from "@/src/hooks/use-tracking"
import { useAuth } from "@/src/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { GenerateCodeButton } from "./deliveryman-generate-code"

// ✅ Import dynamique pour éviter l'erreur SSR avec Leaflet
const TrackingMap = dynamic(() => import("@/src/components/tracking/tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  )
})

// ✅ NOUVEAU - Import de la carte améliorée avec routing réel
const EnhancedTrackingMap = dynamic(() => import("@/src/components/tracking/enhanced-tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Calcul du trajet planifié...</p>
      </div>
      
    </div>
  )
})

interface DeliveryData {
  id: string | number
  name?: string
  image?: string
  sender?: string
  deliveryAddress?: string
  pickupLocation?: string
  dropoffLocation?: string
  price?: string
  deliveryDate?: string
  amount?: number
  storageBox?: string
  size?: string
  statusText?: string
  timeAway?: string
  annonceId?: number
  livreurId?: number
  statut?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  livreur?: any
  trackingNumber?: string
  weight?: string
  dimensions?: string
  annonce?: any
  clientInfo?: {
    firstName: string
    lastName: string
  }
}

export default function DeliverymanDeliveryDetail({ id }: { id: string }) {
  const { t } = useLanguage()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [code, setCode] = useState<string[]>(Array(6).fill(""))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTrackingModule, setShowTrackingModule] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null) // 🆕 Code généré par l'API
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const {
    myLivraisons,
    loading: deliveriesLoading,
    error: deliveriesError,
    updateLivraisonStatus,
    refreshData
  } = useDeliveryman()

  // ✅ NOUVEAU - Hook de tracking pour livreur
  const {
    trackingData,
    livePosition,
    eta,
    loading: trackingLoading,
    error: trackingError,
    searchPackageByTracking,
    isTrackingActive,
    hasLiveTracking,
    clearError: clearTrackingError,
    clearTracking
  } = useTracking()

  // ✅ NOUVEAU - État pour la mise à jour de position livreur
  const [isUpdatingPosition, setIsUpdatingPosition] = useState(false)

  // ✅ NOUVEAU - State local pour les données de simulation tracking
  const [localTrackingData, setLocalTrackingData] = useState<any>(null)
  const [localLivePosition, setLocalLivePosition] = useState<any>(null)

  const loadDeliveryData = async () => {
    try {
      setLoading(true)
      console.log('Chargement des détails de la livraison:', id)
      
      const existingLivraison = myLivraisons.find((l: any) => l.id === id)
      if (existingLivraison) {
        console.log('Livraison trouvée dans le hook:', existingLivraison)
        
        const deliveryData: DeliveryData = {
          id: existingLivraison.id,
          livreurId: parseInt(existingLivraison.id),
          status: existingLivraison.status,
          pickupLocation: existingLivraison.pickupLocation,
          dropoffLocation: existingLivraison.dropoffLocation,
          
          name: existingLivraison.colis?.[0]?.description || `Livraison #${existingLivraison.id}`,
          image: "/placeholder.svg",
          sender: existingLivraison.client.name,
          deliveryAddress: existingLivraison.dropoffLocation,
          price: existingLivraison.amount ? `€${existingLivraison.amount}` : "Prix non spécifié",
          deliveryDate: formatDate(existingLivraison.estimatedDeliveryTime || new Date().toISOString()),
          amount: 1,
          storageBox: "Consigne standard",
          size: "Medium",
          statut: mapStatus(existingLivraison.status),
          statusText: getStatusText(mapStatus(existingLivraison.status)),
          timeAway: "Distance estimée: 5 km",
          trackingNumber: `TRACK-${existingLivraison.id}`,
          weight: existingLivraison.colis?.[0]?.weight ? `${existingLivraison.colis[0].weight} kg` : "2.5 kg",
          dimensions: "30×20×15 cm",
          
          clientInfo: {
            firstName: existingLivraison.client.name.split(' ')[0] || '',
            lastName: existingLivraison.client.name.split(' ')[1] || ''
          }
        }

        setDelivery(deliveryData)
        setLoading(false)
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/livraisons/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
        },
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Erreur lors de la récupération de la livraison')
      
      const deliveryResponse = await response.json()
      console.log("Données de livraison récupérées:", deliveryResponse)
      
      const livraisonData = deliveryResponse.livraison || deliveryResponse
      
      const deliveryData: DeliveryData = {
        id: livraisonData.id,
        livreurId: livraisonData.livreurId,
        status: livraisonData.status,
        annonceId: livraisonData.annonceId,
        livreur: livraisonData.livreur,
        createdAt: livraisonData.createdAt || livraisonData.created_at,
        updatedAt: livraisonData.updatedAt || livraisonData.updated_at,
        pickupLocation: livraisonData.pickupLocation || livraisonData.pickup_location,
        dropoffLocation: livraisonData.dropoffLocation || livraisonData.dropoff_location,
        annonce: livraisonData.annonce,
        
        clientInfo: livraisonData.client ? {
          firstName: livraisonData.client.firstName || livraisonData.client.first_name || '',
          lastName: livraisonData.client.lastName || livraisonData.client.last_name || ''
        } : undefined,
        
        name: livraisonData.annonce?.title || `Livraison #${livraisonData.id}`,
        image: livraisonData.annonce?.imagePath ? `${process.env.NEXT_PUBLIC_API_URL}/${livraisonData.annonce.imagePath}` : "/placeholder.svg",
        sender: livraisonData.client ? `${livraisonData.client.firstName || livraisonData.client.first_name || ''} ${livraisonData.client.lastName || livraisonData.client.last_name || ''}`.trim() : "Client",
        deliveryAddress: livraisonData.dropoffLocation || livraisonData.dropoff_location || "Adresse non spécifiée",
        price: livraisonData.annonce?.price ? `€${livraisonData.annonce.price}` : "Prix non spécifié",
        deliveryDate: formatDate(livraisonData.createdAt || livraisonData.created_at),
        amount: 1,
        storageBox: "Consigne standard",
        size: "Medium",
        statut: mapStatus(livraisonData.status),
        statusText: getStatusText(mapStatus(livraisonData.status)),
        timeAway: "Distance estimée: 5 km",
        trackingNumber: `TRACK-${livraisonData.id}`,
        weight: "2.5 kg",
        dimensions: "30×20×15 cm"
      }

      setDelivery(deliveryData)
      console.log('Livraison formatée:', deliveryData)
      
    } catch (error) {
      console.error("Erreur lors du chargement de la livraison:", error)
      setError("Impossible de charger les détails de la livraison")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadDeliveryData()
    }
  }, [id, myLivraisons])

  const mapStatus = (apiStatus: string): string => {
    switch (apiStatus?.toLowerCase()) {
      case "scheduled":
        return "en_attente"
      case "in_progress":
        return "en_cours"
      case "completed":
        return "livré"
      case "cancelled":
        return "annulé"
      default:
        return apiStatus || "en_attente"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non spécifiée"
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Date invalide"
      }
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
      
      return date.toLocaleDateString('fr-FR', options)
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error)
      return "Date non spécifiée"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "en_attente":
        return "En attente"
      case "en_cours":
        return "En cours de livraison"
      case "livré":
        return "Livré"
      case "payé":
        return "Payé"
      default:
        return status
    }
  }

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    if (/^\d{1,6}$/.test(pastedData)) {
      const newCode = [...code]
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newCode[i] = pastedData[i]
      }
      setCode(newCode)

      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  // 🆕 NOUVELLE FONCTION - Gérer le code généré par l'API
  const handleCodeGenerated = (newCode: string) => {
    console.log('✅ Code généré reçu:', newCode)
    setGeneratedCode(newCode)
    
    // Pré-remplir automatiquement le mode test avec le code généré
    if (newCode && newCode.length === 6) {
      const codeArray = newCode.split('')
      setCode(codeArray)
      console.log('✅ Mode test pré-rempli avec le code généré')
    }
    
    toast({
      title: '✅ Code généré !',
      description: `Le code ${newCode} a été automatiquement inséré dans le mode test.`,
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const verificationCode = code.join("")
    
    try {
      if (!delivery) {
        setIsSubmitting(false)
        return
      }
      
      const trackingCode = delivery.trackingNumber?.replace(/\D/g, '').substring(0, 6)
      // 🆕 Inclure le code généré par l'API dans les codes valides
      const validCodes = ["123456", trackingCode, generatedCode].filter(Boolean)
      
      if (validCodes.includes(verificationCode)) {
        console.log("Code validé, mise à jour du statut de la livraison");
        
        await updateLivraisonStatus(id, 'completed')
        
        // Arrêter le tracking quand livraison terminée
        if (isTrackingActive) {
          clearTracking()
        }
        
        setDelivery({
          ...delivery,
          statut: "livré",
          status: "completed",
          statusText: "Livré"
        })
        
        alert(t("deliveryman.codeValidated"))
        
        refreshData()
      } else {
        alert(t("deliveryman.invalidCode"))
      }
    } catch (error) {
      console.error("Erreur lors de la validation du code:", error)
      alert("Une erreur est survenue lors de la validation du code")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ NOUVELLE FONCTION - Convertir adresse en coordonnées GPS
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      // Utiliser l'API Nominatim d'OpenStreetMap (gratuite)
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
      return null
    } catch (error) {
      console.error('❌ Erreur géocodage:', error)
      return null
    }
  }

  // ✅ NOUVELLE FONCTION - Démarrer le tracking en recherchant le colis
  const startDeliveryTracking = useCallback(async () => {
    if (!delivery?.trackingNumber) {
      console.log('❌ Pas de numéro de tracking disponible')
      return
    }
    
    if (!user?.id) {
      console.log('❌ Utilisateur non connecté, tracking impossible')
      return
    }
    
    try {
      setIsUpdatingPosition(true)
      console.log('🚀 Démarrage navigation pour:', delivery.trackingNumber, 'utilisateur:', user.id)
      
      // Vérifier si c'est un numéro de test ECO-TEST-*
      const isTestNumber = delivery.trackingNumber.startsWith('ECO-TEST-')
      
      if (isTestNumber) {
        // Pour les numéros de test, utiliser la fonction normale
        await searchPackageByTracking(delivery.trackingNumber)
        console.log('✅ Tracking démarré avec données de test')
      } else {
        // ✅ NOUVEAU - Approche réaliste avec géolocalisation + géocodage
        console.log('🗺️ Création du trajet réel depuis la position du livreur')
        
        // 1. Obtenir la position réelle du livreur
        const livreurPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          })
        })
        
        // 2. Convertir l'adresse de destination en coordonnées
        console.log('📍 Géocodage de l\'adresse:', delivery.deliveryAddress)
        const destinationCoords = await geocodeAddress(delivery.deliveryAddress || '')
        
        if (!destinationCoords) {
          throw new Error('Impossible de localiser l\'adresse de destination')
        }
        
        console.log('✅ Destination trouvée:', destinationCoords)
        
        const realTrackingData = {
          id: delivery.trackingNumber,
          trackingNumber: delivery.trackingNumber,
          status: 'in_transit' as const,
          packageName: delivery.name || 'Colis',
          sender: delivery.sender || 'EcoDeli',
          recipient: 'Client',
          origin: 'Position livreur',
          destination: delivery.deliveryAddress || 'Adresse de livraison',
          estimatedDelivery: delivery.deliveryDate || new Date().toLocaleDateString('fr-FR'),
          shippedDate: new Date().toISOString(),
          events: [
            {
              id: '1',
              date: new Date().toLocaleDateString('fr-FR'),
              time: new Date().toLocaleTimeString('fr-FR'),
              location: delivery.deliveryAddress || 'Destination',
              status: 'out_for_delivery',
              description: 'Destination finale',
              latitude: destinationCoords.lat,
              longitude: destinationCoords.lng
            },
            {
              id: '2',
              date: new Date().toLocaleDateString('fr-FR'),
              time: new Date().toLocaleTimeString('fr-FR'),
              location: 'Position actuelle du livreur',
              status: 'picked_up',
              description: 'Colis récupéré - En route vers la destination',
              latitude: livreurPosition.coords.latitude,
              longitude: livreurPosition.coords.longitude
            }
          ],
          // Position réelle du livreur
          currentLocation: {
            latitude: livreurPosition.coords.latitude,
            longitude: livreurPosition.coords.longitude,
            accuracy: livreurPosition.coords.accuracy,
            timestamp: new Date().toISOString()
          }
        }
        
        // ✅ Stocker les données réelles dans les states locaux
        setLocalTrackingData(realTrackingData)
        setLocalLivePosition(realTrackingData.currentLocation)
        
        console.log('✅ Navigation créée avec itinéraire complet')
        console.log('📍 Position livreur:', realTrackingData.currentLocation)
        console.log('🎯 Destination:', destinationCoords)
        console.log('🛣️ Itinéraire: Position → Destination')
      }
      
    } catch (error) {
      console.error('❌ Erreur démarrage navigation:', error)
      
      // Fallback si géolocalisation échoue
      if (!navigator.geolocation) {
        alert('Géolocalisation non supportée par ce navigateur')
      } else if (error instanceof Error && error.message.includes('adresse')) {
        alert(`Impossible de localiser l'adresse: ${delivery.deliveryAddress}`)
      } else {
        alert('Impossible d\'accéder à votre position. Vérifiez les autorisations de géolocalisation.')
      }
      
      console.log('📝 Navigation non disponible')
    } finally {
      setIsUpdatingPosition(false)
    }
  }, [delivery?.trackingNumber, delivery?.name, delivery?.sender, delivery?.deliveryAddress, delivery?.deliveryDate, user?.id, searchPackageByTracking])

  // ✅ NOUVELLE FONCTION - Mise à jour manuelle de position livreur
  const updateDeliverymanPosition = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur")
      return
    }

    setIsUpdatingPosition(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      // Appel API pour mettre à jour la position du livreur
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracking/update-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken') || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          livraison_id: delivery?.id
        })
      })

      if (response.ok) {
        console.log('✅ Position mise à jour')
        // Recharger les données de tracking
        await startDeliveryTracking()
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }

    } catch (error) {
      console.error('❌ Erreur mise à jour position:', error)
      alert('Impossible de mettre à jour votre position')
    } finally {
      setIsUpdatingPosition(false)
    }
  }, [delivery?.id, startDeliveryTracking])

  // ✅ Auto-démarrage du tracking quand livraison en cours
  useEffect(() => {
    if (delivery?.statut === "en_cours" && delivery?.trackingNumber && !trackingData) {
      startDeliveryTracking()
    }
  }, [delivery?.statut, delivery?.trackingNumber, trackingData, startDeliveryTracking])

  // ✅ NOUVELLE FONCTION - Démarrer la livraison avec tracking
  const handleStartDeliveryWithTracking = async () => {
    try {
      console.log("Démarrage de la livraison avec tracking");
      
      // 1. Mettre à jour le statut de la livraison
      await updateLivraisonStatus(id, 'in_progress')
      
      // 2. Mettre à jour l'état local
      setDelivery({
        ...delivery!,
        statut: "en_cours",
        status: "in_progress",
        statusText: "En cours de livraison"
      })
      
      // 3. Démarrer le tracking GPS si on a un numéro de tracking
      if (delivery?.trackingNumber) {
        await startDeliveryTracking()
      }
      
      alert("✅ Livraison démarrée ! Le tracking GPS est maintenant actif.")
      
      refreshData()
    } catch (error) {
      console.error("Erreur lors du démarrage de la livraison:", error)
      alert("Une erreur est survenue lors du démarrage de la livraison")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
        <Link href="/app_deliveryman/deliveries" className="text-green-500 hover:text-green-600 transition-colors">
          {t("deliveryman.deliveries.backToDeliveries")}
        </Link>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">{t("deliveryman.deliveries.deliveryNotFound")}</h2>
        <Link href="/app_deliveryman/deliveries" className="text-green-500 hover:text-green-600 transition-colors">
          {t("deliveryman.deliveries.backToDeliveries")}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm">
        <Link href="/app_deliveryman" className="flex items-center">
          <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto" />
        </Link>

        <div className="flex items-center mr-20">
          <LanguageSelector />
        </div>
      </header>

      <div className="p-6">
        <div className="mb-6">
          <Link href="/app_deliveryman/deliveries" className="text-green-500 hover:underline flex items-center">
            <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
            {t("deliveryman.backToDeliveries")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">{t("deliveryman.deliveryDetails")}</h1>

        {/* ✅ NOUVEAU - Module de Tracking GPS pour livreur */}
        {delivery.statut === "en_cours" && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Navigation className="h-5 w-5 mr-2 text-blue-500" />
                Navigation GPS
              </h3>
              
              <div className="flex items-center space-x-3">
                {isTrackingActive ? (
                  <>
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm font-medium">Tracking actif</span>
                    </div>
                    <button
                      onClick={clearTracking}
                      className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Arrêter
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startDeliveryTracking}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Démarrer navigation
                  </button>
                )}
              </div>
            </div>

            {/* ✅ NOUVEAU - Carte interactive Leaflet (données réelles ou simulées) */}
            {(trackingData || localTrackingData) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium flex items-center">
                    <Map className="h-4 w-4 mr-2 text-blue-500" />
                    Carte de navigation
                    {localTrackingData && !trackingData && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Simulation</span>
                    )}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {trackingData ? 'Position mise à jour en temps réel' : 'Données simulées'}
                  </div>
                </div>
                
                <EnhancedTrackingMap 
                  trackingData={{
                    ...(trackingData || localTrackingData),
                    packageName: delivery.name,
                    origin: delivery.pickupLocation || 'Point de récupération',
                    destination: delivery.deliveryAddress || 'Adresse de livraison'
                  }}
                  livePosition={(livePosition || localLivePosition) ? {
                    lat: (livePosition || localLivePosition).latitude,
                    lng: (livePosition || localLivePosition).longitude
                  } : null}
                  className="h-[400px]"
                />
              </div>
            )}

            {/* Informations de position actuelle */}
            {(livePosition || localLivePosition) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center text-blue-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Position actuelle</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {(livePosition || localLivePosition).latitude.toFixed(6)}, {(livePosition || localLivePosition).longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-blue-500">
                    Précision: {(livePosition || localLivePosition).accuracy?.toFixed(0)}m
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex items-center text-green-700">
                    <Route className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Destination</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {delivery.deliveryAddress}
                  </p>
                  <p className="text-xs text-green-500">
                    Trajet en cours...
                  </p>
                </div>
              </div>
            )}

            {/* Actions rapides pour la navigation */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(delivery.deliveryAddress || '')}&mode=driving`, '_blank')}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Ouvrir dans Google Maps
              </button>

              <button
                onClick={() => window.open(`https://waze.com/ul?ll=${livePosition?.latitude || 0},${livePosition?.longitude || 0}&navigate=yes&zoom=17`, '_blank')}
                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600"
              >
                <Route className="h-4 w-4 mr-2" />
                Ouvrir dans Waze
              </button>

              <button
                onClick={updateDeliverymanPosition}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser position
              </button>
            </div>

            {trackingError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                ⚠️ {trackingError}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-center mb-6">
              <div className="relative w-full max-w-md h-64">
                <Image src={delivery.image || "/placeholder.svg"} alt={delivery.name || ""} fill className="object-contain rounded-md" />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">{delivery.name}</h2>

            <div className="space-y-3">
              <p>
                <span className="font-medium">{t("deliveryman.deliveryFor")}</span> {delivery.sender}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.deliveryAddress")}</span>:{" "}
                {delivery.deliveryAddress}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.pickupLocation")}</span>:{" "}
                {delivery.pickupLocation}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.priceForDelivery")}</span>: {delivery.price}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.deliveryDate")}</span>: {delivery.deliveryDate}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.trackingNumber")}</span>: {delivery.trackingNumber}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.weight")}</span>: {delivery.weight}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.dimensions")}</span>: {delivery.dimensions}
              </p>
              <p>
                <span className="font-medium">{t("deliveryman.status")}</span>: {delivery.statusText}
              </p>

              <div className="flex items-center mt-4">
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                  <Package className="w-4 h-4 mr-1" />
                  {delivery.size}
                </span>
              </div>
            </div>
          </div>

          {delivery.statut === "en_cours" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">🚚 Livraison arrivée ?</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>📍 Instructions sécurisées :</strong><br/>
                  1. Livrez le colis au client physiquement<br/>
                  2. Générez le code de validation ci-dessous<br/>
                  3. Communiquez le code au client (verbalement/SMS)<br/>
                  4. Le client validera la réception avec ce code
                </p>
              </div>
              
              {/* 🚀 NOUVEAU: Bouton de génération de code connecté */}
              <div className="text-center">
                <GenerateCodeButton
                  livraisonId={delivery.id}
                  clientName={delivery.clientInfo ? `${delivery.clientInfo.firstName} ${delivery.clientInfo.lastName}` : delivery.sender || 'Client'}
                  isDelivered={true}
                  className="w-full mb-4"
                  onCodeGenerated={handleCodeGenerated}
                />
              </div>
              
              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">ou</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              {/* Ancien système de saisie de code (pour test) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold mb-3 text-gray-700">
                  Mode test - Saisir un code
                  {generatedCode && (
                    <span className="ml-2 text-sm text-green-600 font-normal">
                      (Code généré: {generatedCode})
                    </span>
                  )}
                </h3>
              
                <div className="flex justify-center space-x-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                      className="w-10 h-12 text-center text-lg font-bold rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || code.some((digit) => digit === "")}
                  className={`w-full py-2 rounded-md text-white text-sm ${
                  isSubmitting || code.some((digit) => digit === "")
                    ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                  {isSubmitting ? "Validation..." : "Valider (mode test)"}
              </button>
              
                <div className="text-xs text-gray-500 mt-2 text-center">
                  <p>Codes valides :</p>
                  <p>• Code test fixe: 123456</p>
                  {generatedCode && <p className="text-green-600">• Code généré: {generatedCode}</p>}
                  <p>• Code tracking: {delivery.trackingNumber?.replace(/\D/g, '').substring(0, 6) || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          
          {delivery.statut === "livré" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-green-600">{t("deliveryman.deliveryCompleted")}</h2>
              <p className="text-gray-600 mb-4">{t("deliveryman.deliveryCompletedDescription")}</p>
              
              <div className="bg-green-50 p-4 rounded-md text-green-700">
                <p className="font-medium">{t("deliveryman.thankYou")}</p>
              </div>
            </div>
          )}
          
          {delivery.statut === "en_attente" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">{t("deliveryman.startDelivery")}</h2>
              <p className="text-gray-600 mb-4">{t("deliveryman.startDeliveryDescription")}</p>
              
              <button
                type="button"
                onClick={handleStartDeliveryWithTracking}
                className="w-full py-2 rounded-md text-white bg-green-500 hover:bg-green-600 flex items-center justify-center"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {t("deliveryman.startDelivery")} + GPS
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                ✨ Le tracking GPS se démarrera automatiquement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 