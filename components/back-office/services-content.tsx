"use client"

import { useState, useEffect } from "react"
import { ServiceTable } from "@/components/back-office/service-table"
import { useLanguage } from "@/components/language-context"
import { useAdmin } from '@/src/hooks/use-admin'
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  RefreshCw, 
  Search, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Euro,
  Star,
  AlertCircle
} from "lucide-react"

// Types simples pour éviter les erreurs
interface SimpleServiceData {
  id: number
  name: string
  description: string
  price: number
  provider?: string
  status?: string
  isActive?: boolean
}

export function ServicesContent() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const {
    loading,
    error,
    getAllServices,
    getAllPrestataires,
    getAllServiceTypes,
    getServiceAnalytics,
    clearError
  } = useAdmin()

  // États pour les données (types simples)
  const [services, setServices] = useState<SimpleServiceData[]>([])
  const [prestataires, setPrestataires] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // États pour l'interface
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('services')

  // ================================================================
  // CHARGEMENT DES DONNÉES SIMPLIFIÉ
  // ================================================================

  const loadAllData = async () => {
    setRefreshing(true)
    clearError()
    
    try {
      // Essayer de charger les données principales (services)
      const servicesData = await getAllServices()
      if (servicesData && Array.isArray(servicesData)) {
        // Transformation simple des données
        const transformedServices = servicesData.map((service: any) => ({
          id: service.id || 0,
          name: service.name || 'Service sans nom',
          description: service.description || '',
          price: service.price || 0,
          provider: service.provider || service.prestataire_name || 'Prestataire inconnu',
          status: service.status || 'active',
          isActive: service.is_active !== undefined ? service.is_active : true
        }))
        setServices(transformedServices)
      }

      // Essayer de charger les données optionnelles avec fallback
      try {
        const prestatairesData = await getAllPrestataires()
        if (prestatairesData && Array.isArray(prestatairesData)) {
          setPrestataires(prestatairesData)
        }
      } catch (err) {
        console.warn('Prestataires non disponibles:', err)
        setPrestataires([]) // Fallback avec tableau vide
      }

      try {
        const typesData = await getAllServiceTypes()
        if (typesData && Array.isArray(typesData)) {
          setServiceTypes(typesData)
        }
      } catch (err) {
        console.warn('Types de services non disponibles:', err)
        setServiceTypes([]) // Fallback avec tableau vide
      }

      try {
        const analyticsData = await getServiceAnalytics()
        if (analyticsData) {
          setAnalytics(analyticsData)
        }
      } catch (err) {
        console.warn('Analytics non disponibles:', err)
        setAnalytics(null) // Fallback avec null
      }

      toast({
        title: "Données actualisées",
        description: "Les informations disponibles ont été rechargées avec succès."
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger certaines données."
      })
    } finally {
      setRefreshing(false)
    }
  }

  // ================================================================
  // FILTRAGE DES DONNÉES SIMPLIFIÉ
  // ================================================================

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.provider && service.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // ================================================================
  // EFFETS
  // ================================================================

  useEffect(() => {
    loadAllData()
  }, [])

  // ================================================================
  // COMPOSANTS DE STATISTIQUES SIMPLIFIÉS
  // ================================================================

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Services Total</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{services.length}</div>
          <p className="text-xs text-muted-foreground">
            {services.filter(s => s.isActive).length} actifs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prestataires</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{prestataires.length}</div>
          <p className="text-xs text-muted-foreground">
            Disponibles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Types de Services</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{serviceTypes.length}</div>
          <p className="text-xs text-muted-foreground">
            Types disponibles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenus</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">N/A</div>
          <p className="text-xs text-muted-foreground">
            En cours de calcul
          </p>
        </CardContent>
      </Card>
    </div>
  )

  // ================================================================
  // INTERFACE DE FILTRAGE SIMPLIFIÉE
  // ================================================================

  const FilterControls = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="inactive">Inactif</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  // ================================================================
  // RENDU PRINCIPAL SIMPLIFIÉ
  // ================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des services...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={loadAllData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.services")}</h1>
          <p className="text-gray-600">
            Gestion des services EcoDeli ({services.length} total)
          </p>
        </div>
        <Button 
          onClick={loadAllData} 
          variant="outline"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <StatsCards />

      {/* Onglets simplifiés */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Services ({filteredServices.length})</TabsTrigger>
          <TabsTrigger value="prestataires">Prestataires ({prestataires.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <FilterControls />
          {filteredServices.length > 0 ? (
            <div className="space-y-4">
              {filteredServices.map(service => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{service.provider}</p>
                        <p className="font-medium">{service.price}€</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {service.id}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Aucun service trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prestataires" className="space-y-4">
          {prestataires.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prestataires.map((prestataire, index) => (
                <Card key={prestataire.id || index}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {prestataire.name || prestataire.firstName || 'Prestataire'} {prestataire.lastName || ''}
                    </CardTitle>
                    <CardDescription>{prestataire.email || 'Email non renseigné'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Type:</span> {prestataire.service_type || 'Non défini'}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Statut:</span> {prestataire.state || 'Inconnu'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Aucun prestataire trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

