"use client"

import { useState, useEffect } from "react"
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
  Search,
  Star
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import LanguageSelector from "@/components/language-selector"
import { useAuth } from "@/src/hooks/use-auth"
import { useDeliveryman } from "@/src/hooks/use-deliveryman"

interface LiverDelivery {
  id: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  pickupLocation: string
  dropoffLocation: string
  amount?: number
  estimatedDeliveryTime?: string
  annonce?: {
    title: string
    priority: boolean
  }
  client: {
    name: string
  }
  colis?: Array<{
    contentDescription: string
  }>
}

interface Delivery {
  id: string | number
  image?: string
  announceName?: string
  whereTo?: string
  price?: string
  amount?: number
  deliveryDate?: string
  status: "paid" | "in_transit" | "delivered" | "pending" | "scheduled" | "completed" | "available"
  isPriority?: boolean
  annonceId?: number
  livreurId?: number
  adresseLivraison?: string
  pickupLocation?: string
  dropoffLocation?: string
  clientInfo?: {
    firstName: string
    lastName: string
  }
}

export default function DeliverymanDeliveries() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([])
  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const {
    myLivraisons,
    availableLivraisons,
    loading,
    error,
    refreshData,
    acceptLivraison 
  } = useDeliveryman()

  useEffect(() => {
    if (myLivraisons && myLivraisons.length > 0) {
      const formattedDeliveries: Delivery[] = myLivraisons.map((livraison) => {
        
        let status: "paid" | "in_transit" | "delivered" | "pending" | "scheduled" | "completed" | "available" = "pending"
        switch(livraison.status) {
          case "scheduled":
            status = "scheduled"
            break
          case "in_progress":
            status = "in_transit"
            break
          case "completed":
            status = "delivered"
            break
          default:
            status = "pending"
        }
        
        const deliveryItem: Delivery = {
          id: livraison.id,
          announceName: livraison.annonce?.title || livraison.colis?.[0]?.description || `Livraison #${livraison.id}`,
          image: "/placeholder.svg",
          whereTo: livraison.dropoffLocation || "Adresse de livraison",
          pickupLocation: livraison.pickupLocation || "Point de retrait",
          price: livraison.amount ? `€${livraison.amount}` : "Prix non spécifié",
          amount: 1,
          deliveryDate: formatDate(livraison.estimatedDeliveryTime || new Date().toISOString()),
          status: status,
          isPriority: livraison.annonce?.priority || false,
          adresseLivraison: livraison.dropoffLocation,
          clientInfo: {
            firstName: livraison.client.name.split(' ')[0] || '',
            lastName: livraison.client.name.split(' ')[1] || ''
          }
        }
        
        return deliveryItem
      })
      
      setDeliveries(formattedDeliveries)
    } else {
      setDeliveries([])
    }
  }, [myLivraisons])

  useEffect(() => {
    if (availableLivraisons && availableLivraisons.length > 0) {
      const formattedAvailable: Delivery[] = availableLivraisons.map((livraison) => {
        
        const deliveryItem: Delivery = {
          id: livraison.id,
          announceName: `Annonce #${livraison.id}`,
          image: "/placeholder.svg",
          whereTo: livraison.dropoffLocation || "Adresse de livraison",
          pickupLocation: livraison.pickupLocation || "Point de retrait",
          price: livraison.amount ? `€${livraison.amount}` : "Prix non spécifié",
          amount: livraison.packageCount || 1,
          deliveryDate: formatDate(livraison.scheduledDate),
          status: "available",
          isPriority: livraison.priority === 'urgent',
          adresseLivraison: livraison.dropoffLocation,
          clientInfo: {
            firstName: '',
            lastName: ''
          }
        }
        
        return deliveryItem
      })
      
      setAvailableDeliveries(formattedAvailable)
    } else {
      setAvailableDeliveries([])
    }
  }, [availableLivraisons])

  // Fonction utilitaire pour formater la date
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
      return "Date invalide"
    }
  }

  const currentDeliveries = activeTab === 'assigned' ? deliveries : availableDeliveries
  const filteredDeliveries = currentDeliveries.filter((delivery) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      (delivery.announceName?.toLowerCase().includes(query) || false) ||
      (delivery.whereTo?.toLowerCase().includes(query) || false) ||
      (delivery.price?.toLowerCase().includes(query) || false) ||
      (delivery.deliveryDate?.toLowerCase().includes(query) || false)
    )
  })

  const getStatusClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-300 text-green-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "scheduled":
        return "bg-purple-100 text-purple-800"
      case "available":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return t("deliveryman.deliveriess.paid")
      case "in_transit":
        return t("deliveryman.deliveriess.inTransit")
      case "delivered":
        return t("deliveryman.deliveriess.delivered")
      case "pending":
        return t("deliveryman.deliveriess.pending")
      case "scheduled":
        return "Programmée"
      case "available":
        return "Disponible"
      default:
        return status
    }
  }

  const handleAcceptDelivery = async (deliveryId: string | number) => {
    try {
      await acceptLivraison(deliveryId.toString())
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la livraison:', error)
    }
  }

  if (!user?.livreur?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès Réservé aux Livreurs
          </h2>
          <p className="text-gray-600 mb-4">
            Cette page est uniquement accessible aux livreurs inscrits.
          </p>
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
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-auto lg:z-auto`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/app_deliveryman" className="flex items-center">
              <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto" />
            </Link>
          </div>

          {/* Navigation */}
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
                  className="flex items-center rounded-md bg-green-50 px-4 py-3 text-white"
                >
                  <Package className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.deliveries")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/notifications"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <BellRing className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.notifications")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/messages"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <MessageSquare className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.messages")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/payments"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
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
        {/* Header - DESIGN ORIGINAL PRÉSERVÉ */}
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
                    href="/app_client" 
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>{t("common.clientSpace")}</span>
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>



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

        <main className="p-4 lg:p-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              {error}
              <button 
                onClick={refreshData}
                className="ml-4 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
              >
                Réessayer
              </button>
            </div>
          )}

          <h1 className="mb-6 text-2xl font-bold">{t("deliveryman.deliveries")}</h1>
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'assigned'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mes livraisons ({deliveries.length})
                </button>
                <button
                  onClick={() => setActiveTab('available')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'available'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Annonces disponibles ({availableDeliveries.length})
                </button>
              </nav>
            </div>
          </div>

          <div className="mb-6 md:hidden">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-4 mb-8 mt-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("deliveryman.deliveriess.image")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'available' ? 'Annonce' : t("deliveryman.deliveriess.announceName")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("deliveryman.deliveriess.whereTo")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("deliveryman.deliveriess.price")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'available' ? 'Date souhaitée' : t("deliveryman.deliveriess.deliveryDate")}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("deliveryman.deliveriess.status")}
                      </th>
                      {activeTab === 'available' && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeliveries.length > 0 ? (
                      filteredDeliveries.map((delivery) => (
                        <tr 
                          key={delivery.id}
                          className={`hover:bg-gray-50 ${activeTab === 'assigned' ? 'cursor-pointer' : ''}`}
                          onClick={activeTab === 'assigned' ? () => window.location.href = `/app_deliveryman/delivery/${delivery.id}` : undefined}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              <Image
                                src={delivery.image || "/placeholder.svg"}
                                alt={delivery.announceName || "Delivery image"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {delivery.announceName}
                                {delivery.isPriority && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{delivery.whereTo}</div>
                            {delivery.pickupLocation && (
                              <div className="text-xs text-gray-500">Depuis: {delivery.pickupLocation}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {delivery.price}
                              {delivery.isPriority && (
                                <span className="ml-1 text-xs text-red-600">(Urgent)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{delivery.deliveryDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(delivery.status)}`}>
                              {getStatusText(delivery.status)}
                            </span>
                          </td>
                          {activeTab === 'available' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAcceptDelivery(delivery.id)
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                Accepter
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={activeTab === 'available' ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                          {activeTab === 'available' 
                            ? "Aucune annonce disponible pour le moment"
                            : t("deliveryman.deliveriess.noDeliveriesFound")
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}