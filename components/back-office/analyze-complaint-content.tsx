"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  MessageSquare,
  RefreshCw,
  Save
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAdmin } from '@/src/hooks/use-admin'
import { ComplaintTransformed } from '@/src/types/validators'

interface AnalyzeComplaintContentProps {
  id: string
}

export function AnalyzeComplaintContent({ id }: AnalyzeComplaintContentProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const { 
    getComplaint, 
    updateComplaint, 
    resolveComplaint, 
    closeComplaint, 
    setComplaintInProgress,
    loading, 
    error 
  } = useAdmin()
  
  const [complaint, setComplaint] = useState<ComplaintTransformed | null>(null)
  const [loadingComplaint, setLoadingComplaint] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // État pour les dialogues d'action
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'resolve' | 'close' | 'in_progress'>('resolve')
  const [adminNotes, setAdminNotes] = useState('')
  
  // État pour la mise à jour des informations
  const [editMode, setEditMode] = useState(false)
  const [editedStatus, setEditedStatus] = useState('')
  const [editedPriority, setEditedPriority] = useState('')

  // Charger la réclamation
  const loadComplaint = async () => {
    try {
      setLoadingComplaint(true)
      const complaintId = Number(id)
      const complaintData = await getComplaint(complaintId)
      
      if (!complaintData) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Réclamation non trouvée"
        })
        router.push('/admin/complaints')
        return
      }
      
      // Transformation des données pour correspondre au type attendu
      const transformedComplaint: ComplaintTransformed = {
        id: complaintData.id,
        client: complaintData.utilisateur ? `${complaintData.utilisateur.first_name} ${complaintData.utilisateur.last_name}` : 'Utilisateur inconnu',
        email: complaintData.utilisateur?.email || 'Email non disponible',
        announceId: complaintData.relatedOrderId || 'N/A',
        subject: complaintData.subject,
        description: complaintData.description,
        status: complaintData.status,
        priority: complaintData.priority,
        adminNotes: complaintData.adminNotes,
        createdAt: complaintData.createdAt,
        updatedAt: complaintData.updatedAt,
        userId: complaintData.utilisateurId
      }
      
      setComplaint(transformedComplaint)
      setEditedStatus(transformedComplaint.status)
      setEditedPriority(transformedComplaint.priority)
      setAdminNotes(transformedComplaint.adminNotes || '')
      
    } catch (error) {
      console.error('❌ Erreur chargement réclamation:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Erreur lors du chargement'
      })
    } finally {
      setLoadingComplaint(false)
    }
  }

  useEffect(() => {
    loadComplaint()
  }, [id])

  // Fonctions utilitaires pour l'affichage
  const getStatusConfig = (status: string) => {
    const configs = {
      'open': { 
        label: 'Ouverte', 
        color: 'bg-red-100 text-red-800',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      'in_progress': { 
        label: 'En cours', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-4 w-4" />
      },
      'resolved': { 
        label: 'Résolue', 
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-4 w-4" />
      },
      'closed': { 
        label: 'Fermée', 
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="h-4 w-4" />
      }
    }
    return configs[status as keyof typeof configs] || configs.open
  }

  const getPriorityConfig = (priority: string) => {
    const configs = {
      'low': { label: 'Faible', color: 'bg-blue-100 text-blue-800' },
      'medium': { label: 'Moyenne', color: 'bg-orange-100 text-orange-800' },
      'high': { label: 'Élevée', color: 'bg-red-100 text-red-800' },
      'urgent': { label: 'URGENT', color: 'bg-purple-100 text-purple-800' }
    }
    return configs[priority as keyof typeof configs] || configs.medium
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Date invalide'
      
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Gestion des actions
  const handleActionSubmit = async () => {
    if (!complaint) return
    
    try {
      setProcessing(true)
      
      const complaintId = Number(complaint.id)
      let result: any = null
      
      switch (actionType) {
        case 'resolve':
          result = await resolveComplaint(complaintId, adminNotes)
          if (result) {
            toast({
              title: "Succès",
              description: "Réclamation marquée comme résolue",
              variant: "default"
            })
          }
          break
          
        case 'close':
          result = await closeComplaint(complaintId, adminNotes)
          if (result) {
            toast({
              title: "Succès", 
              description: "Réclamation fermée",
              variant: "default"
            })
          }
          break
          
        case 'in_progress':
          result = await setComplaintInProgress(complaintId, adminNotes)
          if (result) {
            toast({
              title: "Succès",
              description: "Réclamation mise en cours de traitement",
              variant: "default"
            })
          }
          break
          
        default:
          throw new Error('Action non reconnue')
      }
      
      // Si l'action a réussi, recharger la réclamation
      if (result) {
        await loadComplaint() // Recharger les données depuis le serveur
        setActionDialogOpen(false)
        setAdminNotes('')
      } else {
        throw new Error('L\'action a échoué')
      }
      
    } catch (error) {
      console.error('❌ Erreur action réclamation:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Erreur lors du traitement'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateComplaint = async () => {
    if (!complaint) return
    
    try {
      setProcessing(true)
      
      const complaintId = Number(complaint.id)
      const result = await updateComplaint(complaintId, {
        status: editedStatus as any,
        priority: editedPriority as any,
        admin_notes: adminNotes
      })
      
      if (result) {
        await loadComplaint() // Recharger depuis le serveur
        setEditMode(false)
        
        toast({
          title: "Succès",
          description: "Réclamation mise à jour avec succès",
          variant: "default"
        })
      }
      
    } catch (error) {
      console.error('❌ Erreur mise à jour réclamation:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      })
    } finally {
      setProcessing(false)
    }
  }

  const openActionDialog = (action: 'resolve' | 'close' | 'in_progress') => {
    setActionType(action)
    setActionDialogOpen(true)
  }

  if (loadingComplaint) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement de la réclamation...</span>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Réclamation non trouvée</p>
        <Link href="/admin/complaints">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réclamations
          </Button>
        </Link>
      </div>
    )
  }

  const statusConfig = getStatusConfig(complaint.status)
  const priorityConfig = getPriorityConfig(complaint.priority)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/admin/complaints" 
            className="text-blue-600 hover:text-blue-800 flex items-center mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux réclamations
          </Link>
          <h1 className="text-2xl font-bold">
            Analyse de la réclamation #{complaint.id}
          </h1>
          <p className="text-gray-600">Client: {complaint.client}</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            disabled={processing}
          >
            {editMode ? 'Annuler' : 'Modifier'}
          </Button>
          {editMode && (
            <Button
              onClick={handleUpdateComplaint}
              disabled={processing}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          )}
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la réclamation */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Détails de la réclamation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Sujet</Label>
                <p className="mt-1 text-lg font-semibold text-gray-900">{complaint.subject}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-800 whitespace-pre-wrap">{complaint.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Annonce ID</Label>
                  <p className="mt-1 font-mono text-sm text-gray-600">{complaint.announceId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">ID Utilisateur</Label>
                  <p className="mt-1 font-mono text-sm text-gray-600">{complaint.userId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations et actions */}
        <div className="space-y-6">
          {/* Statut et priorité */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">État de la réclamation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Statut</Label>
                {editMode ? (
                  <Select value={editedStatus} onValueChange={setEditedStatus}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouverte</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="resolved">Résolue</SelectItem>
                      <SelectItem value="closed">Fermée</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2 mt-1">
                    {statusConfig.icon}
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Priorité</Label>
                {editMode ? (
                  <Select value={editedPriority} onValueChange={setEditedPriority}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Date de création</Label>
                <div className="flex items-center space-x-1 mt-1 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(complaint.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          {!editMode && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {complaint.status === 'open' && (
                  <Button 
                    onClick={() => openActionDialog('in_progress')}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    disabled={processing}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Prendre en charge
                  </Button>
                )}
                
                <Button 
                  onClick={() => openActionDialog('resolve')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme résolue
                </Button>
                
                <Button 
                  onClick={() => openActionDialog('close')}
                  variant="destructive"
                  className="w-full"
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Fermer la réclamation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Notes admin */}
      <Card>
        <CardHeader>
          <CardTitle>Notes administrateur</CardTitle>
          <CardDescription>
            Notes internes pour le traitement de cette réclamation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ajoutez des notes sur le traitement de cette réclamation..."
              className="min-h-[120px]"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-md min-h-[120px]">
              {complaint.adminNotes ? (
                <p className="text-gray-800 whitespace-pre-wrap">{complaint.adminNotes}</p>
              ) : (
                <p className="text-gray-500 italic">Aucune note administrateur</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour les actions */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'resolve' && 'Résoudre la réclamation'}
              {actionType === 'close' && 'Fermer la réclamation'}
              {actionType === 'in_progress' && 'Prendre en charge'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'resolve' && 'Marquer cette réclamation comme résolue.'}
              {actionType === 'close' && 'Fermer définitivement cette réclamation.'}
              {actionType === 'in_progress' && 'Mettre cette réclamation en cours de traitement.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ajoutez des commentaires sur cette action..."
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={processing}
              className={
                actionType === 'resolve' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'close' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {processing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

