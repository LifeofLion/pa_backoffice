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
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);font-size:12px;color:white;font-weight:bold;">${symbol}</div>`,
    className: 'bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Icône truck animée
const createTruckIcon = () => {
  return L.divIcon({
    html: `<div style="background-color:#8b5cf6;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.4);animation:pulse 2s infinite;"><span style="font-size:14px;">🚛</span></div>`,
    className: 'bg-transparent border-none',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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

    // Initialiser la carte centré sur la France
    const map = L.map(mapContainer.current).setView([46.227638, 2.213749], 6)
    
    // Tuile OpenStreetMap avec style amélioré
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapRef.current = map

    // Style CSS pour animation pulse
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

  useEffect(() => {
    if (!mapRef.current || !trackingData) return

    // Nettoyer les marqueurs existants
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapRef.current?.removeLayer(layer)
      }
    })

    const bounds = L.latLngBounds([])
    const routePoints: [number, number][] = []

    // Position live du livreur (priorité absolue)
    if (livePosition) {
      const liveMarker = L.marker([livePosition.lat, livePosition.lng], {
        icon: createTruckIcon()
      }).addTo(mapRef.current)
      
      const statusText = trackingData.status === 'in_transit' ? 'En transit' : 'En cours de livraison'
      liveMarker.bindPopup(`
        <div style="text-align:center;">
          <strong>🚛 ${statusText}</strong><br/>
          <strong>${trackingData.packageName || 'Colis'}</strong><br/>
          <small>Lat: ${livePosition.lat.toFixed(6)}</small><br/>
          <small>Lng: ${livePosition.lng.toFixed(6)}</small><br/>
          ${trackingData.currentLocation?.speed ? `<small>Vitesse: ${trackingData.currentLocation.speed} km/h</small>` : ''}
        </div>
      `)
      bounds.extend([livePosition.lat, livePosition.lng])
      routePoints.push([livePosition.lat, livePosition.lng])
    }

    // Points d'origine et destination (en se basant sur les coordonnées des événements)
    const events = trackingData.events || []
    if (events.length > 0) {
      
      // Dernier événement = départ probable
      const lastEvent = events[events.length - 1]
      if (lastEvent.latitude && lastEvent.longitude) {
        const startMarker = L.marker([lastEvent.latitude, lastEvent.longitude], {
          icon: createSVGIcon('#22c55e', 'D')
        }).addTo(mapRef.current)
        startMarker.bindPopup(`
          <div style="text-align:center;">
            <strong>📍 Départ</strong><br/>
            <strong>${trackingData.origin}</strong><br/>
            <small>${lastEvent.description}</small><br/>
            <small>${lastEvent.date} ${lastEvent.time}</small>
          </div>
        `)
        bounds.extend([lastEvent.latitude, lastEvent.longitude])
        
        // Ajouter au début de la route
        routePoints.unshift([lastEvent.latitude, lastEvent.longitude])
      }

      // Premier événement = arrivée probable (si différent du dernier)
      const firstEvent = events[0]
      if (firstEvent.latitude && firstEvent.longitude && firstEvent !== lastEvent) {
        const endMarker = L.marker([firstEvent.latitude, firstEvent.longitude], {
          icon: createSVGIcon('#ef4444', 'A')
        }).addTo(mapRef.current)
        endMarker.bindPopup(`
          <div style="text-align:center;">
            <strong>🎯 Destination</strong><br/>
            <strong>${trackingData.destination}</strong><br/>
            <small>${firstEvent.description}</small><br/>
            <small>${firstEvent.date} ${firstEvent.time}</small>
          </div>
        `)
        bounds.extend([firstEvent.latitude, firstEvent.longitude])
        
        // Ajouter à la fin de la route
        routePoints.push([firstEvent.latitude, firstEvent.longitude])
      }

      // Événements intermédiaires
      events.forEach((event: any, index: number) => {
        if (event.latitude && event.longitude && index > 0 && index < events.length - 1) {
          const eventMarker = L.marker([event.latitude, event.longitude], {
            icon: createSVGIcon('#f59e0b', (index + 1).toString())
          }).addTo(mapRef.current!)
          eventMarker.bindPopup(`
            <div style="text-align:center;">
              <strong>📦 Étape ${index + 1}</strong><br/>
              <strong>${event.description}</strong><br/>
              <small>${event.location}</small><br/>
              <small>${event.date} ${event.time}</small>
            </div>
          `)
          bounds.extend([event.latitude, event.longitude])
        }
      })
    }

    // Si on n'a pas de coordonnées d'événements, utiliser les coordonnées simulées par défaut
    if (routePoints.length === 0) {
      // Données par défaut en fonction du tracking number
      let defaultPoints: [number, number][] = []
      
      if (trackingData.trackingNumber === 'ECO-TEST-001') {
        // Paris → Lyon via Mâcon
        defaultPoints = [
          [48.8566, 2.3522], // Paris (départ)
          [46.7516, 4.8467], // Mâcon (position actuelle)
          [45.7640, 4.8357]  // Lyon (destination)
        ]
      } else if (trackingData.trackingNumber === 'ECO-TEST-002') {
        // Toulouse → Bordeaux
        defaultPoints = [
          [43.6045, 1.4440], // Toulouse (départ)  
          [44.8404, -0.5801], // Bordeaux (position actuelle)
        ]
      } else if (trackingData.trackingNumber === 'ECO-TEST-003') {
        // Lille → Bruxelles
        defaultPoints = [
          [50.6292, 3.0573], // Lille (départ)
          [50.8503, 4.3517]  // Bruxelles (livré)
        ]
      }

      defaultPoints.forEach((point, index) => {
        if (index === 0) {
          // Point de départ
          const startMarker = L.marker(point, {
            icon: createSVGIcon('#22c55e', 'D')
          }).addTo(mapRef.current!)
          startMarker.bindPopup(`<strong>📍 Départ</strong><br/>${trackingData.origin}`)
        } else if (index === defaultPoints.length - 1) {
          // Point d'arrivée
          const endMarker = L.marker(point, {
            icon: createSVGIcon('#ef4444', 'A')
          }).addTo(mapRef.current!)
          endMarker.bindPopup(`<strong>🎯 Destination</strong><br/>${trackingData.destination}`)
        }
        bounds.extend(point)
      })

      routePoints.push(...defaultPoints)
    }

    // Tracer la route si on a au moins 2 points
    if (routePoints.length >= 2) {
      L.polyline(routePoints, { 
        color: '#3b82f6', 
        weight: 4, 
        opacity: 0.8,
        dashArray: trackingData.status === 'delivered' ? '10, 10' : undefined
      }).addTo(mapRef.current)
    }

    // Ajuster la vue si on a des points
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [30, 30] })
    } else {
      // Vue par défaut sur la France
      mapRef.current.setView([46.227638, 2.213749], 6)
    }

  }, [trackingData, livePosition])

  return (
    <div className={`relative rounded-lg overflow-hidden border bg-card ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-[400px]"
        style={{ borderRadius: '0.5rem' }}
      />
      
      {/* Légende améliorée avec status */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg max-w-[200px]">
        <div className="text-xs font-semibold mb-2 text-gray-700">Suivi EcoDeli</div>
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
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Étapes</span>
          </div>
          <hr className="my-2"/>
          <div className="text-xs text-gray-600">
            <div><strong>Colis:</strong> {trackingData.packageName}</div>
            <div><strong>Statut:</strong> {trackingData.status}</div>
          </div>
        </div>
      </div>

      {/* Indicateur temps réel avec animation */}
      {livePosition && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Temps réel actif</span>
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
    </div>
  )
} 