"use client"

import React, { useState, useEffect } from "react"
import { DeliverymanLayout } from "@/src/components/layouts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Package, Clock, Euro, Search, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useAuth } from "@/src/hooks/use-auth"
import { apiClient } from "@/src/lib/api"
import { toast } from "@/components/ui/use-toast"

// Interface pour les annonces (pas les livraisons!)
interface Announcement {
  id: number
  title: string
  description?: string
  image?: string
  client: string
  clientId: number
  address: string
  price: number
  deliveryDate: string
  amount: number
  storageBox?: string
  size: "Small" | "Medium" | "Large"
  isPriority: boolean
  utilisateurId: number
  status: string
  start_location: string
  end_location: string
}

export default function DeliverymanAnnouncements() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)

  // Charger les annonces disponibles
  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      console.log('🔍 Chargement des annonces disponibles...')
      
      const response = await apiClient.getAnnouncements()
      console.log('📋 Réponse API annonces:', response)
      
      // Extraire les annonces du format backend
      let annoncesData: any[] = []
      if (Array.isArray(response)) {
        annoncesData = response
      } else if (response && typeof response === 'object') {
        // Vérifier les différents formats possibles de réponse
        if ('annonces' in response) {
          const annonces = (response as any).annonces
          if (Array.isArray(annonces)) {
            annoncesData = annonces
          } else if (annonces && typeof annonces === 'object' && 'data' in annonces && Array.isArray(annonces.data)) {
            annoncesData = annonces.data
          }
        } else if ('data' in response && Array.isArray((response as any).data)) {
          annoncesData = (response as any).data
        }
      }
      
      console.log('📦 Données annonces extraites:', annoncesData)
      
      // Transformer et filtrer les annonces actives
      const formattedAnnouncements: Announcement[] = annoncesData
        .filter((annonce: any) => annonce.status === 'active' && annonce.type === 'transport_colis')
        .map((annonce: any) => {
          
          console.log('🏠 Données d\'adresse pour annonce', annonce.id, ':', {
            start_location: annonce.start_location,
            startLocation: annonce.startLocation,
            end_location: annonce.end_location,
            endLocation: annonce.endLocation,
            allFields: Object.keys(annonce)
          })
          
          return {
            id: annonce.id,
            title: annonce.title || "Annonce sans titre",
            description: annonce.description,
            image: annonce.imagePath ? `${process.env.NEXT_PUBLIC_API_URL}/${annonce.imagePath}` : undefined,
            client: annonce.utilisateur ? 
              `${annonce.utilisateur.first_name || ''} ${annonce.utilisateur.last_name || ''}`.trim() : 
              "Client",
            clientId: annonce.utilisateur?.id || annonce.utilisateur_id,
            address: annonce.end_location || annonce.endLocation || "Adresse non spécifiée",
            price: Number(annonce.price) || 0,
            deliveryDate: formatDate(annonce.desired_date),
            amount: 1,
            storageBox: annonce.storage_box_id || "Non spécifié",
            size: getSizeFromPrice(Number(annonce.price) || 0) as "Small" | "Medium" | "Large",
            isPriority: annonce.priority || false,
            utilisateurId: annonce.utilisateur_id,
            status: annonce.status,
            start_location: annonce.start_location || annonce.startLocation || "Point de départ",
            end_location: annonce.end_location || annonce.endLocation || "Destination"
          }
        })

      setAnnouncements(formattedAnnouncements)
      console.log('✅ Annonces formatées:', formattedAnnouncements)
      
    } catch (error) {
      console.error('❌ Erreur chargement annonces:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Rafraîchir les données
  const refreshData = () => {
    loadAnnouncements()
  }

  // Chargement initial
  useEffect(() => {
    loadAnnouncements()
  }, [])

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Accepter une annonce et créer une livraison
  const handleAccept = async (announcementId: number) => {
    if (!user?.livreur?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté en tant que livreur",
        variant: "destructive"
      })
      return
    }

    setAcceptingId(announcementId)
    
    try {
      console.log('🚛 Acceptation de l\'annonce:', announcementId)
      
      // 1. Créer la livraison
      const livraisonResponse = await apiClient.post(`/annonces/${announcementId}/livraisons`, {
        livreur_id: user.livreur.id,
        status: 'scheduled',
        pickup_location: announcements.find(a => a.id === announcementId)?.start_location || "À récupérer",
        dropoff_location: announcements.find(a => a.id === announcementId)?.end_location || "À livrer"
      })
      
      console.log('✅ Livraison créée:', livraisonResponse)
      
      // 2. Mettre à jour le statut de l'annonce
      const announcement = announcements.find(a => a.id === announcementId)
      if (announcement) {
        await apiClient.updateAnnouncement(announcementId.toString(), {
          status: 'pending', // Annonce prise en charge
          price: announcement.price, // Requis par le backend
          title: announcement.title, // Optionnel mais on garde la cohérence
          description: announcement.description, // Optionnel
          type: 'transport_colis', // Type de l'annonce
          start_location: announcement.start_location,
          end_location: announcement.end_location,
          priority: announcement.isPriority
        })
      }
      
      // 3. Créer une conversation automatique avec le client
      if (announcement?.clientId) {
        try {
          await apiClient.sendMessage({
            senderId: user.id,
            receiverId: announcement.clientId,
            content: `Bonjour ! Je suis votre livreur pour "${announcement.title}". J'ai accepté votre demande de transport et je vais bientôt récupérer votre colis. N'hésitez pas à me contacter si vous avez des questions !`,
            tempId: `auto_${Date.now()}`
          })
          console.log('💬 Conversation automatique créée avec le client')
        } catch (msgError) {
          console.error('⚠️ Erreur création conversation (non bloquant):', msgError)
        }
      }
      
      // 4. Toast de succès
      toast({
        title: "Livraison acceptée !",
        description: `Vous avez pris en charge "${announcement?.title}". Une conversation a été ouverte avec le client.`,
      })
      
      // 5. Retirer l'annonce de la liste et recharger depuis le serveur
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId))
      
      // 6. Recharger les annonces pour s'assurer de la synchronisation
      setTimeout(() => {
        loadAnnouncements()
      }, 1000)
      
      // 7. Redirection vers les livraisons après 3 secondes
      setTimeout(() => {
        window.location.href = '/app_deliveryman/deliveries'
      }, 3000)
      
    } catch (error) {
      console.error('❌ Erreur acceptation livraison:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'accepter cette livraison. Veuillez réessayer.",
        variant: "destructive"
      })
    } finally {
      setAcceptingId(null)
    }
  }

  // Filtrer les annonces par recherche
  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.client.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non spécifiée"
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  const getSizeFromPrice = (price: number) => {
    if (price <= 20) return "Small"
    if (price <= 50) return "Medium"
    return "Large"
  }

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance} m`
    }
    return `${(distance / 1000).toFixed(1)} km`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  return (
    <DeliverymanLayout activeRoute="announcements">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t("deliveryman.announcements")}</h1>
          <Button onClick={refreshData} variant="outline" size="sm">
            {t("common.refresh")}
          </Button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher par titre, adresse ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Annonces disponibles</p>
                  <p className="text-2xl font-bold">{filteredAnnouncements.length}</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Livraisons urgentes</p>
                  <p className="text-2xl font-bold">
                    {filteredAnnouncements.filter(a => a.isPriority).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Valeur totale</p>
                  <p className="text-2xl font-bold">
                    €{(filteredAnnouncements.reduce((sum, a) => sum + (Number(a.price) || 0), 0) || 0).toFixed(2)}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des annonces */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchTerm
                  ? "Aucune annonce trouvée pour votre recherche"
                  : "Aucune annonce disponible pour le moment"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {announcement.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Par {announcement.client} - {announcement.deliveryDate}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {announcement.isPriority && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                      <Badge variant="outline" className="font-semibold">
                        €{(Number(announcement.price) || 0).toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Description */}
                    {announcement.description && (
                      <p className="text-sm text-gray-600">{announcement.description}</p>
                    )}

                    {/* Adresse de récupération */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Récupération</p>
                        <p className="text-sm text-gray-600">{announcement.start_location}</p>
                      </div>
                    </div>

                    {/* Adresse de livraison */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Livraison</p>
                        <p className="text-sm text-gray-600">{announcement.address}</p>
                      </div>
                    </div>

                    {/* Infos supplémentaires */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Taille: {announcement.size}</span>
                      <span>•</span>
                      <span>Colis: {announcement.amount}</span>
                    </div>

                    {/* Bouton d'action */}
                    <Button
                      className="w-full"
                      onClick={() => handleAccept(announcement.id)}
                      disabled={acceptingId === announcement.id}
                      variant={announcement.isPriority ? "destructive" : "default"}
                    >
                      {acceptingId === announcement.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Acceptation en cours...
                        </>
                      ) : (
                        announcement.isPriority ? "Accepter (Urgent)" : "Accepter cette livraison"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DeliverymanLayout>
  )
} 