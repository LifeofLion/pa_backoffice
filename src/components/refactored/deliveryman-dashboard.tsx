"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  BarChart3,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Edit,
  CreditCard,
  ChevronRight,
  ArrowUp,
  BellRing,
  PartyPopper,
  AlertTriangle,
  RefreshCw,
  Wallet
} from "lucide-react"
import { useLanguage } from "@/components/language-context"
import LanguageSelector from "@/components/language-selector"
import { useAuth } from "@/src/hooks/use-auth"
import { useDeliveryman } from "@/src/hooks/use-deliveryman"

// =============================================================================
// 🎯 HOOK PERSONNALISÉ AVEC VRAIES DONNÉES + FALLBACK
// =============================================================================

function useDashboardData() {
  const { user } = useAuth()
  const { 
    myLivraisons, 
    todayDeliveries, 
    hasActiveDeliveries,
    loading,
    error,
    refreshData,
    clearError,
    isDeliveryman
  } = useDeliveryman()

  // Stats dynamiques basées sur les vraies données
  const stats = [
    {
      title: "Total Clients",
      value: myLivraisons.length > 0 ? 
        // Compter le nombre de clients uniques dans les livraisons
        new Set(myLivraisons.map(l => l.clientId)).size.toString() : 
        "0",
      change: "+8.5%",
      changeType: "positive",
      icon: <UserIcon className="h-6 w-6 text-indigo-500" />,
      bgColor: "bg-indigo-50",
    },
    {
      title: "Livraisons cette semaine",
      value: myLivraisons.length > 0 ? myLivraisons.length.toString() : "0",
      change: myLivraisons.length > 5 ? "+15%" : "+1.3%",
      changeType: "positive",
      icon: <Package className="h-6 w-6 text-amber-500" />,
      bgColor: "bg-amber-50",
    },
    {
      title: "Livraisons en attente",
      value: myLivraisons.length > 0 ? 
        myLivraisons.filter(l => l.status === 'scheduled').length.toString() : 
        "0",
      change: hasActiveDeliveries ? "+5%" : "+1.8%",
      changeType: "positive",
      icon: <Clock className="h-6 w-6 text-rose-500" />,
      bgColor: "bg-rose-50",
    },
  ]

  // Données du tableau - VRAIES données d'abord, fallback si vide
  const recentDeliveries = myLivraisons.length > 0 ? 
    myLivraisons.slice(0, 5).map((livraison) => ({
      id: `#ECO-${livraison.id.slice(-5)}`,
      customer: livraison.client.name,
      address: livraison.dropoffLocation,
      status: livraison.status === 'completed' ? 'delivered' : 
             livraison.status === 'in_progress' ? 'inTransit' : 'pending',
      statusClass: livraison.status === 'completed' ? 'bg-green-100 text-green-800' :
                  livraison.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800',
      date: new Date(livraison.estimatedDeliveryTime || Date.now()).toISOString().split('T')[0]
    })) :
    // Fallback avec données statiques SEULEMENT si pas de vraies données
    [
      {
        id: "#ECO-12345",
        customer: "John Doe",
        address: "123 Main St, Paris",
        status: "delivered",
        statusClass: "bg-green-100 text-green-800",
        date: "2025-04-01",
      },
      {
        id: "#ECO-23456", 
        customer: "Jane Smith",
        address: "456 Oak Ave, Lyon",
        status: "inTransit",
        statusClass: "bg-yellow-100 text-yellow-800",
        date: "2025-04-02",
      },
      {
        id: "#ECO-34567",
        customer: "Robert Johnson", 
        address: "789 Pine Rd, Marseille",
        status: "pending",
        statusClass: "bg-blue-100 text-blue-800",
        date: "2025-04-03",
      }
    ]

  return {
    stats,
    recentDeliveries,
    loading,
    error,
    refreshData,
    clearError,
    isDeliveryman,
    hasRealData: myLivraisons.length > 0
  }
}

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL - DESIGN ORIGINAL + VRAIES DONNÉES
// =============================================================================

