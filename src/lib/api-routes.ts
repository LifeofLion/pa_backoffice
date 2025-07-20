// =============================================================================
// SYSTÈME D'API ROUTES CENTRALISÉ - MAPPING BACKEND ADONISJS
// =============================================================================

import { UserRole } from '@/src/types';

/**
 * Configuration de base de l'API
 */
export const API_CONFIG = {
	BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
	TIMEOUT: 10000,
	RETRY_ATTEMPTS: 3,
} as const;

/**
 * Routes d'authentification
 */
export const AUTH_ROUTES = {
	LOGIN: '/auth/login',
	ME: '/auth/me',
	LOGOUT: '/auth/logout',
} as const;

/**
 * Routes utilisateurs
 */
export const USER_ROUTES = {
	ALL: '/utilisateurs/all',
	GET_RECENT: '/utilisateurs/get-recent',
	BY_ID: (id: string) => `/utilisateurs/${id}`,
	UPDATE: (id: string) => `/utilisateurs/${id}`,
	CHECK_PASSWORD: '/utilisateurs/check-password',
} as const;

/**
 * Routes clients
 */
export const CLIENT_ROUTES = {
	INDEX: '/clients/',
	ADD: '/clients/add',
	PROFILE: (id: string) => `/clients/${id}/profile`,
	UPDATE_PROFILE: (id: string) => `/clients/${id}/profile`,
} as const;

/**
 * Routes livreurs
 */
export const DELIVERYMAN_ROUTES = {
	ADD: '/livreurs/add',
	PROFILE: (id: string) => `/livreurs/${id}/profile`,
	UPDATE_PROFILE: (id: string) => `/livreurs/${id}/profile`,
	LIVRAISONS: (id: string) => `/livreurs/${id}/livraisons`,
	AVAILABLE_LIVRAISONS: '/livreurs/available-livraisons',
	ACCEPT_LIVRAISON: (id: string, livraisonId: string) =>
		`/livreurs/${id}/livraisons/${livraisonId}/accept`,
	UPDATE_LIVRAISON_STATUS: (id: string, livraisonId: string) =>
		`/livreurs/${id}/livraisons/${livraisonId}/status`,
	STATS: (id: string) => `/livreurs/${id}/stats`,
	UPDATE_AVAILABILITY: (id: string) => `/livreurs/${id}/availability`,
	PLANNED_ROUTES: '/livreurs/planned-routes',
	SEARCH_ROUTES: '/livreurs/routes/search',
	ROUTES_NEAR: (lat: number, lng: number, radius: number) =>
		`/livreurs/routes/near/${lat}/${lng}/${radius}`,
} as const;

/**
 * Routes prestataires
 */
export const SERVICE_PROVIDER_ROUTES = {
	INDEX: '/prestataires/',
	ADD: '/prestataires/add',
	BY_ID: (id: string) => `/prestataires/${id}`,
	UPDATE: (id: string) => `/prestataires/${id}`,
} as const;

/**
 * Routes commerçants
 */
export const SHOPKEEPER_ROUTES = {
	ADD: '/commercants/add',
	PROFILE: (id: string) => `/commercants/${id}/profile`,
	UPDATE_PROFILE: (id: string) => `/commercants/${id}/profile`,
	REJECT: (id: string) => `/commercants/reject/${id}`,
	VERIFY: (id: string) => `/commercants/verify/${id}`,
	UNVERIFIED: '/commercants/unverified',
	VERIFIED: '/commercants/verified',

	// Routes livraisons commerçants
	DELIVERIES: '/commercants/deliveries',
	DELETE_DELIVERY: (id: string) => `/commercants/deliveries/${id}`,
} as const;

/**
 * Routes annonces
 */
