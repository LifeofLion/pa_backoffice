"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, AlertCircle, Save } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useAuth } from "@/src/hooks/use-auth"
import { apiClient, getErrorMessage } from "@/src/lib/api"
import { ClientLayout } from "@/src/components/layouts"
import type { CreateComplaintRequest } from "@/src/types/validators"

// =============================================================================
// COMPOSANT CREATE COMPLAINT CLIENT REFACTORISÉ
// =============================================================================

export default function CreateComplaintClient() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    relatedOrderId: "",
  })

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Préparer les données pour l'API
      const complaintData: CreateComplaintRequest = {
        utilisateur_id: user.id,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        // related_order_id est optionnel - n'envoyer que si rempli
        ...(formData.relatedOrderId.trim() && { related_order_id: formData.relatedOrderId.trim() })
      }

      console.log('🚀 Création de réclamation:', complaintData)

      await apiClient.createComplaint(complaintData)

      console.log('✅ Réclamation créée avec succès')

      // Rediriger vers la liste des réclamations
      router.push("/app_client/complaint")
    } catch (error) {
      console.error('❌ Erreur lors de la création de la réclamation:', error)
      setError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
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
        {/* Navigation de retour */}
        <div className="mb-6">
          <Link 
            href="/app_client/complaint" 
            className="text-green-600 hover:text-green-800 flex items-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("navigation.backToComplaints")}
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            {t("complaints.submitNewComplaint")}
          </h1>

          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-red-700">
                  <p className="font-medium">{t("common.error")}</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sujet de la réclamation */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("complaints.subject")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t("complaints.subjectPlaceholder")}
                  required
                  maxLength={255}
                />
              </div>

              {/* Priorité */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("complaints.priority")}
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="low">{t("complaints.low")}</option>
                  <option value="medium">{t("complaints.medium")}</option>
                  <option value="high">{t("complaints.high")}</option>
                  <option value="urgent">{t("complaints.urgent")}</option>
                </select>
              </div>

              {/* Commande liée (optionnel) */}
              <div>
                <label htmlFor="relatedOrderId" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("complaints.relatedOrder")} <span className="text-gray-400 text-sm">({t("common.optional")})</span>
                </label>
                <input
                  type="text"
                  id="relatedOrderId"
                  name="relatedOrderId"
                  value={formData.relatedOrderId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={t("complaints.relatedOrderPlaceholder")}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t("complaints.relatedOrderHelp")}
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("complaints.description")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder={t("complaints.descriptionPlaceholder")}
                  required
                  minLength={10}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t("complaints.descriptionHelp")}
                </p>
              </div>

              {/* Note informative */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-700 text-sm">
                    <p className="font-medium mb-1">{t("complaints.infoTitle")}</p>
                    <p>{t("complaints.infoMessage")}</p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4">
                <Link
                  href="/app_client/complaint"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.subject.trim() || !formData.description.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t("common.submitting")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t("complaints.submitComplaint")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
} 