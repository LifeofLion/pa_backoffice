'use client'

import { useState, useEffect } from 'react'
import { Star, Calendar, MessageCircle, Users, ChevronRight, Plus, AlertCircle, FileText, CheckCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-context'
import { ClientLayout } from '@/src/components/layouts'
import { useAuth } from '@/src/hooks/use-auth'
import { apiClient } from '@/src/lib/api'

// =============================================================================
// TYPES
// =============================================================================

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
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function ComplaintClient() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "open" | "resolved">("all")
  const [showDetailsModal, setShowDetailsModal] = useState<Complaint | null>(null)

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (user?.id) {
      loadComplaints()
    }
  }, [user?.id])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadComplaints = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)
      
      const userComplaints = await apiClient.getUserComplaints(user.id.toString())
      setComplaints(userComplaints)
    } catch (error) {
      console.error('Erreur lors du chargement des réclamations:', error)
      setError('Impossible de charger les réclamations')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // GETTERS
  // =============================================================================

  const getFilteredComplaints = () => {
    return complaints.filter((complaint) => {
      if (activeTab === "all") return true
      if (activeTab === "open") return ["open", "in_progress"].includes(complaint.status)
      if (activeTab === "resolved") return ["resolved", "closed"].includes(complaint.status)
      return true
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "open":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "resolved":
        return t("complaints.resolved")
      case "in_progress":
        return t("complaints.inProgress")
      case "open":
        return t("complaints.open")
      case "closed":
        return t("complaints.closed")
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "open":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "closed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return t("complaints.urgent")
      case "high":
        return t("complaints.high")
      case "medium":
        return t("complaints.medium")
      case "low":
        return t("complaints.low")
      default:
        return priority
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // =============================================================================
  // VÉRIFICATION D'AUTHENTIFICATION
  // =============================================================================

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('common.authRequired')}
          </h2>
          <Link
            href="/login"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('common.login')}
          </Link>
        </div>
      </div>
    )
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-green-600">
            {t("complaints.yourComplaints")}
          </h1>

          <Link
            href="/app_client/complaint/create"
            className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("complaints.makeComplaint")}
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "all" ? "bg-white shadow-sm text-green-600" : "hover:bg-gray-200"
              }`}
            >
              {t("common.all")}
            </button>
            <button
              onClick={() => setActiveTab("open")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "open" ? "bg-white shadow-sm text-green-600" : "hover:bg-gray-200"
              }`}
            >
              {t("complaints.open")}
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "resolved" ? "bg-white shadow-sm text-green-600" : "hover:bg-gray-200"
              }`}
            >
              {t("complaints.resolved")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">{t("common.loading")}...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadComplaints}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t("common.retry")}
                </button>
              </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                        {t("complaints.subject")}
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                        {t("complaints.priority")}
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                        {t("complaints.relatedOrder")}
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                        {t("complaints.dateSubmitted")}
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                        {t("complaints.status")}
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                        {t("common.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredComplaints().length > 0 ? (
                      getFilteredComplaints().map((complaint) => (
                        <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{complaint.subject}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {complaint.description}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                                complaint.priority,
                              )}`}
                            >
                              {getPriorityText(complaint.priority)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {complaint.relatedOrderId ? (
                              <span className="text-sm text-gray-600">#{complaint.relatedOrderId}</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(complaint.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                complaint.status,
                              )}`}
                            >
                              {getStatusText(complaint.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setShowDetailsModal(complaint)}
                              className="text-green-600 hover:text-green-800 font-medium flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t("complaints.viewDetails")}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p>{t("complaints.noComplaints")}</p>
                          <Link
                            href="/app_client/complaint/create"
                            className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("complaints.makeFirstComplaint")}
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal de détails */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("complaints.complaintDetails")}
                </h3>
                <div className="flex items-center">
                  {getStatusIcon(showDetailsModal.status)}
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      showDetailsModal.status,
                    )}`}
                  >
                    {getStatusText(showDetailsModal.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("complaints.subject")}</p>
                  <p className="font-medium">{showDetailsModal.subject}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("complaints.priority")}</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                      showDetailsModal.priority,
                    )}`}
                  >
                    {getPriorityText(showDetailsModal.priority)}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("complaints.dateSubmitted")}</p>
                  <p className="font-medium">{formatDate(showDetailsModal.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("complaints.relatedOrder")}</p>
                  <p className="font-medium">
                    {showDetailsModal.relatedOrderId ? `#${showDetailsModal.relatedOrderId}` : t("common.none")}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">{t("complaints.description")}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{showDetailsModal.description}</p>
                </div>
              </div>

              {showDetailsModal.adminNotes && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">{t("complaints.adminResponse")}</p>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <p className="text-blue-800 whitespace-pre-wrap">{showDetailsModal.adminNotes}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 