export const ANNOUNCEMENT_ROUTES = {
	ALL: '/annonces/',
	CREATE: '/annonces/create',
	BY_ID: (id: string) => `/annonces/${id}`,
	BY_USER: (userId: string) => `/annonces/user/${userId}`,
	UPDATE: (id: string) => `/annonces/${id}`,
	UPDATE_WITH_DATES: (id: string) => `/annonces/${id}/with-string-dates`,
	DELETE: (id: string) => `/annonces/${id}`,
	LIVRAISONS: (id: string) => `/annonces/${id}/livraisons`,
	SERVICES: (id: string) => `/annonces/${id}/services`,
	ATTACH_SERVICES: (id: string) => `/annonces/${id}/services`,
	DETACH_SERVICES: (id: string) => `/annonces/${id}/services`,

	// Routes géolocalisation
	SEARCH_GEO: '/annonces/search/geo',
	SEARCH_ROUTE: '/annonces/search/route',
	SEARCH_CORRIDOR: (
		startLat: number,
		startLng: number,
		endLat: number,
		endLng: number,
		width: number
	) =>
		`/annonces/search/corridor/${startLat}/${startLng}/${endLat}/${endLng}/${width}`,
	ROUTE_MATCHES: (id: string) => `/annonces/suggestions/route-matches/${id}`,
	MAP_CLUSTERS: (zoom: number, bounds: string) =>
		`/annonces/map/clusters/${zoom}/${bounds}`,
	HEATMAP: '/annonces/map/heatmap',
} as const;

/**
 * Routes colis/tracking
 */
export const PACKAGE_ROUTES = {
	CREATE: '/colis/create',
	BY_TRACKING: (trackingNumber: string) => `/colis/${trackingNumber}`,
	LOCATION_HISTORY: (trackingNumber: string) =>
		`/colis/${trackingNumber}/location-history`,
	UPDATE_LOCATION: (trackingNumber: string) =>
		`/colis/${trackingNumber}/update-location`,
	REAL_TIME_LOCATION: (trackingNumber: string) =>
		`/colis/${trackingNumber}/real-time-location`,
	LIVE_TRACKING: '/colis/map/live-tracking',

	// Admin routes
	ALL_ADMIN: '/admin/colis/',
} as const;

/**
 * Routes livraisons
 */
export const DELIVERY_ROUTES = {
  ALL: '/livraisons',
  BY_ID: (id: string) => `/livraisons/${id}`,
  UPDATE: (id: string) => `/livraisons/${id}`,
  BY_CLIENT: (clientId: string) => `/livraisons/client/${clientId}`,
  
  // Correspondances
  SUGGEST_CORRESPONDANCES: (id: string) => `/livraisons/correspondances/suggest/${id}`,
  CREATE_CORRESPONDANCE: '/livraisons/correspondances/create',
  HUB_CORRESPONDANCES: (city: string) => `/livraisons/correspondances/hub/${city}`,
  OPTIMIZE_MULTI_LEG: '/livraisons/optimize/multi-leg',
  
  // Map
  ACTIVE_MAP: '/livraisons/map/active',
  OPTIMIZED_ROUTE: (id: string) => `/livraisons/map/route-optimization/${id}`,
} as const

/**
 * Routes messages
 */
export const MESSAGE_ROUTES = {
	SEND: '/messages/',
	INBOX: '/messages/inbox',
	CONVERSATIONS: '/messages/conversations',
	AVAILABLE_USERS: '/messages/available-users',
	MARK_READ: (id: string) => `/messages/${id}/read`,
} as const;

/**
 * Routes réclamations
 */
export const COMPLAINT_ROUTES = {
	INDEX: '/complaints/',
	CREATE: '/complaints/',
	BY_ID: (id: string) => `/complaints/${id}`,
	UPDATE: (id: string) => `/complaints/${id}`,
	DELETE: (id: string) => `/complaints/${id}`,
	BY_USER: (userId: string) => `/complaints/user/${userId}`,
} as const;

/**
 * Routes services (COMPLET - Client Multi-Rôles)
 */
export const SERVICE_ROUTES = {
  INDEX: '/services/',
  CREATE: '/services/',
  BY_ID: (id: string) => `/services/${id}`,
  UPDATE: (id: string) => `/services/${id}`,
  DELETE: (id: string) => `/services/${id}`,
  
  // 🚀 NOUVEAU: Routes Client Prestataire
  COMPLETE_SERVICE_AND_DISTRIBUTE_PAYMENT: (id: string) => `/services/${id}/complete-and-distribute`,
  GET_PROVIDER_EARNINGS: '/services/provider-earnings',
  GET_PENDING_PAYMENT_SERVICES: '/services/pending-payments',
  GET_PROVIDER_DASHBOARD: '/services/provider-dashboard',
  
  // Géolocalisation
  NEARBY: (lat: number, lng: number, radius: number) => 
    `/services/geo/nearby/${lat}/${lng}/${radius}`,
  PROVIDERS_MAP: '/services/map/providers',
} as const

/**
 * Routes types de services
 */
