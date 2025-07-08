// =============================================================================
// TYPES ADMIN ENRICHIS - CONFORMES AU CAHIER DES CHARGES ECODELI
// =============================================================================

import type { UserData } from './validators'

// Types existants pour les utilisateurs
export interface AdminUserData {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  address: string | null
  city: string
  postalCode: string
  country: string
  state: 'open' | 'banned' | 'closed'
  roles: string[]
  createdAt: string
  lastLoginAt?: string
}

export interface AdminComplaintData {
  id: number
  client: string
  email: string
  announceId: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  userId: number
}

// =====================================================================
// NOUVEAUX TYPES SERVICES - CONFORMES AU CAHIER DES CHARGES
// =====================================================================

export interface AdminServiceData {
  id: number
  name: string
  description: string
  price: number
  prestataireId: number
  prestataireNme: string
  prestataireEmail: string
  prestataireRating: number | null
  serviceType: string
  serviceTypeId: number | null
  location: string
  startDate: string
  endDate: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  isActive: boolean
  duration: number | null
  createdAt: string
  updatedAt: string
}

export interface AdminServiceTypeData {
  id: number
  name: string
  description: string | null
  isActive: boolean
  serviceCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminPrestataireData {
  id: number
  firstName: string
  lastName: string
  email: string
  serviceType: string | null
  rating: number | null
  state: 'open' | 'closed' | 'pending'
  activeServicesCount: number
  monthlyRevenue: number
  isValidated: boolean
  createdAt: string
  lastActivity?: string
}

// Analytics conformes au cahier des charges page 8
export interface ServiceAnalyticsData {
  generalStats: {
    totalServices: number
    activeServices: number
    completedServices: number
    completionRate: string
  }
  topServices: Array<{
    name: string
    serviceTypeId: number
    demandCount: number
  }>
  servicesByType: Array<{
    typeName: string
    count: number
  }>
  revenueStats: {
    totalRevenue: number
    averagePrice: number
    minPrice: number
    maxPrice: number
  }
  topProviders: Array<{
    firstName: string
    lastName: string
    rating: number | null
    servicesCount: number
  }>
  generatedAt: string
}

// Calendrier prestataires (cahier des charges page 6)
export interface PrestataireCalendarData {
  prestataire: {
    id: number
    name: string
    serviceType: string | null
    rating: number | null
  }
  month: number
  year: number
  services: Array<{
    id: number
    name: string
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    status: string
    price: number
    duration: number | null
  }>
  availableSlots: Array<{
    date: string
    slots: Array<{
      start: string
      end: string
      available: boolean
    }>
  }>
}

// Facturation mensuelle (cahier des charges page 6)
export interface FacturationMensuelleData {
  facturationPeriod: {
    month: number
    year: number
    startDate: string
    endDate: string
  }
  facturesGenerated: number
  totalServices: number
  factures: Array<{
    prestataire: {
      id: number
      firstName: string
      lastName: string
      email: string
    }
    services: Array<{
      serviceId: number
      serviceName: string
      originalPrice: number
      commissionRate: number
      prestataireAmount: number
      serviceDate: string
    }>
    totalAmount: number
    serviceCount: number
    factureNumber: string
    generatedAt: string
    dueDate: string
  }>
}

export interface AdminDashboardStats {
  totalUsers: number
  totalComplaints: number
  totalServices: number
  totalDeliveries: number
  totalRevenue: number
  recentUsers: UserData[]
}

// Requêtes de validation
export interface ValidatePrestataireRequest {
  validationStatus: 'approved' | 'rejected' | 'pending'
  adminComments?: string
  verifiedQualifications?: string[]
}

export interface ValidateServiceRequest {
  validationStatus: 'approved' | 'rejected' | 'pending'
  adminComments?: string
}

// =====================================================================
// UTILITAIRES DE TRANSFORMATION
// =====================================================================

export class AdminUtils {
  static transformUser(user: any): AdminUserData {
    return {
      id: user.id,
      firstName: user.first_name || user.firstName,
      lastName: user.last_name || user.lastName,
      email: user.email,
      phoneNumber: user.phone_number || user.phoneNumber,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      state: user.state,
      roles: AdminUtils.extractUserRoles(user),
      createdAt: user.createdAt || user.created_at,
      lastLoginAt: user.lastLoginAt || user.last_login_at
    }
  }

  static transformService(service: any): AdminServiceData {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      prestataireId: service.prestataireId,
      prestataireNme: service.prestataireNme || service.prestataire_name || 'N/A',
      prestataireEmail: service.prestataireEmail || service.prestataire_email || 'N/A',
      prestataireRating: service.prestataireRating || service.prestataire_rating,
      serviceType: service.serviceType || 'Non défini',
      serviceTypeId: service.service_type_id || service.serviceTypeId,
      location: service.location,
      startDate: service.start_date || service.startDate,
      endDate: service.end_date || service.endDate,
      status: service.status,
      isActive: service.is_active !== undefined ? service.is_active : service.isActive,
      duration: service.duration,
      createdAt: service.createdAt || service.created_at,
      updatedAt: service.updatedAt || service.updated_at
    }
  }

  static transformPrestataire(prestataire: any): AdminPrestataireData {
    return {
      id: prestataire.id,
      firstName: prestataire.firstName || prestataire.user?.first_name,
      lastName: prestataire.lastName || prestataire.user?.last_name,
      email: prestataire.email || prestataire.user?.email,
      serviceType: prestataire.service_type || prestataire.serviceType,
      rating: prestataire.rating,
      state: prestataire.state || prestataire.user?.state || 'pending',
      activeServicesCount: prestataire.activeServicesCount || 0,
      monthlyRevenue: prestataire.monthlyRevenue || 0,
      isValidated: prestataire.user?.state === 'open',
      createdAt: prestataire.createdAt || prestataire.created_at,
      lastActivity: prestataire.lastActivity
    }
  }

  static extractUserRoles(user: any): string[] {
    const roles = []
    if (user.admin) roles.push('admin')
    if (user.client) roles.push('client')
    if (user.livreur) roles.push('livreur')
    if (user.prestataire) roles.push('prestataire')
    if (user.commercant) roles.push('commercant')
    return roles
  }

  static getUserRoleDisplay(user: any, t: (key: string) => string): string {
    if (user.admin) return t("admin.administrator")
    if (user.livreur) return t("admin.deliveryMan")
    if (user.prestataire) return t("admin.serviceProvider")
    if (user.commercant) return t("admin.shopkeeper")
    if (user.client) return t("admin.client")
    return t("admin.user")
  }

  static formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Date invalide'
      
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Erreur de format'
    }
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
  }

  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  static getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800', 
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }
} 