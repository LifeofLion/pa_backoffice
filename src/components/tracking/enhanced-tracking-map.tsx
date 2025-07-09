"use client"

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import NavigationPanel from './navigation-panel'

// Fix pour les icônes Leaflet dans Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// =============================================================================
// INTERFACES
// =============================================================================

interface EnhancedTrackingMapProps {
  trackingData: any
  livePosition?: { lat: number; lng: number } | null
  className?: string
  deliveryAddress?: string
  onRouteCalculated?: (route: any) => void
  showInstructions?: boolean
}

interface RouteInstruction {
  text: string
  distance: number
  time: number
  direction?: string
  road?: string
}

// =============================================================================
// ICÔNES PERSONNALISÉES
// =============================================================================

const createCustomIcon = (color: string, symbol: string, size: number = 30) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        font-size: ${size * 0.4}px;
        color: white;
        font-weight: bold;
      ">${symbol}</div>
    `,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const createDeliveryTruckIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        <span style="font-size: 16px;">🚛</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: 'truck-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// =============================================================================
// SERVICE DE GÉOCODAGE SIMPLE
// =============================================================================

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Erreur géocodage:', error)
    return null
  }
}

// =============================================================================
// SERVICE DE ROUTAGE SIMPLE AVEC OSRM
// =============================================================================

async function calculateRoute(start: L.LatLng, end: L.LatLng): Promise<any> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      
      // Convertir les coordonnées en LatLng
      const coordinates = route.geometry.coordinates.map((coord: number[]) => 
        L.latLng(coord[1], coord[0])
      )
      
      // Extraire les instructions
      const instructions = route.legs[0]?.steps?.map((step: any) => ({
        text: step.maneuver?.instruction || 'Continuer',
        distance: step.distance,
        time: step.duration,
        direction: step.maneuver?.modifier,
        road: step.name
      })) || []
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        instructions
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur calcul route:', error)
    return null
  }
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function EnhancedTrackingMap({ 
  trackingData, 
  livePosition, 
  className = '',
  deliveryAddress,
  onRouteCalculated,
  showInstructions = false
}: EnhancedTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  
  const [routeInstructions, setRouteInstructions] = useState<RouteInstruction[]>([])
  const [routeDistance, setRouteDistance] = useState<string>('')
  const [routeTime, setRouteTime] = useState<string>('')
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // =============================================================================
  // INITIALISATION DE LA CARTE
  // =============================================================================

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Créer la carte
    const map = L.map(mapContainer.current, {
      center: [46.227638, 2.213749], // Centre de la France
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    })
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Ajouter le style pour l'animation pulse
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `
    document.head.appendChild(style)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // =============================================================================
  // CALCUL ET AFFICHAGE DU TRAJET
  // =============================================================================

  useEffect(() => {
    if (!mapRef.current || !trackingData) return

    calculateAndDisplayRoute()
  }, [trackingData, livePosition, deliveryAddress])

  const calculateAndDisplayRoute = async () => {
    if (!mapRef.current) return

    setIsCalculatingRoute(true)

    try {
      // Nettoyer les anciens éléments
      if (routeLayerRef.current) {
        mapRef.current.removeLayer(routeLayerRef.current)
        routeLayerRef.current = null
      }
      
      markersRef.current.forEach(marker => {
        mapRef.current?.removeLayer(marker)
      })
      markersRef.current = []

      // Déterminer les points de départ et d'arrivée
      let startPoint: L.LatLng | null = null
      let endPoint: L.LatLng | null = null

      // 1. Position live du livreur comme point de départ
      if (livePosition) {
        startPoint = L.latLng(livePosition.lat, livePosition.lng)
      }

      // 2. Géocoder l'adresse de livraison pour le point d'arrivée
      if (deliveryAddress) {
        const coords = await geocodeAddress(deliveryAddress)
        if (coords) {
          endPoint = L.latLng(coords.lat, coords.lng)
        }
      }

      // 3. Fallback sur les données de tracking
      if (!startPoint || !endPoint) {
        const events = trackingData.events || []
        
        if (events.length >= 2) {
          const lastEvent = events[events.length - 1]
          const firstEvent = events[0]
          
          if (!startPoint && lastEvent.latitude && lastEvent.longitude) {
            startPoint = L.latLng(lastEvent.latitude, lastEvent.longitude)
          }
          
          if (!endPoint && firstEvent.latitude && firstEvent.longitude) {
            endPoint = L.latLng(firstEvent.latitude, firstEvent.longitude)
          }
        }
      }

      // 4. Utiliser des coordonnées par défaut si nécessaire
      if (!startPoint || !endPoint) {
        console.log('🗺️ Utilisation des coordonnées par défaut pour', trackingData.trackingNumber)
        
        if (trackingData.trackingNumber === 'ECO-TEST-001') {
          startPoint = L.latLng(48.8566, 2.3522) // Paris
          endPoint = L.latLng(45.7640, 4.8357)   // Lyon
        } else if (trackingData.trackingNumber === 'ECO-TEST-002') {
          startPoint = L.latLng(43.6045, 1.4440) // Toulouse
          endPoint = L.latLng(44.8404, -0.5801)  // Bordeaux
        } else {
          startPoint = L.latLng(50.6292, 3.0573) // Lille
          endPoint = L.latLng(50.8503, 4.3517)   // Bruxelles
        }
      }

      // Calculer le trajet avec OSRM
      const routeData = await calculateRoute(startPoint, endPoint)
      
      if (routeData) {
        // Afficher le trajet sur la carte
        const routeLine = L.polyline(routeData.coordinates, {
          color: '#3b82f6',
          weight: 6,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(mapRef.current)
        
        routeLayerRef.current = routeLine

        // Ajouter les marqueurs
        const startMarker = L.marker(startPoint, {
          icon: livePosition ? createDeliveryTruckIcon() : createCustomIcon('#22c55e', 'D')
        }).bindPopup(`
          <div style="text-align: center;">
            <strong>📍 ${livePosition ? 'Position livreur' : 'Point de départ'}</strong><br/>
            ${trackingData.origin || 'Départ'}
          </div>
        `).addTo(mapRef.current)

        const endMarker = L.marker(endPoint, {
          icon: createCustomIcon('#ef4444', 'A')
        }).bindPopup(`
          <div style="text-align: center;">
            <strong>🎯 Destination</strong><br/>
            ${deliveryAddress || trackingData.destination || 'Arrivée'}
          </div>
        `).addTo(mapRef.current)

        markersRef.current = [startMarker, endMarker]

        // Ajuster la vue pour inclure tout le trajet
        const bounds = L.latLngBounds([startPoint, endPoint])
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })

        // Mettre à jour les informations du trajet
        const distance = (routeData.distance / 1000).toFixed(1) + ' km'
        const time = Math.round(routeData.duration / 60) + ' min'
        
        setRouteDistance(distance)
        setRouteTime(time)
        setRouteInstructions(routeData.instructions)

        // Callback externe
        if (onRouteCalculated) {
          onRouteCalculated({
            distance,
            time,
            instructions: routeData.instructions,
            coordinates: routeData.coordinates
          })
        }

        console.log('✅ Trajet calculé:', distance, time)
      } else {
        // Fallback : ligne droite si le routage échoue
        console.log('⚠️ Routage échoué, affichage ligne droite')
        
        const fallbackLine = L.polyline([startPoint, endPoint], {
          color: '#ef4444',
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 10'
        }).addTo(mapRef.current)
        
        routeLayerRef.current = fallbackLine

        // Ajouter les marqueurs de base
        const startMarker = L.marker(startPoint, {
          icon: livePosition ? createDeliveryTruckIcon() : createCustomIcon('#22c55e', 'D')
        }).addTo(mapRef.current)

        const endMarker = L.marker(endPoint, {
          icon: createCustomIcon('#ef4444', 'A')
        }).addTo(mapRef.current)

        markersRef.current = [startMarker, endMarker]

        // Calculer distance à vol d'oiseau
        const directDistance = (startPoint.distanceTo(endPoint) / 1000).toFixed(1) + ' km'
        setRouteDistance(directDistance + ' (à vol d\'oiseau)')
        setRouteTime('Estimation non disponible')

        // Ajuster la vue
        const bounds = L.latLngBounds([startPoint, endPoint])
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }

    } catch (error) {
      console.error('❌ Erreur lors du calcul du trajet:', error)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // =============================================================================
  // RENDU
  // =============================================================================

  return (
    <div className={`relative rounded-lg overflow-hidden border bg-card ${className}`}>
      {/* Carte */}
      <div 
        ref={mapContainer} 
        className="w-full h-[400px]"
        style={{ borderRadius: '0.5rem' }}
      />
      
      {/* Indicateur de calcul */}
      {isCalculatingRoute && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Calcul du trajet...</span>
          </div>
        </div>
      )}

      {/* Informations du trajet */}
      {routeDistance && routeTime && !isCalculatingRoute && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
          <div className="text-sm font-semibold text-gray-700 mb-1">Trajet planifié</div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-blue-600">📏</span>
              <span className="font-medium">{routeDistance}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600">⏱️</span>
              <span className="font-medium">{routeTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border shadow-sm">
        {trackingData.status === 'in_transit' && '🚛 En transit'}
        {trackingData.status === 'out_for_delivery' && '📦 En livraison'}
        {trackingData.status === 'delivered' && '✅ Livré'}
        {trackingData.status === 'pending' && '⏳ En attente'}
      </div>

      {/* Légende */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg max-w-[200px]">
        <div className="text-xs font-semibold mb-2 text-gray-700">Navigation EcoDeli</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Départ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Destination</span>
          </div>
          {livePosition && (
            <div className="flex items-center gap-2">
              <span className="text-sm">🚛</span>
              <span className="font-medium text-purple-600">Position live</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-500 rounded"></div>
            <span>Trajet planifié</span>
          </div>
        </div>
      </div>

      {/* Instructions de navigation (optionnel) */}
      {showInstructions && routeInstructions.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg max-w-[300px] max-h-[200px] overflow-y-auto">
          <div className="text-xs font-semibold mb-2 text-gray-700">Instructions</div>
          <div className="space-y-1">
            {routeInstructions.slice(0, 5).map((instruction, index) => (
              <div key={index} className="text-xs text-gray-600">
                <div className="font-medium">{instruction.text}</div>
                <div className="text-gray-500">
                  {(instruction.distance / 1000).toFixed(1)} km
                </div>
              </div>
            ))}
            {routeInstructions.length > 5 && (
              <div className="text-xs text-gray-500 italic">
                +{routeInstructions.length - 5} autres instructions...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 