"use client"

import { useState, useEffect } from "react"
import { ComplaintsTable } from "@/components/back-office/complaints-table"
import { useLanguage } from "@/components/language-context"
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, FileText, AlertCircle, CheckCircle, Clock, Filter, Search } from "lucide-react"
import { useAdmin } from '@/src/hooks/use-admin'
import { ComplaintTransformed } from '@/src/types/validators'

export function ComplaintsContent() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { getComplaints, loading, error } = useAdmin()
  
  const [complaintsData, setComplaintsData] = useState<ComplaintTransformed[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<ComplaintTransformed[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Charger toutes les réclamations
  const loadComplaints = async () => {
    try {
      setRefreshing(true)
      const complaints = await getComplaints()
      setComplaintsData(complaints)
      console.log('✅ Réclamations chargées:', complaints.length)
    } catch (error) {
      console.error('❌ Error loading complaints:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Erreur lors du chargement des réclamations'
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await loadComplaints()
  }

  // Filtrer les réclamations
  useEffect(() => {
    let filtered = complaintsData

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(complaint => 
        complaint.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.announceId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter)
    }

    // Filtre par priorité
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter)
    }

    setFilteredComplaints(filtered)
  }, [complaintsData, searchTerm, statusFilter, priorityFilter])

  useEffect(() => {
    loadComplaints()
  }, [])

  // Fonctions utilitaires pour les badges et statistiques
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { label: 'Ouverte', color: 'bg-red-100 text-red-800' },
      'in_progress': { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
      'resolved': { label: 'Résolue', color: 'bg-green-100 text-green-800' },
      'closed': { label: 'Fermée', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { label: 'Faible', color: 'bg-blue-100 text-blue-800' },
      'medium': { label: 'Moyenne', color: 'bg-orange-100 text-orange-800' },
      'high': { label: 'Élevée', color: 'bg-red-100 text-red-800' },
      'urgent': { label: 'Urgente', color: 'bg-purple-100 text-purple-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date invalide'
      }
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  if (loading || refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des réclamations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 text-center">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
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
          <h1 className="text-2xl font-bold">{t("admin.complaints")}</h1>
          <p className="text-gray-600">Gestion des réclamations clients</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{complaintsData.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ouvertes</p>
                <p className="text-2xl font-bold text-red-600">
                  {complaintsData.filter(c => c.status === 'open').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {complaintsData.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résolues</p>
                <p className="text-2xl font-bold text-green-600">
                  {complaintsData.filter(c => c.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par client, email, sujet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvertes</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolues</SelectItem>
                <SelectItem value="closed">Fermées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des réclamations */}
      <Card>
        <CardHeader>
          <CardTitle>Réclamations ({filteredComplaints.length})</CardTitle>
          <CardDescription>
            Cliquez sur une réclamation pour l'analyser et la traiter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune réclamation trouvée</p>
            </div>
          ) : (
            <ComplaintsTable 
              data={filteredComplaints.map(complaint => ({
                id: complaint.id,
                client: complaint.client,
                announceId: complaint.announceId,
                shippingPrice: 'N/A', // Pas dans le modèle backend
                justificativePieces: 0, // À implémenter si nécessaire
                description: complaint.description,
                status: complaint.status,
                subject: complaint.subject,
                priority: complaint.priority,
                created_at: complaint.createdAt,
                utilisateur_id: complaint.userId
              }))} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

