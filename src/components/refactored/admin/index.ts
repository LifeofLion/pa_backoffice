// =============================================================================
// COMPOSANTS ADMIN REFACTORISÉS - INDEX
// =============================================================================

// Export des composants admin utilisant l'architecture /src
export { default as AdminDashboard } from './dashboard'
export { default as ComplaintsManagement } from './complaints-management'
export { default as UsersManagement } from './users-management'

// Types pour les composants admin
export interface AdminComponentProps {
  className?: string
}

// Mapping des routes admin vers leurs composants
export const ADMIN_COMPONENTS = {
  dashboard: 'AdminDashboard',
  complaints: 'ComplaintsManagement', 
  users: 'UsersManagement',
  // TODO: Ajouter les autres composants au fur et à mesure
  // finance: 'FinanceManagement',
  // services: 'ServicesManagement', 
  // translations: 'TranslationsManagement',
  // validations: 'ValidationsManagement'
} as const

export type AdminRoute = keyof typeof ADMIN_COMPONENTS 