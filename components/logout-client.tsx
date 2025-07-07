"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/components/language-context"

export default function LogoutClient() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const logout = async () => {
      try {
        if (sessionStorage.getItem("authToken")) {
          sessionStorage.removeItem("authToken")
        } else {
          localStorage.removeItem("authToken")
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))

        router.push("/")
      } catch (error) {
        console.error("Logout error:", error)
        router.push("/")
      }
    }

    logout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md text-center">
        <h1 className="text-2xl font-semibold mb-4">{t("auth.loggingOut")}</h1>
        <p className="text-gray-600">{t("auth.pleaseWaitLogout")}</p>

        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
        </div>
      </div>
    </div>
  )
}

