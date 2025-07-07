'use client'

import React, { useState, useEffect } from 'react'
import { apiClient } from '@/src/lib/api'
import { API_ROUTES } from '@/src/lib/api-routes'

/**
 * Interface pour les réclamations conformément au backend
 */
interface Complaint {
  id: number
  utilisateurId: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  relatedOrderId: string | null
  imagePath: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  // Relation utilisateur
  utilisateur?: {
    firstName: string
    lastName: string
    email: string
  }
}

/**
 * Gestion des réclamations pour l'admin
 * Utilise l'API centralisée et les types stricts
 */
export default function ComplaintsManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Charger les réclamations
  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getComplaints()
      setComplaints(response)
    } catch (error) {
      console.error('Erreur lors du chargement des réclamations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour le statut d'une réclamation
  const updateComplaintStatus = async (id: number, status: string, adminNotes?: string) => {
    try {
      await apiClient.updateComplaint(id.toString(), { status, adminNotes })
      await loadComplaints() // Recharger la liste
      setSelectedComplaint(null)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  // Filtrer les réclamations
  const filteredComplaints = complaints.filter(complaint => {
    const statusMatch = statusFilter === 'all' || complaint.status === statusFilter
    const priorityMatch = priorityFilter === 'all' || complaint.priority === priorityFilter
    return statusMatch && priorityMatch
  })

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return styles[status as keyof typeof styles] || styles.open
  }

  // Badge de priorité
  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      urgent: 'bg-purple-100 text-purple-800'
    }
    return styles[priority as keyof typeof styles] || styles.low
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des Réclamations
        </h1>
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Toutes les priorités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      {/* Liste des réclamations */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredComplaints.map((complaint) => (
            <li key={complaint.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                   onClick={() => setSelectedComplaint(complaint)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        #{complaint.id} - {complaint.subject}
                      </p>
                      <p className="text-sm text-gray-900">
                        Par: {complaint.utilisateur?.firstName} {complaint.utilisateur?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(complaint.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de détail */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Réclamation #{selectedComplaint.id}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sujet</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedComplaint.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedComplaint.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      value={selectedComplaint.status}
                      onChange={(e) => setSelectedComplaint({
                        ...selectedComplaint,
                        status: e.target.value as any
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="open">Ouvert</option>
                      <option value="in_progress">En cours</option>
                      <option value="resolved">Résolu</option>
                      <option value="closed">Fermé</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priorité</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes administrateur</label>
                  <textarea
                    value={selectedComplaint.adminNotes || ''}
                    onChange={(e) => setSelectedComplaint({
                      ...selectedComplaint,
                      adminNotes: e.target.value
                    })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ajouter des notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => updateComplaintStatus(
                    selectedComplaint.id,
                    selectedComplaint.status,
                    selectedComplaint.adminNotes || undefined
                  )}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 