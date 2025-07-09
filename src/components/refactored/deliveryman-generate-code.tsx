"use client"

import { useState } from 'react'
import { Shield, Info, Check, Copy, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient, getErrorMessage } from '@/src/lib/api'

// =============================================================================
// COMPOSANT GÉNÉRATEUR DE CODE POUR LIVREURS
// =============================================================================

interface DeliveryCodeGeneratorProps {
  livraisonId: string | number
  clientName: string
  isOpen: boolean
  onClose: () => void
  onCodeGenerated?: (code: string) => void
}

export default function DeliveryCodeGenerator({ 
  livraisonId, 
  clientName, 
  isOpen, 
  onClose,
  onCodeGenerated 
}: DeliveryCodeGeneratorProps) {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateValidationCode = async () => {
    try {
      setLoading(true)
      
      // Appel API pour générer le code de validation
      const response = await apiClient.post<{ 
        message: string
        code: string
      }>('/codes-temporaire/generate-code', {
        user_info: `delivery-${livraisonId}`,
        type: 'delivery_validation'
      })
      
      console.log('🔍 Response from backend:', response)
      
      // 🔧 CORRECTION : Le backend retourne { message, code } pas { success, code }
      if (response.code) {
        setCode(response.code)
        onCodeGenerated?.(response.code)
        
        toast({
          title: '✅ Code généré !',
          description: 'Donnez ce code au client pour valider la livraison.',
        })
      }
    } catch (error) {
      console.error('❌ Erreur génération code:', error)
      toast({
        title: 'Erreur',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyCodeToClipboard = async () => {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      
      toast({
        title: 'Code copié !',
        description: 'Le code a été copié dans le presse-papiers.',
      })
      
      // Reset l'état copié après 2 secondes
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le code.',
        variant: 'destructive',
      })
    }
  }

  const handleReset = () => {
    setCode(null)
    setCopied(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Code de validation livraison
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {!code ? (
          // État : Génération du code
          <>
            <div className="text-center mb-6">
              <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Livraison terminée ?
              </h4>
              
              <p className="text-gray-600 mb-4">
                Générez un code de validation pour permettre à{' '}
                <span className="font-semibold">{clientName}</span>{' '}
                de confirmer la réception du colis.
              </p>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Système Anti-Arnaque EcoDeli</p>
                    <p>
                      Ce code permettra au client de valider la livraison et 
                      libérera automatiquement vos gains en toute sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={generateValidationCode}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Générer le code
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          // État : Code généré
          <>
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Code généré avec succès !
              </h4>
              
              <p className="text-gray-600 mb-6">
                Communiquez ce code à <span className="font-semibold">{clientName}</span> 
                pour qu'il valide la réception :
              </p>
              
              {/* Affichage du code */}
              <div className="relative">
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl mb-4">
                  <p className="text-4xl font-mono font-bold text-green-700 tracking-wider">
                    {code}
                  </p>
                </div>
                
                {/* Bouton copier */}
                <button
                  onClick={copyCodeToClipboard}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg border transition-colors ${
                    copied 
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le code
                    </>
                  )}
                </button>
              </div>
              
              {/* Instructions */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Instructions :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Le client doit entrer ce code dans son application</li>
                      <li>Une fois validé, vos gains seront automatiquement libérés</li>
                      <li>Le code expire dans 24h pour votre sécurité</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Générer un nouveau code
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT BOUTON RAPIDE POUR GÉNÉRER LE CODE
// =============================================================================

interface GenerateCodeButtonProps {
  livraisonId: string | number
  clientName: string
  isDelivered?: boolean
  className?: string
  onCodeGenerated?: (code: string) => void
}

export function GenerateCodeButton({ 
  livraisonId, 
  clientName, 
  isDelivered = false,
  className = "",
  onCodeGenerated 
}: GenerateCodeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleCodeGenerated = (code: string) => {
    onCodeGenerated?.(code)
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={!isDelivered}
        className={`
          inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors
          ${isDelivered 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }
          ${className}
        `}
      >
        <Shield className="h-4 w-4 mr-2" />
        Générer code validation
      </button>

      <DeliveryCodeGenerator
        livraisonId={livraisonId}
        clientName={clientName}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCodeGenerated={handleCodeGenerated}
      />
    </>
  )
} 