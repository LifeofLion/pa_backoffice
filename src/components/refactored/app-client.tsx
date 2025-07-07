'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Star } from 'lucide-react'
import { Cantata_One as Sansita_One } from 'next/font/google'
import { useLanguage } from '@/components/language-context'
import OnboardingOverlay from '@/components/onboarding-overlay'
import { ClientLayout } from '@/src/components/layouts'
import { useAuth } from '@/src/hooks/use-auth'

// =============================================================================
// CONFIGURATION DES FONTS
// =============================================================================

const sansitaOne = Sansita_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

// =============================================================================
// COMPOSANT CLIENT REFACTORISÉ
// =============================================================================

export default function AppClient() {
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Gestion de l'onboarding
  useEffect(() => {
    if (isAuthenticated) {
      const hasCompletedOnboarding = localStorage.getItem('ecodeli-onboarding-completed')
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [isAuthenticated])

  // Services featured (à terme, ces données viendront de l'API)
  const services = [
    {
      id: 1,
      title: t('services.babySitter'),
      image: '/baby-sitter.jpg',
      description: t('services.babySitterDesc'),
      price: '£17/hour',
      rating: 5,
    },
    {
      id: 2,
      title: t('services.dogSitter'),
      image: '/dog-sitter.jpg',
      description: t('services.dogSitterDesc'),
      price: '£20/hour',
      rating: 5,
    },
    {
      id: 3,
      title: t('services.airportRide'),
      image: '/airport-ride.jpg',
      description: t('services.airportRideDesc'),
      price: '£30 + £2/km',
      rating: 5,
    },
  ]

  // Si l'utilisateur n'est pas connecté, rediriger vers login
  if (!isAuthenticated) {
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
    <ClientLayout activeRoute="dashboard">
      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingOverlay
          onComplete={() => {
            localStorage.setItem('ecodeli-onboarding-completed', 'true')
            setShowOnboarding(false)
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Title */}
        <h1
          className={`text-2xl sm:text-3xl text-center text-green-600 mb-8 ${sansitaOne.className}`}
        >
          {t('app_client.welcome')}
        </h1>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder={t('app_client.searchServices')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Featured Services */}
        <h2
          className={`text-xl sm:text-2xl text-center text-green-600 mb-8 ${sansitaOne.className}`}
        >
          {t('app_client.featuredServices')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8">
          {services
            .filter((service) =>
              searchQuery === '' ||
              service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              service.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 sm:h-64 relative">
                  <Image
                    src={service.image || '/placeholder.svg'}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold">
                      {service.title}
                    </h3>
                    <div className="flex">
                      {[...Array(service.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-current text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="bg-green-100 text-green-600 rounded-full px-4 py-1 font-semibold">
                      {service.price}
                    </div>

                    <Link
                      href={`/app_client/service/${service.id}`}
                      className="bg-green-600 text-white rounded-full px-6 py-2 hover:bg-green-700 transition-colors"
                    >
                      {t('app_client.details')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* No results message */}
        {searchQuery && services.filter((service) =>
          service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {t('app_client.noServicesFound')}
            </p>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 