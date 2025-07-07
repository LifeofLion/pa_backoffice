"use client"

import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix pour les icônes Leaflet dans Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Icônes SVG personnalisées mais simples
const createSVGIcon = (color: string, symbol: string) => {
  return L.divIcon({
    html: `<div style="background-color:${color};width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:12px;color:white;font-weight:bold;">${symbol}</div>`,
    className: 'bg-transparent border-none',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

interface TrackingMapProps {
  trackingData: any
  livePosition?: { lat: number; lng: number } | null
  className?: string
}

export default function TrackingMap({ trackingData, livePosition, className = '' }: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Initialiser la carte
    const map = L.map(mapContainer.current).setView([46.227638, 2.213749], 6)
    
    // Tuile OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !trackingData) return

    // Nettoyer les marqueurs existants
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapRef.current?.removeLayer(layer)
      }
    })

    const bounds = L.latLngBounds([])

    // Ajouter les marqueurs pour l'itinéraire
    if (trackingData.route?.length > 0) {
      const route = trackingData.route

      // Point de départ
      if (route[0]) {
        const startMarker = L.marker([route[0].lat, route[0].lng], {
          icon: createSVGIcon('#22c55e', 'D')
        }).addTo(mapRef.current)
        startMarker.bindPopup(`<strong>Départ</strong><br/>${route[0].address || 'Position de départ'}`)
        bounds.extend([route[0].lat, route[0].lng])
      }

      // Point d'arrivée
      if (route[route.length - 1]) {
        const endPoint = route[route.length - 1]
        const endMarker = L.marker([endPoint.lat, endPoint.lng], {
          icon: createSVGIcon('#ef4444', 'A')
        }).addTo(mapRef.current)
        endMarker.bindPopup(`<strong>Arrivée</strong><br/>${endPoint.address || 'Destination'}`)
        bounds.extend([endPoint.lat, endPoint.lng])
      }

      // Tracer la route
      const coordinates = route.map((point: any) => [point.lat, point.lng])
      L.polyline(coordinates, { 
        color: '#3b82f6', 
        weight: 4, 
        opacity: 0.8 
      }).addTo(mapRef.current)
    }

    // Position live du livreur
    if (livePosition) {
      const liveMarker = L.marker([livePosition.lat, livePosition.lng], {
        icon: createSVGIcon('#8b5cf6', '📍')
      }).addTo(mapRef.current)
      liveMarker.bindPopup(`<strong>Position actuelle</strong><br/>Lat: ${livePosition.lat.toFixed(6)}<br/>Lng: ${livePosition.lng.toFixed(6)}`)
      bounds.extend([livePosition.lat, livePosition.lng])
    }

    // Événements de tracking
    if (trackingData.events?.length > 0) {
      trackingData.events.forEach((event: any) => {
        if (event.coordinates) {
          const eventMarker = L.marker([event.coordinates.lat, event.coordinates.lng], {
            icon: createSVGIcon('#f59e0b', 'E')
          }).addTo(mapRef.current!)
          eventMarker.bindPopup(`<strong>${event.type}</strong><br/>${event.description}<br/><small>${new Date(event.timestamp).toLocaleString()}</small>`)
          bounds.extend([event.coordinates.lat, event.coordinates.lng])
        }
      })
    }

    // Ajuster la vue si on a des points
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] })
    }

  }, [trackingData, livePosition])

  return (
    <div className={`relative rounded-lg overflow-hidden border bg-card ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-[400px]"
        style={{ borderRadius: '0.5rem' }}
      />
      
      {/* Légende simple avec Tailwind */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
        <div className="text-xs font-medium mb-2">Légende</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Départ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Arrivée</span>
          </div>
          {livePosition && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Position live</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Événements</span>
          </div>
        </div>
      </div>

      {/* Indicateur temps réel avec animation Tailwind */}
      {livePosition && (
        <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          Position en temps réel
        </div>
      )}
    </div>
  )
} 