'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, MapPin, Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-context'
import { DeliverymanLayout } from '@/src/components/layouts'
import { useAuth } from '@/src/hooks/use-auth'

// =============================================================================
// TYPES
// =============================================================================

interface Delivery {
  id: number
  orderId: string
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  pickupAddress: string
  deliveryAddress: string
  distance: number
  estimatedTime: number
  payment: number
  createdAt: string
  scheduledAt?: string
  customer: {
    name: string
    phone: string
  }
  items: {
    name: string
    quantity: number
    weight: number
  }[]
}

// =============================================================================
// COMPOSANT DELIVERYMAN DASHBOARD REFACTORISÉ
// =============================================================================

export default function DeliverymanDashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Statistiques du tableau de bord
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0,
  })

  // Charger les livraisons
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // À remplacer par l'appel API réel
        // const response = await apiClient.get<Delivery[]>('/deliveries/deliveryman')
        // setDeliveries(response)
        
        // Données simulées pour l'instant
        const mockDeliveries: Delivery[] = [
          {
            id: 1,
            orderId: 'ORD-2024-001',
            status: 'pending',
            priority: 'high',
            pickupAddress: '123 Rue de la Paix, Paris',
            deliveryAddress: '456 Avenue des Champs, Paris',
            distance: 5.2,
            estimatedTime: 25,
            payment: 12.50,
            createdAt: new Date().toISOString(),
            customer: {
              name: 'Marie Dubois',
              phone: '+33 1 23 45 67 89'
            },
            items: [
              { name: 'Produits frais', quantity: 2, weight: 1.5 }
            ]
          },
          {
            id: 2,
            orderId: 'ORD-2024-002',
            status: 'accepted',
            priority: 'medium',
            pickupAddress: '789 Boulevard Saint-Germain, Paris',
            deliveryAddress: '321 Rue de Rivoli, Paris',
            distance: 3.8,
            estimatedTime: 18,
            payment: 9.00,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            customer: {
              name: 'Jean Martin',
              phone: '+33 1 98 76 54 32'
            },
            items: [
              { name: 'Épicerie', quantity: 1, weight: 2.0 }
            ]
          }
        ]
        
        setDeliveries(mockDeliveries)
        
        // Calculer les statistiques
        const totalDeliveries = mockDeliveries.length
        const pendingDeliveries = mockDeliveries.filter(d => d.status === 'pending').length
        const completedToday = mockDeliveries.filter(d => 
          d.status === 'delivered' && 
          new Date(d.createdAt).toDateString() === new Date().toDateString()
        ).length
        const totalEarnings = mockDeliveries
          .filter(d => d.status === 'delivered')
          .reduce((sum, d) => sum + d.payment, 0)
        
        setStats({
          totalDeliveries,
          pendingDeliveries,
          completedToday,
          totalEarnings
        })
        
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des livraisons')
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'delivery_man') {
      fetchDeliveries()
    }
  }, [user])

  // Si l'utilisateur n'est pas un livreur
  if (!user || user.role !== 'delivery_man') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('common.accessDenied')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('deliveryman.accessDeniedMessage')}
          </p>
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

  // Filtrer les livraisons par statut
  const filteredDeliveries = deliveries.filter((delivery: Delivery) => 
    selectedStatus === 'all' || delivery.status === selectedStatus
  )

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-blue-100 text-blue-800'
      case 'in_transit':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'in_transit':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <DeliverymanLayout activeRoute="dashboard">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('deliveryman.dashboard')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('deliveryman.welcomeMessage')}
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('deliveryman.totalDeliveries')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('deliveryman.pendingDeliveries')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('deliveryman.completedToday')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('deliveryman.totalEarnings')}</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'accepted', 'in_transit', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`deliveryman.status.${status}`)}
              </button>
            ))}
          </div>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Gestion des erreurs */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {t('common.errorOccurred')}: {error}
          </div>
        )}

        {/* Liste des livraisons */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedStatus === 'all' 
                    ? t('deliveryman.noDeliveries')
                    : t('deliveryman.noDeliveriesWithStatus')
                  }
                </h3>
                <p className="text-gray-600">
                  {t('deliveryman.checkBackLater')}
                </p>
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {delivery.orderId}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          {t(`deliveryman.status.${delivery.status}`)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delivery.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          delivery.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          delivery.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {t(`deliveryman.priority.${delivery.priority}`)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {t('deliveryman.pickup')}
                            </p>
                            <p className="text-sm text-gray-600">{delivery.pickupAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {t('deliveryman.delivery')}
                            </p>
                            <p className="text-sm text-gray-600">{delivery.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          {delivery.distance} km
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {delivery.estimatedTime} min
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          €{delivery.payment.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/app_deliveryman/delivery/${delivery.id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        {t('deliveryman.viewDetails')}
                      </Link>
                      
                      {delivery.status === 'pending' && (
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={() => {
                            // Logique pour accepter la livraison
                            console.log('Accepter la livraison:', delivery.id)
                          }}
                        >
                          {t('deliveryman.acceptDelivery')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DeliverymanLayout>
  )
} 