export const SERVICE_TYPE_ROUTES = {
	INDEX: '/service-types/',
	CREATE: '/service-types/',
	BY_ID: (id: string) => `/service-types/${id}`,
	UPDATE: (id: string) => `/service-types/${id}`,
	DELETE: (id: string) => `/service-types/${id}`,
	TOGGLE_STATUS: (id: string) => `/service-types/${id}/toggle-status`,
} as const;

/**
 * Routes admin
 */
export const ADMIN_ROUTES = {
	INDEX: '/admins/',
	CREATE: '/admins/',
	CREATE_USER: '/admins/create-user',
	BY_ID: (id: string) => `/admins/${id}`,
	UPDATE: (id: string) => `/admins/${id}`,
	DELETE: (id: string) => `/admins/${id}`,
	DELETE_USER: (id: string) => `/admins/delete-user/${id}`,
	TOGGLE_USER_STATUS: (id: string) => `/admins/toggle-user-status/${id}`,

	// Shopkeeper Deliveries
	SHOPKEEPER_DELIVERIES: '/admins/shopkeeper-deliveries',
	DELETE_SHOPKEEPER_DELIVERY: (id: string) =>
		`/admins/shopkeeper-deliveries/${id}`,

	// Admin Annonces (avec informations utilisateur complètes)
	ADMIN_ANNONCES: '/admins/annonces',

	// Analytics (nouvelles routes à ajouter progressivement)
	DELIVERY_HEATMAP: '/admins/analytics/geo/heatmap',
	POPULAR_CORRIDORS: '/admins/analytics/geo/corridors',
	COVERAGE_ANALYTICS: '/admins/analytics/geo/coverage',
	NETWORK_BOTTLENECKS: '/admins/analytics/network/bottlenecks',
	REALTIME_DASHBOARD: '/admins/analytics/realtime/dashboard',

	// Routes mock pour les fonctionnalités avancées (en attendant backend)
	SERVICE_ANALYTICS: '/services/analytics', // À implémenter dans le backend
	MONTHLY_BILLING: (month: number, year: number) =>
		`/billing/monthly/${month}/${year}`, // À implémenter
	VALIDATE_SERVICE: (id: string) => `/services/${id}/validate`, // À implémenter
	VALIDATE_PRESTATAIRE: (id: string) => `/prestataires/${id}/validate`, // À implémenter
} as const;

/**
 * Routes tracking
 */
export const TRACKING_ROUTES = {
  LIVREUR_POSITIONS: (livreurId: string) => `/tracking/livreur/${livreurId}/positions`,
  LAST_POSITION: (livreurId: string) => `/tracking/livreur/${livreurId}/last-position`,
  LIVRAISON_TRACKING: (livraisonId: string) => `/tracking/livraison/${livraisonId}`,
  ACTIVE_LIVREURS: '/tracking/active-livreurs',
  
  // ❌ ROUTES NON DISPONIBLES DANS LE BACKEND - COMMENTÉES
  // Temps réel
  // CALCULATE_ETA: (livraisonId: string) => `/tracking/real-time/eta/${livraisonId}`,
  // TRAFFIC_CONDITIONS: (routeId: string) => `/tracking/real-time/traffic/${routeId}`,
  // REPORT_DETOUR: '/tracking/real-time/detour-alert',
  // PREDICT_DELIVERY_TIME: (livraisonId: string) => `/tracking/predictions/delivery-time/${livraisonId}`,
  // PREDICT_OPTIMAL_ROUTE: (startLat: number, startLng: number, endLat: number, endLng: number) =>
  //   `/tracking/predictions/optimal-route/${startLat}/${startLng}/${endLat}/${endLng}`,
  
  // ❌ ROUTES NON DISPONIBLES DANS LE BACKEND - COMMENTÉES
  // Map
  // LIVE_POSITIONS: '/tracking/map/live-positions',
  // ACTIVE_ROUTES: '/tracking/map/routes/active',
  // GEOFENCES: '/tracking/map/geofences',
} as const

/**
 * Routes entrepôts
 */
export const WAREHOUSE_ROUTES = {
	CREATE: '/wharehouses/create',
	ALL: '/wharehouses/',
	BY_ID: (id: string) => `/wharehouses/${id}`,
	UPDATE: (id: string) => `/wharehouses/${id}`,
	DELETE: (id: string) => `/wharehouses/${id}`,
	CAPACITY: (id: string) => `/wharehouses/${id}/capacity`,
	MAP_LOCATIONS: '/wharehouses/map/locations',
	NEAREST: (lat: number, lng: number) => `/wharehouses/nearest/${lat}/${lng}`,
} as const;

