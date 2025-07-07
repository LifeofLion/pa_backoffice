"use client"

import { useState, useEffect } from "react"
import { ContractsTable } from "@/components/back-office/contracts-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/language-context"
import { apiClient, getErrorMessage } from '@/src/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function FinanceContent() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState("March")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [usersContractsData, setUsersContractsData] = useState<any[]>([])
  const [shopkeepersContractsData, setShopkeepersContractsData] = useState<any[]>([])

  // Charger les données de financement
  const loadFinanceData = async () => {
    try {
      // Pour l'instant, on simule avec des données statiques car l'API spécifique n'est pas définie
      // TODO: Remplacer par les vraies routes API quand elles seront disponibles
      
      const mockUsersContracts = [
        {
          id: 1,
          client: "Killian",
          contract: "Premium",
          price: "€19.99",
        },
      ]

      const mockShopkeepersContracts = [
        {
          id: 1,
          client: "Killian",
          contract: "Ultimate",
          price: "€89.99",
        },
      ]

      setUsersContractsData(mockUsersContracts)
      setShopkeepersContractsData(mockShopkeepersContracts)
    } catch (error) {
      console.error('Error loading finance data:', error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: getErrorMessage(error)
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFinanceData()
  }

  useEffect(() => {
    loadFinanceData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données financières...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.finance")}</h1>
          <p className="text-gray-600">Gestion financière et contrats</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="January">January</SelectItem>
              <SelectItem value="February">February</SelectItem>
              <SelectItem value="March">March</SelectItem>
              <SelectItem value="April">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
              <SelectItem value="June">June</SelectItem>
              <SelectItem value="July">July</SelectItem>
              <SelectItem value="August">August</SelectItem>
              <SelectItem value="September">September</SelectItem>
              <SelectItem value="October">October</SelectItem>
              <SelectItem value="November">November</SelectItem>
              <SelectItem value="December">December</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("admin.usersContracts")}</h2>
          <ContractsTable data={usersContractsData} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">{t("admin.shopkeepersContracts")}</h2>
          <ContractsTable data={shopkeepersContractsData} />
        </div>
      </div>
    </div>
  )
}

