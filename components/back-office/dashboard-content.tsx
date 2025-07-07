"use client"

import { useState, useEffect } from "react"
import { ClientsChart } from "@/components/back-office/clients-chart"
import { StatCard } from "@/components/back-office/stat-card"
import { useLanguage } from "@/components/language-context"
import { ChevronRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/src/types'

export function DashboardContent() {
  const { t } = useLanguage()
  const { toast } = useToast()
  
  // États pour les données
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContracts: '0',
    monthlyRevenue: '0'
  })

  // Charger les données du dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Charger les utilisateurs récents
      const users = await apiClient.get<User[]>('/utilisateurs/all')
      const sortedUsers = Array.isArray(users) ? 
        users.slice(0, 5) : [] // Prendre les 5 derniers
      
      setRecentUsers(sortedUsers)
      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalContracts: `${Math.floor(Math.random() * 100)}K`, // TODO: API réelle
        monthlyRevenue: `€ ${Math.floor(Math.random() * 100)}K` // TODO: API réelle
      })
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: getErrorMessage(error)
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Fonction pour déterminer le type de compte
  const getAccountType = (user: User): string => {
    if (user.admin) return t("admin.administrator")
    if (user.livreur) return t("admin.deliveryMan")
    if (user.prestataire) return t("admin.serviceProvider")
    if (user.commercant) return t("admin.shopkeeper")
    if (user.client) return t("admin.client")
    return t("admin.user")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement du dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>    
        
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-lg font-medium text-gray-900">{t("admin.recentUsers")}</h2>
          <Link
            href="/admin/users"
            className="flex items-center text-sm font-medium text-green-600 hover:text-green-500"
          >
            {t("admin.viewAll")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("admin.userFirstName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("admin.userName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("admin.address")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("admin.accountType")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("admin.dateCreated")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentUsers.length > 0 ? recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {user.firstName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.lastName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.address ? `${user.address}, ${user.city}` : user.city}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {getAccountType(user)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun utilisateur récent
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title={t("admin.totalUsers")} 
          value={stats.totalUsers.toString()} 
          change={`+${Math.floor(Math.random() * 10)} ce mois`} 
          positive={true} 
        />
        <StatCard 
          title={t("admin.numberContracts")} 
          value={stats.totalContracts} 
          change="+9.7% ce mois" 
          positive={true} 
        />
        <StatCard 
          title={t("admin.monthlyRevenue")} 
          value={stats.monthlyRevenue} 
          change="+5.4% vs mois dernier" 
          positive={true} 
        />
      </div>
    </div>
  )
}

