// =============================================================================
// EXPORTS DES LAYOUTS ECODELI
// =============================================================================

export { default as ClientLayout } from './client-layout'
export { default as DeliverymanLayout } from './deliveryman-layout'
export { default as ServiceProviderLayout } from './service-provider-layout'
export { default as ShopkeeperLayout } from './shopkeeper-layout'
export { default as BackOfficeLayout } from './back-office-layout'

// =============================================================================
// TYPES ET UTILITIES
// =============================================================================

export interface LayoutProps {
  children: React.ReactNode
  activeRoute?: string
}

// Utilitaire pour déterminer quel layout utiliser selon le rôle
export function getLayoutByRole(role: string) {
  switch (role) {
    case 'client':
      return 'ClientLayout'
    case 'deliveryman':
      return 'DeliverymanLayout'
    case 'service_provider':
      return 'ServiceProviderLayout'
    case 'shopkeeper':
      return 'ShopkeeperLayout'
    case 'admin':
      return 'BackOfficeLayout'
    default:
      return 'ClientLayout'
  }
} 