"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { ClientLayout } from "@/src/components/layouts"
import { useAuth } from "@/src/hooks/use-auth"
import { apiClient, getErrorMessage } from "@/src/lib/api"
import type { UpdateAnnouncementRequest } from "@/src/types/validators"

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface AnnouncementData {
  id: number
  utilisateurId: number            // Champ qui vient du backend (camelCase)
  title: string
  description?: string | null
  price: number | string
  endLocation?: string | null      // BACKEND: camelCase - peut être null
  startLocation?: string | null    // BACKEND: camelCase - peut être null
  desiredDate?: string | null      // BACKEND: camelCase - peut être null
  actualDeliveryDate?: string | null // BACKEND: camelCase - peut être null
  priority?: boolean
  storageBoxId?: string | null     // BACKEND: camelCase - peut être null
  status?: 'active' | 'pending' | 'completed' | 'cancelled'
  type?: 'transport_colis' | 'service_personne'
  insuranceAmount?: number | string  // BACKEND: camelCase - peut être string
  imagePath?: string | null        // BACKEND: camelCase - peut être null
}

// =============================================================================
// HOOK PERSONNALISÉ POUR LA GESTION D'IMAGES
// =============================================================================

function useImageUpload() {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const setInitialImagePreview = (imagePath?: string | null) => {
    if (imagePath) {
      setImagePreview(imagePath)
    }
  }

  return {
    image,
    imagePreview,
    handleImageChange,
    setInitialImagePreview
  }
}

// =============================================================================
// HOOK PERSONNALISÉ POUR LA LOGIQUE D'ÉDITION D'ANNONCE
// =============================================================================

function useAnnouncementEdit(id: string) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Charger les données de l'annonce
  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!id || !user) return

      try {
        setLoading(true)
        const response: any = await apiClient.getAnnouncement(id)
        
        // L'API renvoie { annonce: ... } - extraire l'objet annonce
        const announcementData = response?.annonce || response
        
        console.log('🔍 Debug - Announcement data:', announcementData)
        console.log('🔍 Debug - User ID:', user.id)
        console.log('🔍 Debug - Announcement userId:', announcementData.utilisateurId)
        
        // Vérifier que l'utilisateur est le propriétaire de l'annonce
        if (announcementData.utilisateurId !== user.id) {
          console.log('❌ Authorization failed - Not the announcement owner')
          setError(t("announcements.notYourAnnouncement"))
          return
        }

        setAnnouncement(announcementData)
      } catch (error) {
        console.error("Error loading announcement:", error)
        setError(getErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    loadAnnouncement()
  }, [id, user, t])

  const updateAnnouncement = (field: string, value: any) => {
    if (!announcement) return
    setAnnouncement(prev => prev ? { ...prev, [field]: value } : null)
  }

  const clearError = () => setError("")

  return {
    announcement,
    loading,
    error,
    updateAnnouncement,
    clearError
  }
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

