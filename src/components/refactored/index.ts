// =============================================================================
// EXPORTS COMPOSANTS REFACTORISÉS
// =============================================================================

// Auth components
export * from './auth'
export { default as LoginRefactored } from './auth/login'
export { default as LogoutRefactored } from './auth/logout'
export { default as EditAccountRefactored } from './auth/edit-account'

// Client components
export { default as AppClient } from './app-client'
export { default as ComplaintClient } from './complaint-client'
export { default as CreateComplaintClient } from './create-complaint-client'
export { default as ServiceDetailClient } from './service-detail-client'
export { default as Home } from './home'

// Deliveryman components  
export { default as DeliverymanDashboard } from './deliveryman-dashboard'

// Messages components - MAINTENANT UNIFIÉS
// Tous les composants messages utilisent maintenant UnifiedMessages depuis @/src/components/messaging

// TODO: Ajouter d'autres composants refactorisés au fur et à mesure
// export { default as ServiceProviderDashboardRefactored } from './service-provider-dashboard-refactored'
// export { default as ShopkeeperDashboardRefactored } from './shopkeeper-dashboard-refactored'
// export { default as BackOfficeDashboardRefactored } from './back-office-dashboard-refactored' 