/**
 * Routes stockage colis
 */
export const STORAGE_ROUTES = {
	CREATE: '/stockage-colis/create',
	BY_ID: (id: string) => `/stockage-colis/${id}`,
	BY_COLIS_ID: (colisId: string) => `/stockage-colis/colis/${colisId}`,
	UPDATE: (id: string) => `/stockage-colis/${id}`,
	DELETE: (id: string) => `/stockage-colis/${id}`,
	MOVE_TO_CLIENT: '/stockage-colis/move-to-client',
} as const;

/**
 * Routes justifications
 */
export const JUSTIFICATION_ROUTES = {
	CREATE: '/justification-pieces/create',
	ALL: '/justification-pieces/all',
	UNVERIFIED: '/justification-pieces/unverified',
	VERIFIED: '/justification-pieces/verified',
	BY_USER: (userId: string) => `/justification-pieces/user/${userId}`,
	VERIFY: (id: string) => `/justification-pieces/verify/${id}`,
	REJECT: (id: string) => `/justification-pieces/reject/${id}`,
	BY_ID: (id: string) => `/justification-pieces/${id}`,
} as const;

/**
 * Routes abonnements
 */
export const SUBSCRIPTION_ROUTES = {
	PLANS: '/subscriptions/plans',
	BY_USER: (userId: string) => `/subscriptions/user/${userId}`,
	SUBSCRIBE: '/subscriptions/subscribe',
	CANCEL: (id: string) => `/subscriptions/${id}/cancel`,
	ALL_ADMIN: '/subscriptions/all',
	UPDATE_ADMIN: (id: string) => `/subscriptions/${id}`,
	CHECK_EXPIRED: '/subscriptions/check-expired',
} as const;

/**
 * Routes map/géolocalisation
 */
export const MAP_ROUTES = {
	CONFIG_TILES: '/map/config/tiles',
	FRANCE_REGIONS: '/map/geo/france-regions',
	TRANSPORT_HUBS: '/map/geo/transport-hubs',
} as const;

/**
 * Routes fichiers
 */
export const FILE_ROUTES = {
	DOWNLOAD_JUSTIFICATION: (filename: string) => `/documents/${filename}`,
} as const;

/**
 * Routes codes temporaires
 */
export const TEMP_CODE_ROUTES = {
  GENERATE: '/codes-temporaire/generate-code',
  CHECK: '/codes-temporaire/check-code', 
  RESET: '/codes-temporaire/reset-code',
  VALIDATE_DELIVERY: '/codes-temporaire/validate-delivery',
} as const

/**
 * Route email
 */
export const EMAIL_ROUTES = {
  SEND: '/send-email',
} as const

/**
 * Routes Stripe (NOUVEAU - Alignement avec backend)
 */
