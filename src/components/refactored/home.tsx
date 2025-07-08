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
            Welcome to EcoDeli - Eco-friendly delivery service
          </h1>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-8 sm:py-16 px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Cool things</h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12">Things to know about our platform</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Fast deliveries</h3>
              <p className="text-gray-600">Get your packages delivered quickly and efficiently</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-500">
                  <path d="M8 3V7M16 3V7M3 10H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Easy interface</h3>
              <p className="text-gray-600">Simple and intuitive platform for all your needs</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-500">
                  <path d="M12 15V17M12 7V13M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">New feature</h3>
              <p className="text-gray-600">Always innovating to serve you better</p>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="container mx-auto py-8 sm:py-16 px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Stay tuned</h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12">Subscribe to our newsletter</p>

          <div className="max-w-md mx-auto">
            <form className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-gray-600 mb-1">Email address</label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-50 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
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