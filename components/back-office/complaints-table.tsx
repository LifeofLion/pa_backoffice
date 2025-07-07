"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResponsiveTableWrapper } from "@/components/back-office/responsive-table-wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLanguage } from "@/components/language-context"
import { Eye, Calendar, User, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"

interface ComplaintData {
  id: number
  client: string
  announceId: string
  shippingPrice: string
  justificativePieces: number
  description: string
  status: string
  subject?: string
  priority?: string
  created_at?: string
  utilisateur_id?: number
}

interface ComplaintsTableProps {
  data: ComplaintData[]
}

export function ComplaintsTable({ data }: ComplaintsTableProps) {
  const { t } = useLanguage()
  
  // Fonction pour rendre le badge de statut avec la bonne couleur et icône
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { 
        label: 'Ouverte', 
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      },
      'in_progress': { 
        label: 'En cours', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      'resolved': { 
        label: 'Résolue', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'closed': { 
        label: 'Fermée', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      'pending': { 
        label: 'En attente', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      }
    }

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.open
    
    return (
      <Badge variant="outline" className={`${config.className} flex items-center w-fit`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  // Fonction pour rendre le badge de priorité
  const renderPriorityBadge = (priority: string) => {
    if (!priority) return null
    
    const priorityConfig = {
      'low': { 
        label: 'Faible', 
        className: 'bg-blue-50 text-blue-700 border-blue-200' 
      },
      'medium': { 
        label: 'Moyenne', 
        className: 'bg-orange-50 text-orange-700 border-orange-200' 
      },
      'high': { 
        label: 'Élevée', 
        className: 'bg-red-50 text-red-700 border-red-200' 
      },
      'urgent': { 
        label: 'URGENT', 
        className: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold' 
      }
    }

    const config = priorityConfig[priority.toLowerCase() as keyof typeof priorityConfig] || priorityConfig.medium
    
    return (
      <Badge variant="outline" className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    )
  }

  // Fonction pour formater la date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Date invalide'
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Fonction pour tronquer le texte
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text) return 'N/A'
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  return (
    <ResponsiveTableWrapper>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">Client</TableHead>
            <TableHead className="font-semibold text-gray-700">Sujet</TableHead>
            <TableHead className="font-semibold text-gray-700">Annonce ID</TableHead>
            <TableHead className="font-semibold text-gray-700">Priorité</TableHead>
            <TableHead className="font-semibold text-gray-700">Statut</TableHead>
            <TableHead className="font-semibold text-gray-700">Date</TableHead>
            <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((complaint) => (
            <TableRow 
              key={complaint.id} 
              className="hover:bg-gray-50 border-b transition-colors"
            >
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{complaint.client}</p>
                    <p className="text-xs text-gray-500">ID: {complaint.utilisateur_id}</p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="max-w-xs">
                  <p className="font-medium text-gray-900 truncate">
                    {complaint.subject || 'Sans sujet'}
                  </p>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {truncateText(complaint.description, 40)}
                  </p>
                </div>
              </TableCell>
              
              <TableCell>
                <span className="font-mono text-sm text-gray-600">
                  {complaint.announceId}
                </span>
              </TableCell>
              
              <TableCell>
                {renderPriorityBadge(complaint.priority || 'medium')}
              </TableCell>
              
              <TableCell>
                {renderStatusBadge(complaint.status)}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(complaint.created_at)}</span>
                </div>
              </TableCell>
              
              <TableCell className="text-center">
                <Link href={`/admin/complaints/${complaint.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-blue-50 hover:border-blue-200"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Analyser
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableWrapper>
  )
}

