"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Upload, X } from "lucide-react"
import { useLanguage } from "@/components/language-context"
import { useAuth } from "@/src/hooks/use-auth"
import { ClientLayout } from "@/src/components/layouts"

// =============================================================================
// COMPOSANT CREATE COMPLAINT CLIENT REFACTORISÉ - ÉLIMINATION MASSIVE DE DUPLICATION
// =============================================================================

export default function CreateComplaintClient() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const [formData, setFormData] = useState({
    announce: "",
    shippingPrice: "",
    description: "",
  })

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to complaints page
      router.push("/app_client/complaint")
    } catch (error) {
      console.error("Error submitting complaint:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si l'utilisateur n'est pas connecté
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

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/app_client/complaint" className="text-green-500 hover:underline flex items-center">
            <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
            {t("navigation.backToComplaints")}
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">{t("complaints.submitNewComplaint")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="announce" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("complaints.announceId")}
                </label>
                <input
                  type="text"
                  id="announce"
                  name="announce"
                  value={formData.announce}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="shippingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("complaints.shippingPrice")}
                </label>
                <input
                  type="text"
                  id="shippingPrice"
                  name="shippingPrice"
                  value={formData.shippingPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("complaints.descriptionOfIssue")}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  placeholder={t("complaints.pleaseDescribeIssue")}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("complaints.supportingDocuments")}
                </label>
                <div
                  className={`border-2 border-dashed rounded-md p-6 ${
                    dragActive ? "border-green-500 bg-green-50 bg-opacity-10" : "border-gray-300"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">{t("complaints.dragAndDrop")}</p>
                    <p className="text-xs text-gray-500">{t("complaints.uploadInfo")}</p>
                    <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                    <button
                      type="button"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {t("complaints.selectFiles")}
                    </button>
                  </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t("complaints.selectedFiles")}:</h4>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                              <FileIcon extension={file.name.split(".").pop() || ""} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Link
                  href="/app_client/complaint"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-50 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? t("common.submitting") : t("complaints.submitComplaint")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// File icon component
function FileIcon({ extension }: { extension: string }) {
  // Determine icon based on file extension
  switch (extension.toLowerCase()) {
    case "pdf":
      return <div className="text-red-500 text-xs font-bold">PDF</div>
    case "doc":
    case "docx":
      return <div className="text-blue-500 text-xs font-bold">DOC</div>
    case "xls":
    case "xlsx":
      return <div className="text-green-500 text-xs font-bold">XLS</div>
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <div className="text-purple-500 text-xs font-bold">IMG</div>
    default:
      return <div className="text-gray-500 text-xs font-bold">FILE</div>
  }
}

