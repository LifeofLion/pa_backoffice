"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-context"
import Link from "next/link"
import { useAuth } from '@/src/hooks/use-auth'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { API_ROUTES } from '@/src/lib/api-routes'

export default function ShopkeeperDocumentsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    siret: "",
    siren: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const areAllFieldsFilled = (): boolean => {
    return Object.values(formData).every((value) => value.trim() !== "")
  }

  const createDocumentJustification = async (documentType: string, content: string) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté')
    }

    // Créer un fichier texte virtuel avec les informations
    const textContent = `${documentType}: ${content}\nUtilisateur: ${user.first_name} ${user.last_name}\nDate: ${new Date().toISOString()}`
    const blob = new Blob([textContent], { type: 'text/plain' })
    const file = new File([blob], `${documentType}_${user.id}.txt`, { type: 'text/plain' })

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('utilisateur_id', user.id.toString())
    uploadFormData.append('document_type', documentType)
    uploadFormData.append('account_type', 'commercant')

    return await apiClient.uploadFile(API_ROUTES.JUSTIFICATION.CREATE, uploadFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!areAllFieldsFilled()) {
      setError(t("auth.allFieldsRequired"))
      return
    }

    if (!user?.id) {
      setError("Vous devez être connecté pour soumettre vos informations")
      return
    }

    setIsSubmitting(true)

    try {
      // Créer les justifications pour SIRET et SIREN
      console.log('📤 Uploading SIRET...')
      await createDocumentJustification('siret', formData.siret)

      console.log('📤 Uploading SIREN...')
      await createDocumentJustification('siren', formData.siren)

      console.log('✅ Business documents uploaded successfully!')

      // Rediriger vers la page de pending validation pour les commerçants
      router.push("/documents-verification/pending-validation/shopkeeper")
    } catch (err) {
      console.error("❌ Error submitting documents:", err)
      const errorMessage = getErrorMessage(err)
      setError(`Erreur lors de l'envoi des informations: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-center text-green-50 mb-6">
            {t("shopkeeper.enterSiretAndSiren")}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SIRET */}
            <div>
              <label htmlFor="siret" className="block text-gray-700 mb-2">
                {t("shopkeeper.siretNumber")}
              </label>
              <input
                id="siret"
                name="siret"
                type="text"
                value={formData.siret}
                onChange={handleChange}
                placeholder={t("shopkeeper.enterSiretNumber")}
                className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* SIREN */}
            <div>
              <label htmlFor="siren" className="block text-gray-700 mb-2">
                {t("shopkeeper.sirenNumber")}
              </label>
              <input
                id="siren"
                name="siren"
                type="text"
                value={formData.siren}
                onChange={handleChange}
                placeholder={t("shopkeeper.enterSirenNumber")}
                className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-md text-white ${
                isSubmitting ? "bg-gray-300 cursor-not-allowed" : "bg-green-50 hover:bg-green-500"
              }`}
            >
              {isSubmitting ? t("auth.submitting") : t("common.submit")}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}