// =============================================================================
// EXPORTS CENTRALISÉS - COMPOSANTS REFACTORISÉS
// =============================================================================

// Auth
export { default as EditAccount } from './auth/edit-account'

// Home
export { default as Home } from './home'

// Client
export { default as AppClient } from './app-client'
export { default as ClientPayments } from './client-payments'
export { default as ClientTracking } from './client-tracking'
export { default as ClientTrackingSearch } from './client-tracking-search'

// Complaints
export { default as ComplaintClient } from './complaint-client'
export { default as CreateComplaintClient } from './create-complaint-client'

// Services
export { default as ServiceDetailClient } from './service-detail-client'

// Deliveryman
export { default as DeliverymanDashboard } from './deliveryman-dashboard'
export { default as DeliverymanDeliveries } from './deliveryman-deliveries'
export { default as DeliverymanAnnouncements } from './deliveryman-announcements'
export { default as DeliverymanPayments } from './deliveryman-payments'
export { default as DeliverymanDeliveryDetail } from './deliveryman-delivery-detail'

// Messages
export { default as MessagesClient } from './messages-client'


// Messages components - MAINTENANT UNIFIÉS
// Tous les composants messages utilisent maintenant UnifiedMessages depuis @/src/components/messaging

// TODO: Ajouter d'autres composants refactorisés au fur et à mesure
// export { default as ServiceProviderDashboardRefactored } from './service-provider-dashboard-refactored'
// export { default as ShopkeeperDashboardRefactored } from './shopkeeper-dashboard-refactored'
// export { default as BackOfficeDashboardRefactored } from './back-office-dashboard-refactored' 