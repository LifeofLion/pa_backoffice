"use client"

import Image from "next/image"
import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/components/language-context"

export default function Home() {
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken")
    if (token) {
      // Si l'utilisateur est connecté, le rediriger vers l'app client
      router.push("/app_client")
    }
  }, [router])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="container mx-auto flex flex-col sm:flex-row justify-between items-center py-4 px-4 gap-4">
        <div className="flex items-center">
          <Link href="/">
            <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto" />
          </Link>
        </div>

        <div className="flex items-center ml-auto mr-4">
          <LanguageSelector />
        </div>

        <div className="flex gap-2">
          <Link
            href="/signin"
            className="px-4 py-2 rounded-md bg-green-100 text-green-500 hover:bg-green-200 transition-colors"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-green-50 text-white hover:bg-green-600 transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto text-center py-8 sm:py-16 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 max-w-2xl mx-auto">
            Welcome to EcoDeli's Backoffice
          </h1>
        </section>
      </main>

      <footer className="bg-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-6 md:mb-0">
              <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto mb-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-8 mt-6">
              <div>
                <Link href="/legal-notice">
                  <p className="text-sm font-bold mb-4">Legal Notice</p>
                </Link>
              </div>
              <div>
                <Link href="/app_client">
                  <p className="text-sm font-bold mb-4">Client Space</p>
                </Link>
              </div>
              <div>
                <Link href="/app_service-provider">
                  <p className="text-sm font-bold mb-4">Service Provider</p>
                </Link>
              </div>
              <div>
                <Link href="/app_shopkeeper">
                  <p className="text-sm font-bold mb-4">Shopkeeper</p>
                </Link>
              </div>
              <div>
                <Link href="/app_deliveryman">
                  <p className="text-sm font-bold mb-4">Delivery man</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 