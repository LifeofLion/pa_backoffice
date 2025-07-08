"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Navigation, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Clock, 
  Route,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  RotateCcw,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'

// =============================================================================
// INTERFACES
// =============================================================================

interface NavigationInstruction {
  text: string
  distance: number
  time: number
  direction?: string
  road?: string
  type?: string
  maneuver?: string
}

interface NavigationPanelProps {
  instructions: NavigationInstruction[]
  currentInstructionIndex?: number
  totalDistance?: string
  totalTime?: string
  isNavigating?: boolean
  onStartNavigation?: () => void
  onStopNavigation?: () => void
  className?: string
}

// =============================================================================
// UTILITAIRES
// =============================================================================

const getInstructionIcon = (instruction: NavigationInstruction) => {
  const maneuver = instruction.maneuver?.toLowerCase() || instruction.direction?.toLowerCase() || ''
  
  if (maneuver.includes('left')) {
    return <ArrowLeft className="h-6 w-6 text-blue-600" />
  } else if (maneuver.includes('right')) {
    return <ArrowRight className="h-6 w-6 text-blue-600" />
  } else if (maneuver.includes('uturn') || maneuver.includes('u-turn')) {
    return <RotateCcw className="h-6 w-6 text-orange-600" />
  } else if (maneuver.includes('straight') || maneuver.includes('continue')) {
    return <ArrowUp className="h-6 w-6 text-green-600" />
  } else {
    return <Navigation className="h-6 w-6 text-gray-600" />
  }
}

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else {
    return `${(meters / 1000).toFixed(1)} km`
  }
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    return `${hours}h ${minutes}min`
  }
}

// =============================================================================
// SYNTHÈSE VOCALE
// =============================================================================