const formatDateForInput = (dateString?: string | null) => {
  console.log('🔍 formatDateForInput called with:', dateString)
  
  if (!dateString || dateString === 'null') {
    console.log('🔍 Date is null or empty, returning empty string')
    return ""
  }
  
  try {
    // Les dates du backend sont au format ISO complet: "2025-06-25T00:00:00.000+00:00"
    // Le champ date HTML attend: "2025-06-25"
    const date = new Date(dateString)
    const formattedDate = date.toISOString().split('T')[0]
    console.log('🔍 Formatted date:', formattedDate)
    return formattedDate
  } catch (error) {
    console.log('🔍 Error formatting date:', error)
    return ""
  }
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function EditAnnouncement() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")

  // Hooks personnalisés
  const {
    announcement,
    loading,
    error,
    updateAnnouncement,
    clearError
  } = useAnnouncementEdit(id as string)

  const {
    image,
    imagePreview,
    handleImageChange,
    setInitialImagePreview
  } = useImageUpload()

  // Initialiser l'aperçu d'image quand l'annonce est chargée
  useEffect(() => {
    if (announcement?.imagePath) {
      setInitialImagePreview(announcement.imagePath)
    }
  }, [announcement?.imagePath, setInitialImagePreview])

  // =============================================================================
  // GESTION DES ÉVÉNEMENTS
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcement || !user) return

    setIsSubmitting(true)
    clearError()

    try {
      const updateData: UpdateAnnouncementRequest = {
        title: announcement.title,
        description: announcement.description || undefined,
        price: typeof announcement.price === 'string' ? parseFloat(announcement.price) : announcement.price,
        type: announcement.type,
        status: announcement.status,
        desired_date: announcement.desiredDate || undefined,
        actual_delivery_date: announcement.actualDeliveryDate || undefined,
        end_location: announcement.endLocation || undefined,
        start_location: announcement.startLocation || undefined,
        priority: announcement.priority,
        storage_box_id: announcement.storageBoxId || undefined,
        insurance_amount: typeof announcement.insuranceAmount === 'string' ? parseFloat(announcement.insuranceAmount) : announcement.insuranceAmount,
      }

      // Utiliser la méthode avec image si une nouvelle image a été sélectionnée
      const response: any = await apiClient.updateAnnouncementWithImage(
        announcement.id.toString(), 
        updateData, 
        image || undefined
      )
      
      // L'API renvoie { annonce: ... } - extraire l'objet annonce mis à jour
      const updatedAnnouncement = response?.annonce || response
      
      // NOUVEAU: Synchroniser les livraisons associées si les adresses ont changé
      if (updateData.start_location || updateData.end_location) {
        try {
          console.log('🔄 Synchronisation des livraisons associées...')
          console.log('📍 Nouvelles adresses:', {
            start_location: updateData.start_location,
            end_location: updateData.end_location,
            desired_date: updateData.desired_date
          })
          
          // Récupérer les livraisons liées à cette annonce
          const livraisonsResponse = await apiClient.get(`/annonces/${announcement.id}/livraisons`)
          const livraisons = livraisonsResponse?.livraisons || livraisonsResponse?.data || []
          
          console.log(`📦 Trouvé ${livraisons.length} livraison(s) à synchroniser`)
          
          // Mettre à jour chaque livraison avec les nouvelles adresses
          for (const livraison of livraisons) {
            console.log(`🔍 Livraison ${livraison.id} - Status: ${livraison.status}`)
            
            if (livraison.status !== 'completed' && livraison.status !== 'cancelled') {
              const updatePayload = {
                livreur_id: livraison.livreurId || livraison.livreur_id,
                pickup_location: updateData.start_location,
                dropoff_location: updateData.end_location,
                estimated_delivery_time: updateData.desired_date,
                status: livraison.status
              }
              
              console.log(`📤 Mise à jour livraison ${livraison.id} avec:`, updatePayload)
              
              await apiClient.put(`/livraisons/${livraison.id}`, updatePayload)
              console.log(`✅ Livraison ${livraison.id} mise à jour`)
            } else {
              console.log(`⏭️ Livraison ${livraison.id} ignorée (status: ${livraison.status})`)
            }
          }
          
          console.log('✅ Synchronisation terminée')
        } catch (syncError) {
          console.error('⚠️ Erreur synchronisation livraisons (non bloquant):', syncError)
        }
      }
      
      console.log("Announcement updated successfully:", updatedAnnouncement)
      router.push("/app_client/announcements")
    } catch (error) {
      console.error("Error updating announcement:", error)
      setError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!announcement) return

    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      updateAnnouncement(name, checked)
    } else if (type === 'number') {
      updateAnnouncement(name, Number(value))
    } else {
      updateAnnouncement(name, value)
    }
  }

  // =============================================================================
  // RENDU - EXACTEMENT IDENTIQUE AU COMPOSANT ORIGINAL
  // =============================================================================

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

  if (error || !announcement) {
    return (
      <ClientLayout activeRoute="announcements">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4">
              {error || t("announcements.announcementNotFound")}
            </div>
            <Link
              href="/app_client/announcements"
              className="mt-4 inline-block text-green-500 hover:underline"
            >
              {t("announcements.goBackToAnnouncements")}
            </Link>
          </div>
        </main>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout activeRoute="announcements">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/app_client/announcements" className="text-gray-600 hover:text-green-500 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-green-400">{t("announcements.editYourAnnouncement")}</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-8">
                <div className="w-64 h-64 mb-2 relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview.startsWith('data:') 
                        ? imagePreview 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/${imagePreview}`
                      }
                      alt={announcement.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                      <span className="text-gray-400">{t("announcements.noImage")}</span>
                    </div>
                  )}
                </div>
                <label htmlFor="photo-upload" className="text-green-500 hover:text-green-600 cursor-pointer text-sm">
                  {t("announcements.editPhoto")}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.announceName")}
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={announcement.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.description")}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={announcement.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="endLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.whereTo")}
                </label>
                <input
                  type="text"
                  id="endLocation"
                  name="endLocation"
                  value={announcement.endLocation || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Entrez l'adresse de destination"
                />
              </div>

              <div>
                <label htmlFor="startLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("announcements.startingPoint")}
                </label>
                <input
                  type="text"
                  id="startLocation"
                  name="startLocation"
                  value={announcement.startLocation || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Entrez l'adresse de départ"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("announcements.price")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={typeof announcement.price === 'string' ? announcement.price : announcement.price || ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="desiredDate" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("announcements.deliveryDate")}
                  </label>
                  <input
                    type="date"
                    id="desiredDate"
                    name="desiredDate"
                    value={formatDateForInput(announcement.desiredDate)}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("announcements.type")}
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={announcement.type || 'transport_colis'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="transport_colis">{t("announcements.transportColis")}</option>
                    <option value="service_personne">{t("announcements.servicePersonne")}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    {t("announcements.status")}
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={announcement.status || 'active'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">{t("announcements.active")}</option>
                    <option value="pending">{t("announcements.pending")}</option>
                    <option value="completed">{t("announcements.completed")}</option>
                    <option value="cancelled">{t("announcements.cancelled")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="priority"
                  name="priority"
                  checked={announcement.priority || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="priority" className="ml-2 block text-sm text-gray-700">
                  {t("announcements.activatePriorityShipping")}
                </label>
              </div>

              <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800">
                {t("announcements.priorityShippingInfo")}
              </div>

              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                <div className="font-medium">{t("announcements.syncInfo")}</div>
                <div>{t("announcements.syncInfoMessage")}</div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  href="/app_client/announcements"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t("common.cancel")}
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </ClientLayout>
  )
} 