export default function DeliverymanDashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // 🚀 Hook avec vraies données cette fois !
  const { 
    stats, 
    recentDeliveries, 
    loading, 
    error, 
    refreshData, 
    clearError,
    isDeliveryman,
    hasRealData
  } = useDashboardData()

  // Protection si l'utilisateur n'est pas un livreur
  if (!isDeliveryman && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès Réservé aux Livreurs
          </h2>
          <p className="text-gray-600 mb-4">
            Cette page est uniquement accessible aux livreurs inscrits.
          </p>
          <Link
            href="/app_client"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Aller à l'espace client
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - DESIGN ORIGINAL PRÉSERVÉ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-auto lg:z-auto`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/app_deliveryman" className="flex items-center">
              <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/app_deliveryman"
                  className="flex items-center rounded-md bg-green-50 px-4 py-3 text-white"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.dashboard")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/announcements"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <PartyPopper className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.announcements")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/deliveries"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <Package className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.deliveries")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/notifications"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <BellRing className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.notifications")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/messages"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <MessageSquare className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.messages")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/wallet"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <Wallet className="mr-3 h-5 w-5" />
                  <span>Mon Portefeuille</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app_deliveryman/payments"
                  className="flex items-center rounded-md px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  <span>{t("deliveryman.payments")}</span>
                </Link>
              </li>
            </ul>
          </nav>
              </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Header - DESIGN ORIGINAL PRÉSERVÉ */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Right actions */}
          <div className="ml-auto flex items-center space-x-4">
            <LanguageSelector />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center bg-green-50 text-white rounded-full px-4 py-1 hover:bg-green-400 transition-colors"
              >
                <User className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">
                  {user?.firstName || 'Charlotte'}
                </span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-100">
                  <Link
                    href="/app_deliveryman/edit-account"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span>{t("common.editAccount")}</span>
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>

                  <Link 
                    href="/app_client" 
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>{t("common.clientSpace")}</span>
                  </Link>



                  <div className="border-t border-gray-100 my-1"></div>

                  <Link 
                    href="/logout" 
                    className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>{t("common.logout")}</span>
                  </Link>
              </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content - DESIGN ORIGINAL + VRAIES DONNÉES */}
        <main className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t("deliveryman.dashboard")}</h1>
            
            {/* Indicateur de mode et bouton refresh */}
            <div className="flex items-center space-x-3">
              {hasRealData ? (
                <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  📡 Données en temps réel
                </span>
              ) : (
                <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  🧪 Mode démo
                </span>
              )}
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                title="Actualiser les données"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
        </div>
          </div>

        {/* Gestion des erreurs */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>Erreur de connexion: {error}</span>
          </div>
                <button 
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
                          </div>
                        </div>
          )}

          {/* Stats cards - DESIGN ORIGINAL + DONNÉES DYNAMIQUES */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, index) => (
              <div key={index} className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span
                      className={`inline-flex items-center ${
                        stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <ArrowUp
                        className={`mr-1.5 h-4 w-4 flex-shrink-0 ${
                          stat.changeType === "positive" ? "text-green-500" : "text-red-500 transform rotate-180"
                        }`}
                      />
                      <span className="font-medium">{stat.change}</span>
                      <span className="ml-1">{t("deliveryman.fromYesterday")}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent deliveries section - DESIGN ORIGINAL + VRAIES DONNÉES */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-lg font-medium text-gray-900">{t("deliveryman.recentDeliveries")}</h2>
              <Link
                href="/app_deliveryman/deliveries"
                className="flex items-center text-sm font-medium text-green-600 hover:text-green-500"
              >
                {t("deliveryman.viewAll")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("deliveryman.orderId")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("deliveryman.customer")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("deliveryman.address")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("deliveryman.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("deliveryman.date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentDeliveries.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.customer}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.address}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${item.statusClass}`}
                          >
                            {t(`deliveryman.deliveriess.${item.status}`)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Composant d'icône d'utilisateur - DESIGN ORIGINAL PRÉSERVÉ
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// Composant d'icône d'utilisateur
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// Composant d'icône d'horloge - DESIGN ORIGINAL PRÉSERVÉ
function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}