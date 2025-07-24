// =============================================================================
// EXPORTS DES HOOKS PA-BACKOFFICE
// =============================================================================

// Hooks d'authentification
export {
	useAuth,
	useRequireAuth,
	useRequireRole,
	useRedirectIfAuthenticated,
	useCanAccess,
} from './use-auth';

// Hooks administrateur
export { useAdmin, useAdminPermissions } from '../src/hooks/use-admin';

// Hooks d'annonces
export { useAnnouncements } from './use-announcements';

// Hooks de messagerie
export { useMessaging } from './use-messaging';

// Hooks de livreur
export { useDeliveryman } from './use-deliveryman';

// Hooks de tracking
export { useTracking } from './use-tracking';

// Hooks de services
export { useServices } from './use-services';

// Hooks d'interface utilisateur
export { useToast } from './use-toast';
export { useIsMobile, useMediaQuery } from './use-mobile';

// Hooks API génériques
export { useApi, useGet, usePost, usePut, useDelete } from './useApi';

// ✅ NOUVEAUX HOOKS POUR LES ENDPOINTS ADMIN
export { useContracts } from './use-contracts';
export { useSubscriptions } from './use-subscriptions';
export { useWarehouses } from './use-warehouses';

// Types et interfaces communs
export type {
	// Types de contrats
	ContractData,
	ContractsStats,
} from './use-contracts';

export type {
	SubscriptionData as ClientSubscriptionData,
	SubscriptionsStats as ClientSubscriptionsStats,
} from './use-subscriptions';