export const STRIPE_ROUTES = {
  // Abonnements
  PLANS: '/stripe/plans',
  SUBSCRIBE: '/stripe/subscribe',
  CANCEL_SUBSCRIPTION: '/stripe/cancel-subscription',
  CUSTOMER_PORTAL: '/stripe/customer-portal',
  GET_SUBSCRIPTION: (userId: string) => `/stripe/subscription/${userId}`,
  UPDATE_SUBSCRIPTION: (subscriptionId: string) => `/stripe/subscription/${subscriptionId}`,
  
  // Paiements directs (livraisons/services)
  CREATE_PAYMENT_INTENT: '/stripe/create-payment-intent',
  CONFIRM_PAYMENT: '/stripe/confirm-payment',
  CAPTURE_PAYMENT: '/stripe/capture-payment',
  REFUND_PAYMENT: '/stripe/refund-payment',
  
  // 🚀 NOUVEAU: Paiements Client Multi-Rôles avec Cagnotte
  CREATE_LIVRAISON_PAYMENT_WITH_WALLET: '/stripe/create-livraison-payment-with-wallet',
  CREATE_SERVICE_PAYMENT_WITH_WALLET: '/stripe/create-service-payment-with-wallet',
  GET_CLIENT_WALLET_BALANCE: '/stripe/get-client-wallet-balance',
  
  // Stripe Connect (pour livreurs/prestataires)
  CREATE_CONNECTED_ACCOUNT: '/stripe/create-connected-account',
  GET_ONBOARDING_LINK: '/stripe/onboarding-link',
  GET_ACCOUNT_STATUS: (accountId: string) => `/stripe/account-status/${accountId}`,
  CREATE_EXPRESS_DASHBOARD_LINK: (accountId: string) => `/stripe/express-dashboard/${accountId}`,
  
  // 🚀 NOUVEAU: Routes Stripe Connect (alignées sur backend)
  STRIPE_CONNECT_CREATE_ACCOUNT: '/stripe-connect/create-account',
  STRIPE_CONNECT_ONBOARDING_LINK: '/stripe-connect/onboarding-link',
  STRIPE_CONNECT_ACCOUNT_STATUS: '/stripe-connect/account-status',
  STRIPE_CONNECT_TRANSFER_FROM_WALLET: '/stripe-connect/transfer-from-wallet',
  STRIPE_CONNECT_DASHBOARD_LINK: '/stripe-connect/dashboard-link',
  STRIPE_CONNECT_CONFIGURE_PAYOUTS: '/stripe-connect/configure-payouts',
  
  // 🚀 NOUVEAU: Routes Stripe Connect Client Multi-Rôles
  STRIPE_CONNECT_CLIENT_CREATE_ACCOUNT: '/stripe-connect/client/create-account',
  STRIPE_CONNECT_CLIENT_ONBOARDING_LINK: '/stripe-connect/client/onboarding-link',
  STRIPE_CONNECT_CLIENT_ACCOUNT_STATUS: '/stripe-connect/client/account-status',
  STRIPE_CONNECT_CLIENT_TRANSFER_FROM_WALLET: '/stripe-connect/client/transfer-from-wallet',
  STRIPE_CONNECT_CLIENT_DASHBOARD_LINK: '/stripe-connect/client/dashboard-link',
  
  // Paiements avec commissions (Connect)
  CREATE_DELIVERY_PAYMENT: '/stripe/payments/delivery',
  CREATE_SERVICE_PAYMENT: '/stripe/payments/service',
  CREATE_LIVRAISON_PAYMENT: '/stripe/payments/livraison',
  TRANSFER_TO_PROVIDER: '/stripe/transfer-to-provider',
  
  // Facturation et invoices
  CREATE_INVOICE: '/stripe/create-invoice',
  SEND_INVOICE: (invoiceId: string) => `/stripe/send-invoice/${invoiceId}`,
  GET_INVOICES: (customerId: string) => `/stripe/invoices/${customerId}`,
  
  // Webhooks
  WEBHOOK: '/stripe/webhook',
  
  // Admin/Analytics
  GET_REVENUE_ANALYTICS: '/stripe/admin/revenue-analytics',
  GET_COMMISSION_REPORT: '/stripe/admin/commission-report',
  GET_SUBSCRIPTION_ANALYTICS: '/stripe/admin/subscription-analytics',
} as const

/**
 * Routes Portefeuille EcoDeli (COMPLET - Client Multi-Rôles)
 */
export const WALLET_ROUTES = {
  // Portefeuille utilisateur général
  GET_BY_USER: (userId: string) => `/portefeuille/user/${userId}`,
  SHOW: '/portefeuille/show',
  
  // 🚀 NOUVEAU: Routes Client Multi-Rôles
  // Recharge cagnotte
  RECHARGER_CAGNOTTE: '/portefeuille/recharger-cagnotte',
  CONFIRMER_RECHARGE_CAGNOTTE: '/portefeuille/confirmer-recharge-cagnotte',
  
  // Paiements depuis cagnotte
  PAYER_DEPUIS_CAGNOTTE: '/portefeuille/payer-depuis-cagnotte',
  
  // Gains prestataires
  GAINS_PRESTATAIRE: '/portefeuille/gains-prestataire',
  
  // Configuration virement automatique
  CONFIGURE_AUTO_TRANSFER: (userId: string) => `/portefeuille/user/${userId}/configure-virement`,
  DISABLE_AUTO_TRANSFER: (userId: string) => `/portefeuille/user/${userId}/desactiver-virement`,
  
  // Virements manuels
  REQUEST_TRANSFER: (userId: string) => `/portefeuille/user/${userId}/demander-virement`,
  
  // Historique et statistiques
  GET_HISTORY: (userId: string) => `/portefeuille/user/${userId}/historique`,
  HISTORIQUE: '/portefeuille/historique',
  GET_STATISTICS: '/portefeuille/statistiques',
} as const

