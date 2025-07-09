"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Edit,
  BellRing,
  CreditCard,
  User,
  PartyPopper,
  RefreshCw,
  AlertTriangle,
  Download,
  Search,
  Euro,
  Calendar,
  Clock,
  Shield,
  Info
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import LanguageSelector from "@/components/language-selector"
import { useAuth } from "@/src/hooks/use-auth"
import { useDeliveryman } from "@/src/hooks/use-deliveryman"
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/src/lib/api'

// =============================================================================
// 🎯 COMPOSANT REFACTORISÉ - PAIEMENTS POUR LIVREURS
// =============================================================================

export default function DeliverymanPayments() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // 🚀 Utilisation du hook refactorisé
  const {
    myLivraisons,
    loading,
    error,
    refreshData,
    clearError,
    isDeliveryman
  } = useDeliveryman()

  // Fonction utilitaire pour formater le prix
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Filtrer les livraisons complétées (donc payées) en fonction de la recherche
  const completedLivraisons = myLivraisons.filter(l => l.status === 'completed')
  const filteredPayments = completedLivraisons.filter((livraison) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      livraison.pickupLocation.toLowerCase().includes(query) ||
      livraison.dropoffLocation.toLowerCase().includes(query) ||
      livraison.client.name.toLowerCase().includes(query)
    )
  })

  // Calculer les stats de paiement
  const totalEarnings = completedLivraisons.reduce((sum, l) => sum + (l.amount || 0), 0)

  // Protection si l'utilisateur n'est pas un livreur
  if (!isDeliveryman) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès Réservé aux Livreurs
          </h2>
          <Link
            href="/app_client"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Aller à l'espace client
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - VERSION COMPACTE */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-auto lg:z-auto`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/app_deliveryman" className="flex items-center">
              <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto" />
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/app_deliveryman"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.dashboard")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/announcements"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <PartyPopper className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.announcements")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/deliveries"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <Package className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.deliveries")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/payments"
                  className="flex items-center rounded-md bg-green-50 px-4 py-3 text-white"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.payments")}</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="ml-auto flex items-center space-x-4">
            <LanguageSelector />
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center bg-green-50 text-white rounded-full px-4 py-1 hover:bg-green-400 transition-colors"
              >
                <User className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">
                  {user?.firstName || 'Livreur'}
                </span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-100">
                  <Link
                    href="/app_deliveryman/edit-account"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>{t("common.editAccount")}</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link 
                    href="/logout" 
                    className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>{t("common.logout")}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t("deliveryman.payments")}</h1>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Gains totaux</p>
                <p className="text-lg font-bold text-green-600">{formatPrice(totalEarnings)}</p>
              </div>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Euro className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gains totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalEarnings)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Livraisons payées</p>
                  <p className="text-2xl font-bold text-gray-900">{completedLivraisons.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ce mois</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalEarnings)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestion des erreurs */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>Erreur: {error}</span>
                </div>
                <button 
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          {/* Liste des paiements - DONNÉES RÉELLES */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Chargement des paiements...</div>
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            Livraison #{payment.id.slice(-6)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Client:</span> {payment.client.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Vers:</span> {payment.dropoffLocation}
                          </p>
                          {payment.status === 'completed' && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              Livraison complétée
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(payment.amount || 0)}
                        </p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Payé
                        </span>
                        
                        <div className="mt-2">
                          <button className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                            <Download className="h-4 w-4 mr-1" />
                            Facture
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <CreditCard className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-medium mb-2">Aucun paiement</h2>
              <p className="text-gray-500 mb-4">
                Vous n'avez pas encore de livraisons terminées et payées.
              </p>
              <Link
                href="/app_deliveryman/deliveries"
                className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir mes livraisons
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// =============================================================================
// COMPOSANT MODAL GÉNÉRATION CODE
// =============================================================================

interface CodeGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  deliveryId: string
  clientName: string
  t: (key: string) => string
}

function CodeGenerationModal({ isOpen, onClose, deliveryId, clientName, t }: CodeGenerationModalProps) {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const generateCode = async () => {
    try {
      setLoading(true)
      
      // Appel API pour générer le code
      const response = await apiClient.post<{ success: boolean; code: string }>('/codes-temporaire/generate-code', {
        user_info: `delivery-${deliveryId}`,
        type: 'delivery_validation'
      })
      
      if (response.success && response.code) {
        setCode(response.code)
        toast({
          title: 'Code généré',
          description: 'Donnez ce code au client pour valider la livraison',
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-semibold mb-4">Code de validation livraison</h3>
        
        <div className="mb-6">
          <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
          
          {!code ? (
            <>
              <p className="text-center text-gray-600 mb-6">
                Générez un code de validation pour permettre à <strong>{clientName}</strong> de confirmer
                la réception du colis.
              </p>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    Ce code permettra au client de valider la livraison et libérera automatiquement
                    vos fonds.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-gray-600 mb-4">
                Voici le code de validation à donner au client :
              </p>
              
              <div className="p-6 bg-green-50 rounded-lg text-center mb-6">
                <p className="text-3xl font-mono font-bold text-green-700">{code}</p>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    Le client doit entrer ce code dans son application pour confirmer la réception.
                    Une fois validé, vos gains seront automatiquement libérés.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          {!code ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={generateCode}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                Générer le code
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 