'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User, ChevronDown, Edit, LogOut, Menu, X } from 'lucide-react'
import LanguageSelector from '@/components/language-selector'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/src/hooks/use-auth'

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface ClientLayoutProps {
  children: ReactNode
  activeRoute?: string
}

interface NavigationItem {
  href: string
  label: string
  key: string
}

// =============================================================================
// COMPOSANT LAYOUT CLIENT
// =============================================================================

export default function ClientLayout({ children, activeRoute }: ClientLayoutProps) {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Navigation items pour les clients
  const navigationItems: NavigationItem[] = [
    {
      href: '/app_client',
      label: t('navigation.services'),
      key: 'services'
    },
    {
      href: '/app_client/announcements',
      label: t('navigation.myAnnouncements'),
      key: 'announcements'
    },
    {
      href: '/app_client/tracking',
      label: t('navigation.tracking'),
      key: 'tracking'
    },
    {
      href: '/app_client/payments', 
      label: t('navigation.myPayments'),
      key: 'payments'
    },
    {
      href: '/app_client/messages',
      label: t('navigation.messages'), 
      key: 'messages'
    },
    {
      href: '/app_client/complaint',
      label: t('navigation.makeComplaint'),
      key: 'complaint'
    }
  ]

  // Fermer le menu utilisateur quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fonction pour déterminer si un lien est actif
  const isActiveLink = (itemKey: string) => {
    return activeRoute === itemKey
  }

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logout()
      // Rediriger vers login après déconnexion réussie
      window.location.href = '/login'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, on force la redirection
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/app_client">
              <Image
                src="/logo.png"
                alt="EcoDeli Logo"
                width={120}
                height={40}
                className="h-auto"
              />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`text-gray-700 hover:text-green-500 transition-colors ${
                  isActiveLink(item.key) 
                    ? 'text-green-500 font-medium border-b-2 border-green-500' 
                    : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />

            {/* User Account Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center bg-green-50 text-white rounded-full px-4 py-1 hover:bg-green-400 transition-colors"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">
                  {user?.firstName || t('common.loading')}
                </span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-100">
                  <Link
                    href="/app_client/edit-account"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>{t('common.editAccount')}</span>
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>

                  <div className="px-4 py-1 text-xs text-gray-500">
                    {t('common.registerAs')}
                  </div>

                  <Link
                    href="/register/delivery-man"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    {t('common.deliveryMan')}
                  </Link>

                  <Link
                    href="/register/shopkeeper"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    {t('common.shopkeeper')}
                  </Link>

                  <Link
                    href="/register/service-provider"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    {t('common.serviceProvider')}
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2">
            <div className="container mx-auto px-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`block py-2 text-gray-700 hover:text-green-500 transition-colors ${
                    isActiveLink(item.key) ? 'text-green-500 font-medium' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
} 