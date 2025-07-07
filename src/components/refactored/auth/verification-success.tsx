"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import LanguageSelector from "@/components/language-selector"

export default function VerificationSuccess() {
  const router = useRouter()

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

        <h1 className="text-2xl font-semibold mb-4">Email verified successfully!</h1>

        <p className="text-gray-600 mb-8">Your account is now active</p>

        <p className="text-gray-500 mb-8">You will be redirected to the homepage shortly...</p>

        <Link
          href="/app_client"
          className="inline-block px-6 py-3 bg-green-50 text-white rounded-md hover:bg-green-400 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
} 