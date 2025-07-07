'use client'

import { ReactNode, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Edit,
  CreditCard,
  Users,
  User,
  Settings,
  HelpCircle,
  Tag,
  CheckSquare,
  Languages,
} from 'lucide-react'
import LanguageSelector from '@/components/language-selector'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/src/hooks/use-auth'

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface BackOfficeLayoutProps {
  children: ReactNode
  activeRoute?: string
}

interface NavigationItem {
  href: string
  label: string
  key: string
  icon: React.ComponentType<{ className?: string }>
}

// =============================================================================
// COMPOSANT LAYOUT BACK-OFFICE
// =============================================================================

export default function BackOfficeLayout({ children, activeRoute }: BackOfficeLayoutProps) {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Navigation items pour le back-office
  const navigationItems: NavigationItem[] = [
    {
      href: '/admin',
      label: t('admin.dashboard'),
      key: 'dashboard',
      icon: BarChart3
    },
    {
      href: '/admin/users',
      label: t('admin.users'),
      key: 'users',
      icon: Users
    },
    {
      href: '/admin/services',
      label: t('admin.services'),
      key: 'services',
      icon: Tag
    },
    {
      href: '/admin/complaints',
      label: t('admin.complaints'),
      key: 'complaints',
      icon: HelpCircle
    },
    {
      href: '/admin/finance',
      label: t('admin.finance'),
      key: 'finance',
      icon: CreditCard
    },
    {
      href: '/admin/validations',
      label: t('admin.validations'),
      key: 'validations',
      icon: CheckSquare
    },
    {
      href: '/admin/translations',
      label: t('admin.translations'),
      key: 'translations',
      icon: Languages
    }
  ]

  // Fonction pour déterminer si un lien est actif
  const isActiveLink = (itemKey: string) => {
    return activeRoute === itemKey
  }

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-auto lg:z-auto`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin" className="flex items-center">
              <Image src="/logo.png" alt="EcoDeli Admin" width={120} height={40} className="h-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={`flex items-center rounded-md px-4 py-3 transition-colors ${
                        isActiveLink(item.key)
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="mr-3 h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Title */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">
              EcoDeli - Administration
            </h1>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center space-x-4">
            <LanguageSelector />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center bg-green-50 text-green-700 rounded-full px-4 py-1 hover:bg-green-100 transition-colors"
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
                    href="/admin/edit-account"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>{t('common.profile')}</span>
                  </Link>

                  <Link
                    href="/admin/edit-account"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>{t('common.settings')}</span>
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
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 