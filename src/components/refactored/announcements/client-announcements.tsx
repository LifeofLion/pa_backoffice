"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/language-context"
import { ClientLayout } from "@/src/components/layouts"
import { useAuth } from "@/src/hooks/use-auth"
import { apiClient, getErrorMessage } from "@/src/lib/api"
import type { CreateAnnouncementRequest } from "@/src/types/validators"

interface Announcement {
  id: number
  title: string
  description?: string
  price: number | string
  end_location?: string
  start_location?: string
  desired_date?: string
  actual_delivery_date?: string
  priority?: boolean
  storage_box_id?: string
  status?: 'active' | 'pending' | 'completed' | 'cancelled'
  type?: 'transport_colis' | 'service_personne'
  insurance_amount?: number
  image_path?: string
  tags?: string[]
}

export default function ClientAnnouncements() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShoppingForm, setShowShoppingForm] = useState(false)
  
  // État pour la création de liste de courses
  const [shopTitle, setShopTitle] = useState("")
  const [shopList, setShopList] = useState("")
  const [shopPrice, setShopPrice] = useState("")
  const [shopDeliveryAddress, setShopDeliveryAddress] = useState("")
  const [shopDeliveryDate, setShopDeliveryDate] = useState("")

  // Charger les annonces de l'utilisateur
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user) return

      try {
        const response = await apiClient.getUserAnnouncements(user.id.toString())
        
        // L'API peut renvoyer { annonces: [...] } ou directement [...]
        const announcementsData = response?.annonces || response
        
        if (Array.isArray(announcementsData)) {
          setAnnouncements(announcementsData)
        } else {
          console.warn("Response is not an array:", announcementsData)
          setAnnouncements([])
        }
      } catch (error) {
        console.error("Error fetching announcements:", error)
        setError(getErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [user])

  const openCreateModal = () => {
    setError("")
    setShopTitle("")
    setShopPrice("")
    setShopList("")
    setShopDeliveryAddress("")
    setShopDeliveryDate("")
    setShowCreateModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm(t("announcements.confirmDelete"))) {
      try {
        await apiClient.deleteAnnouncement(id.toString())
        setAnnouncements(announcements.filter((announcement) => announcement.id !== id))
      } catch (error) {
        console.error("Error deleting announcement:", error)
        setError(getErrorMessage(error))
      }
    }
  }

  const handleCreateShoppingList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const announcementData: CreateAnnouncementRequest = {
        utilisateur_id: user.id,
        title: shopTitle,
        description: shopList, // La liste de courses va dans la description
        price: Number(shopPrice),
        type: 'service_personne', // Les listes de courses sont des services
        status: 'active',
        end_location: shopDeliveryAddress,  // NOUVEAU: remplace destination_address
        desired_date: shopDeliveryDate,     // NOUVEAU: remplace scheduled_date
        tags: ["shopping-list"] // Tag pour identifier les listes de courses
      }

      const response: any = await apiClient.createAnnouncement(announcementData)
      
      // L'API renvoie { annonce: ... } - extraire l'objet annonce
      const newAnnouncement = response?.annonce || response
      setAnnouncements([...announcements, newAnnouncement])
      
      // reset et fermer modal
      setShowShoppingForm(false)
      setShowCreateModal(false)
    } catch (error) {
      console.error("Error creating shopping list:", error)
      setError(getErrorMessage(error))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("announcements.noDate")
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    } catch {
      return dateString
    }
  }

  const formatPrice = (price: number | string) => {
    // Convertir en nombre si c'est une string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    
    // Vérifier si c'est un nombre valide
    if (isNaN(numPrice)) {
      return '€0.00'
    }
    
    return `€${numPrice.toFixed(2)}`
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <ClientLayout activeRoute="announcements">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">{t("common.loading")}</p>
          </div>
        </main>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout activeRoute="announcements">
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-2xl font-semibold text-center text-green-400">{t("announcements.yourAnnouncements")}</h1>

          <button
            onClick={openCreateModal}
            className="bg-green-400 text-white px-4 py-2 rounded-full flex items-center hover:bg-green-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("announcements.makeNewAnnouncement")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 relative bg-green-200">
                {announcement.image_path ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/${announcement.image_path}`}
                    alt={announcement.title}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{t("announcements.noImage")}</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-800 line-clamp-2">{announcement.title}</h3>
                  <span className="text-lg font-semibold text-green-500 whitespace-nowrap ml-2">
                    {formatPrice(announcement.price)}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  {announcement.end_location && (
                    <p>
                      <span className="font-medium">{t("announcements.destination")}:</span> {announcement.end_location}
                    </p>
                  )}
                  {announcement.desired_date && (
                    <p>
                      <span className="font-medium">{t("announcements.deliveryDate")}:</span> {formatDate(announcement.desired_date)}
                    </p>
                  )}
                  {announcement.description && (
                    <p>
                      <span className="font-medium">{t("announcements.description")}:</span> {announcement.description}
                    </p>
                  )}
                  {announcement.status && (
                    <p>
                      <span className="font-medium">{t("announcements.status")}:</span> 
                      <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(announcement.status)}`}>
                        {t(`announcements.${announcement.status}`)}
                      </span>
                    </p>
                  )}
                  {announcement.type && (
                    <p>
                      <span className="font-medium">{t("announcements.type")}:</span> 
                      <span className="ml-1">
                        {t(`announcements.${announcement.type}`)}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/app_client/announcements/edit/${announcement.id}`}
                    className="bg-green-100 text-green-600 px-3 py-1 rounded-md text-sm hover:bg-green-200 transition-colors"
                  >
                    {t("announcements.edit")}
                  </Link>
                  <button
                    className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-200 transition-colors"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    {t("announcements.delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {announcements.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{t("announcements.noAnnouncements")}</p>
            <button
              onClick={openCreateModal}
              className="bg-green-400 text-white px-4 py-2 rounded-full flex items-center mx-auto hover:bg-green-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("announcements.makeFirstAnnouncement")}
            </button>
          </div>
        )}
      </main>

      {/* Modal pour choisir le type d'annonce */}
      {showCreateModal && !showShoppingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t("announcements.createNewAnnouncement")}</h2>
            
            <div className="space-y-4">
              <Link
                href="/app_client/announcements/create"
                className="block w-full p-4 text-center bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                {t("announcements.packageDelivery")}
              </Link>
              
              <button
                onClick={() => setShowShoppingForm(true)}
                className="block w-full p-4 text-center bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                {t("announcements.shoppingList")}
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              className="mt-4 w-full p-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Modal pour créer une liste de courses */}
      {showCreateModal && showShoppingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{t("announcements.createShoppingList")}</h2>
            
            <form onSubmit={handleCreateShoppingList} className="space-y-4">
              <div>
                <label htmlFor="shopTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.title")}
                </label>
                <input
                  type="text"
                  id="shopTitle"
                  value={shopTitle}
                  onChange={(e) => setShopTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="shopList" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.shoppingList")}
                </label>
                <textarea
                  id="shopList"
                  value={shopList}
                  onChange={(e) => setShopList(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("announcements.listExample")}
                  required
                />
              </div>

              <div>
                <label htmlFor="shopPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.estimatedCost")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                  <input
                    type="number"
                    id="shopPrice"
                    value={shopPrice}
                    onChange={(e) => setShopPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="shopDeliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.deliveryAddress")}
                </label>
                <input
                  type="text"
                  id="shopDeliveryAddress"
                  value={shopDeliveryAddress}
                  onChange={(e) => setShopDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="shopDeliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.deliveryDate")}
                </label>
                <input
                  type="date"
                  id="shopDeliveryDate"
                  value={shopDeliveryDate}
                  onChange={(e) => setShopDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowShoppingForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t("common.back")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  {t("announcements.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClientLayout>
  )
} 