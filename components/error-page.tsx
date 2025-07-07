"use client"

import { useLanguage } from "@/components/language-context"
import { useRouter } from "next/navigation"

interface ErrorPageProps {
  statusCode?: string | number
  title?: string
  description?: string
  showRetry?: boolean
  onRetry?: () => void
}

export default function ErrorPage({
  statusCode = "500",
  title,
  description,
  showRetry = false,
  onRetry,
}: ErrorPageProps) {
    const router = useRouter()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-24 text-black">{statusCode}</h1>

        <div className="mb-8">
          {/* Visage expressif */}
          <div className="relative inline-block">
            {/* Sourcils */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 flex justify-between">
              <svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20C30 0 60 10 70 20" stroke="#222" strokeWidth="8" strokeLinecap="round" />
              </svg>
              <svg width="80" height="30" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M70 20C50 0 20 10 10 20" stroke="#222" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Yeux */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="w-24 h-32 bg-white rounded-full border-4 border-black flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full relative left-2"></div>
              </div>
              <div className="w-24 h-32 bg-white rounded-full border-4 border-black flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full relative right-2"></div>
              </div>
            </div>

            {/* Bouche */}
            <div className="w-16 h-2 bg-black rounded-full mx-auto"></div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">{title || t("errors.somethingWentWrong")}</h2>

        <p className="text-gray-600 mb-8 max-w-md mx-auto">{description || t("errors.errorDescription")}</p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {showRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-green-50 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              {t("errors.tryAgain")}
            </button>
          )}

          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white text-green-500 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            {t("errors.goBack")}
          </button>
        </div>
      </div>
    </div>
  )
}