// =============================================================================
// UTILITAIRES POUR CONSTRUIRE LES URLS
// =============================================================================

/**
 * Construit une URL complète à partir d'une route
 */
export function buildApiUrl(route: string): string {
	return `${API_CONFIG.BASE_URL}${route}`;
}

/**
 * Construit les routes selon le rôle utilisateur
 */
export function getRoutesByRole(role: UserRole) {
  switch (role) {
    case 'client':
      return {
        auth: AUTH_ROUTES,
        user: USER_ROUTES,
        client: CLIENT_ROUTES,
        announcements: ANNOUNCEMENT_ROUTES,
        packages: PACKAGE_ROUTES,
        messages: MESSAGE_ROUTES,
        complaints: COMPLAINT_ROUTES,
        services: SERVICE_ROUTES,
        tracking: TRACKING_ROUTES,
        stripe: STRIPE_ROUTES,
        wallet: WALLET_ROUTES,
      }
    
    case 'delivery_man':
      return {
        auth: AUTH_ROUTES,
        user: USER_ROUTES,
        deliveryman: DELIVERYMAN_ROUTES,
        deliveries: DELIVERY_ROUTES,
        messages: MESSAGE_ROUTES,
        tracking: TRACKING_ROUTES,
        packages: PACKAGE_ROUTES,
        stripe: STRIPE_ROUTES,
      }
    
    case 'service_provider':
      return {
        auth: AUTH_ROUTES,
        user: USER_ROUTES,
        serviceProvider: SERVICE_PROVIDER_ROUTES,
        services: SERVICE_ROUTES,
        serviceTypes: SERVICE_TYPE_ROUTES,
        messages: MESSAGE_ROUTES,
        justifications: JUSTIFICATION_ROUTES,
        stripe: STRIPE_ROUTES,
      }
    
    case 'shopkeeper':
      return {
        auth: AUTH_ROUTES,
        user: USER_ROUTES,
        shopkeeper: SHOPKEEPER_ROUTES,
        announcements: ANNOUNCEMENT_ROUTES,
        messages: MESSAGE_ROUTES,
        justifications: JUSTIFICATION_ROUTES,
        stripe: STRIPE_ROUTES,
      }
    
    case 'admin':
      return {
        auth: AUTH_ROUTES,
        user: USER_ROUTES,
        admin: ADMIN_ROUTES,
        announcements: ANNOUNCEMENT_ROUTES,
        deliveries: DELIVERY_ROUTES,
        messages: MESSAGE_ROUTES,
        complaints: COMPLAINT_ROUTES,
        services: SERVICE_ROUTES,
        tracking: TRACKING_ROUTES,
        warehouses: WAREHOUSE_ROUTES,
        subscriptions: SUBSCRIPTION_ROUTES,
        justifications: JUSTIFICATION_ROUTES,
        stripe: STRIPE_ROUTES,
      }
    
    default:
      return {
        auth: AUTH_ROUTES,
        map: MAP_ROUTES,
      }
  }
}

/**
 * Export de toutes les routes pour utilisation directe
 */
export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  USER: USER_ROUTES,
  CLIENT: CLIENT_ROUTES,
  DELIVERYMAN: DELIVERYMAN_ROUTES,
  SERVICE_PROVIDER: SERVICE_PROVIDER_ROUTES,
  SHOPKEEPER: SHOPKEEPER_ROUTES,
  ANNOUNCEMENT: ANNOUNCEMENT_ROUTES,
  PACKAGE: PACKAGE_ROUTES,
  DELIVERY: DELIVERY_ROUTES,
  MESSAGE: MESSAGE_ROUTES,
  COMPLAINT: COMPLAINT_ROUTES,
  SERVICE: SERVICE_ROUTES,
  SERVICE_TYPE: SERVICE_TYPE_ROUTES,
  ADMIN: ADMIN_ROUTES,
  TRACKING: TRACKING_ROUTES,
  WAREHOUSE: WAREHOUSE_ROUTES,
  STORAGE: STORAGE_ROUTES,
  JUSTIFICATION: JUSTIFICATION_ROUTES,
  SUBSCRIPTION: SUBSCRIPTION_ROUTES,
  MAP: MAP_ROUTES,
  FILE: FILE_ROUTES,
  TEMP_CODE: TEMP_CODE_ROUTES,
  EMAIL: EMAIL_ROUTES,
  STRIPE: STRIPE_ROUTES,
  WALLET: WALLET_ROUTES,
} as const