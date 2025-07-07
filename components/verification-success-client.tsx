"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/components/language-context"

export default function VerificationSuccessClient() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    sessionStorage.removeItem("signupInfo")

    const timer = setTimeout(() => {
      router.push("/app_client")
    }, 1500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-auto text-center">
        <div className="mb-8">
          <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto mx-auto" />
        </div>

        <div className="flex justify-center mb-6">
          <CheckCircle className="h-20 w-20 text-green-50" />
        </div>

        <h1 className="text-2xl font-semibold mb-4">{t("auth.emailVerifiedSuccessfully")}</h1>

        <p className="text-gray-600 mb-8">{t("auth.accountNowActive")}</p>

        <p className="text-gray-500 mb-8">{t("auth.redirectedToHomepage")}</p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-green-50 text-white rounded-md hover:bg-green-400 transition-colors"
        >
          {t("auth.goToHomepage")}
        </Link>
      </div>
    </div>
  )
}

