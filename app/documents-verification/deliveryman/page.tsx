"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-context"
import Link from "next/link"
import { Upload } from "lucide-react"
import { useAuth } from '@/src/hooks/use-auth'
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { API_ROUTES } from '@/src/lib/api-routes'

export default function DeliverymanDocumentsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    idCard: null as File | null,
    drivingLicence: null as File | null,
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "idCard" | "drivingLicence") => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const areAllFieldsFilled = (): boolean => {
    return Object.values(formData).every((value) => value !== null)
  }

  const uploadDocument = async (file: File, documentType: string) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté')
    }

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('utilisateur_id', user.id.toString())
    uploadFormData.append('document_type', documentType)
    uploadFormData.append('account_type', 'livreur')

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
      setError("Vous devez être connecté pour uploader des documents")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload ID Card
      if (formData.idCard) {
        console.log('📤 Uploading ID Card...')
        await uploadDocument(formData.idCard, 'idCard')
      }

      // Upload Driving Licence
      if (formData.drivingLicence) {
        console.log('📤 Uploading Driving Licence...')
        await uploadDocument(formData.drivingLicence, 'drivingLicence')
      }

      console.log('✅ Documents uploaded successfully!')
      
      // Rediriger vers la page de pending-validation
      router.push("/documents-verification/pending-validation/deliveryman")
    } catch (err) {
      console.error("❌ Error uploading documents:", err)
      const errorMessage = getErrorMessage(err)
      setError(`Erreur lors de l'upload des documents: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-center text-green-500 mb-6">
          {t("deliveryman.uploadIdAndLicence")}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Carte d'identité */}
          <div>
            <label htmlFor="idCard" className="block text-gray-700 mb-2">
              {t("deliveryman.idCard")}
            </label>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="idCard"
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100"
              >
                <Upload className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-500">
                  {formData.idCard ? formData.idCard.name : t("deliveryman.uploadIdCard")}
                </span>
              </label>
              <input
                id="idCard"
                name="idCard"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "idCard")}
                className="hidden"
              />
            </div>
          </div>

          {/* Permis de conduire */}
          <div>
            <label htmlFor="drivingLicence" className="block text-gray-700 mb-2">
              {t("deliveryman.drivingLicence")}
            </label>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="drivingLicence"
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100"
              >
                <Upload className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-500">
                  {formData.drivingLicence ? formData.drivingLicence.name : t("deliveryman.uploadDrivingLicence")}
                </span>
              </label>
              <input
                id="drivingLicence"
                name="drivingLicence"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "drivingLicence")}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-md text-white ${
              isSubmitting ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isSubmitting ? t("auth.submitting") : t("common.submit")}
          </button>
        </form>
      </div>
    </div>
  )
}