class VoiceNavigator {
  private synth: SpeechSynthesis | null = null
  private voice: SpeechSynthesisVoice | null = null
  private isEnabled: boolean = false

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.setupVoice()
    }
  }

  private setupVoice() {
    if (!this.synth) return

    const setVoice = () => {
      const voices = this.synth!.getVoices()
      // Chercher une voix française
      this.voice = voices.find(voice => 
        voice.lang.startsWith('fr') || voice.name.includes('French')
      ) || voices[0] || null
    }

    setVoice()
    this.synth.onvoiceschanged = setVoice
  }

  enable() {
    this.isEnabled = true
  }

  disable() {
    this.isEnabled = false
    this.stop()
  }

  speak(text: string) {
    if (!this.synth || !this.isEnabled || !text) return

    // Arrêter toute synthèse en cours
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    if (this.voice) {
      utterance.voice = this.voice
    }
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    this.synth.speak(utterance)
  }

  stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  isSupported(): boolean {
    return this.synth !== null
  }

  getEnabled(): boolean {
    return this.isEnabled
  }
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function NavigationPanel({
  instructions = [],
  currentInstructionIndex = 0,
  totalDistance,
  totalTime,
  isNavigating = false,
  onStartNavigation,
  onStopNavigation,
  className = ''
}: NavigationPanelProps) {
  const [voiceNavigator] = useState(() => new VoiceNavigator())
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [expandedInstructions, setExpandedInstructions] = useState(false)

  const currentInstruction = instructions[currentInstructionIndex]
  const nextInstruction = instructions[currentInstructionIndex + 1]

  // =============================================================================
  // GESTION SYNTHÈSE VOCALE
  // =============================================================================

  const toggleVoice = useCallback(() => {
    if (isVoiceEnabled) {
      voiceNavigator.disable()
      setIsVoiceEnabled(false)
    } else {
      voiceNavigator.enable()
      setIsVoiceEnabled(true)
      
      // Test de la synthèse vocale
      voiceNavigator.speak("Navigation vocale activée")
    }
  }, [isVoiceEnabled, voiceNavigator])

  // Annoncer les nouvelles instructions
  useEffect(() => {
    if (isVoiceEnabled && currentInstruction && isNavigating) {
      const announcement = `Dans ${formatDistance(currentInstruction.distance)}, ${currentInstruction.text}`
      voiceNavigator.speak(announcement)
    }
  }, [currentInstructionIndex, isVoiceEnabled, currentInstruction, isNavigating, voiceNavigator])

  // =============================================================================
  // GESTION NAVIGATION
  // =============================================================================

  const handleStartNavigation = () => {
    if (onStartNavigation) {
      onStartNavigation()
    }
    
    if (isVoiceEnabled) {
      voiceNavigator.speak("Navigation démarrée")
    }
  }

  const handleStopNavigation = () => {
    if (onStopNavigation) {
      onStopNavigation()
    }
    
    voiceNavigator.stop()
    
    if (isVoiceEnabled) {
      voiceNavigator.speak("Navigation arrêtée")
    }
  }

  // =============================================================================
  // RENDU
  // =============================================================================

  if (!instructions.length) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Navigation className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Aucune instruction de navigation disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* En-tête avec résumé du trajet */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Navigation EcoDeli</h3>
              <div className="flex items-center space-x-4 text-sm opacity-90">
                {totalDistance && (
                  <div className="flex items-center space-x-1">
                    <Route className="h-4 w-4" />
                    <span>{totalDistance}</span>
                  </div>
                )}
                {totalTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{totalTime}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bouton synthèse vocale */}
            {voiceNavigator.isSupported() && (
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-full transition-colors ${
                  isVoiceEnabled 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title={isVoiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}
              >
                {isVoiceEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Bouton start/stop navigation */}
            {isNavigating ? (
              <button
                onClick={handleStopNavigation}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                Arrêter
              </button>
            ) : (
              <button
                onClick={handleStartNavigation}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                Démarrer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instruction actuelle */}
      {currentInstruction && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {getInstructionIcon(currentInstruction)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Instruction actuelle</h4>
                <div className="text-sm text-gray-500">
                  {formatDistance(currentInstruction.distance)}
                </div>
              </div>
              
              <p className="text-gray-700 mb-1">{currentInstruction.text}</p>
              
              {currentInstruction.road && (
                <p className="text-sm text-gray-500">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {currentInstruction.road}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instruction suivante */}
      {nextInstruction && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1 opacity-60">
              {getInstructionIcon(nextInstruction)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-600">Ensuite</h5>
                <div className="text-xs text-gray-400">
                  {formatDistance(nextInstruction.distance)}
                </div>
              </div>
              
              <p className="text-sm text-gray-600">{nextInstruction.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liste complète des instructions (collapsible) */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setExpandedInstructions(!expandedInstructions)}
          className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-700">
            Toutes les instructions ({instructions.length})
          </span>
          <ChevronRight 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              expandedInstructions ? 'rotate-90' : ''
            }`} 
          />
        </button>

        {expandedInstructions && (
          <div className="max-h-64 overflow-y-auto">
            {instructions.map((instruction, index) => (
              <div
                key={index}
                className={`p-3 border-t border-gray-100 flex items-start space-x-3 ${
                  index === currentInstructionIndex 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-700">{instruction.text}</p>
                    <span className="text-xs text-gray-500">
                      {formatDistance(instruction.distance)}
                    </span>
                  </div>
                  
                  {instruction.road && (
                    <p className="text-xs text-gray-500">{instruction.road}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statut de navigation */}
      {isNavigating && (
        <div className="p-3 bg-green-50 border-t border-green-200">
          <div className="flex items-center space-x-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Navigation active</span>
            {isVoiceEnabled && (
              <span className="text-xs opacity-75">• Guidage vocal activé</span>
            )}
          </div>
        </div>
      )}

      {/* Message d'information si synthèse vocale non supportée */}
      {!voiceNavigator.isSupported() && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center space-x-2 text-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">
              La synthèse vocale n'est pas supportée par votre navigateur
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 