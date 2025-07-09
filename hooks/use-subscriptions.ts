import { useState, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';

// =============================================================================
// TYPES POUR LES ABONNEMENTS
// =============================================================================

export interface SubscriptionData {
	id: number;
	subscription_type: 'free' | 'starter' | 'premium' | 'enterprise';
	monthly_price: number;
	start_date: string;
	end_date: string | null;
	status: 'active' | 'inactive' | 'cancelled' | 'expired';
	is_active: boolean;
	is_expired: boolean;
	created_at: string;
	updated_at: string;
	features: {
		max_packages_per_month: number;
		insurance_coverage: number;
		priority_support: boolean;
	};
	utilisateur: {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
		phone_number: string;
		client: {
			id: number;
			loyalty_points?: number;
			preferred_payment_method?: string;
		} | null;
	};
}

export interface SubscriptionsStats {
	total: number;
	active: number;
	inactive: number;
	cancelled: number;
	expired: number;
	byType: {
		free: number;
		starter: number;
		premium: number;
		enterprise: number;
	};
	totalRevenue: number;
	monthlyRevenue: number;
	averagePrice: number;
}

// =============================================================================
// HOOK POUR LES ABONNEMENTS
// =============================================================================

export function useSubscriptions() {
	const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
	const [stats, setStats] = useState<SubscriptionsStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// =============================================================================
	// RÉCUPÉRATION DES ABONNEMENTS CLIENTS (ADMIN)
	// =============================================================================

	const getAllClientSubscriptions = useCallback(async (): Promise<
		SubscriptionData[]
	> => {
		setLoading(true);
		setError(null);

		try {
			console.log('🔍 Récupération des abonnements clients...');

			// Utiliser l'endpoint admin pour récupérer tous les abonnements
			const response = await apiClient.get<any>(
				'/admins/client-subscriptions'
			);
			console.log('📋 Réponse abonnements:', response);

			let subscriptionsData: any[] = [];

			// La réponse devrait être directement un tableau maintenant
			if (Array.isArray(response)) {
				subscriptionsData = response;
			} else if (response && Array.isArray(response.data)) {
				subscriptionsData = response.data;
			} else if (response && Array.isArray(response.subscriptions)) {
				subscriptionsData = response.subscriptions;
			}

			if (subscriptionsData.length === 0) {
				console.log('⚠️ Aucun abonnement trouvé');
				setSubscriptions([]);
				return [];
			}

			// Transformation des données pour le frontend
			const transformedSubscriptions: SubscriptionData[] =
				subscriptionsData.map(transformSubscription);

			console.log("🔍 Exemple d'abonnement brut:", subscriptionsData[0]);
			console.log(
				"🔍 Exemple d'abonnement transformé:",
				transformedSubscriptions[0]
			);

			console.log(
				`✅ ${transformedSubscriptions.length} abonnements transformés`
			);
			setSubscriptions(transformedSubscriptions);
			return transformedSubscriptions;
		} catch (error) {
			console.error('❌ Erreur récupération abonnements:', error);
			const errorMessage = getErrorMessage(error);
			setError(
				`Erreur lors du chargement des abonnements: ${errorMessage}`
			);
			setSubscriptions([]);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	// =============================================================================
	// STATISTIQUES DES ABONNEMENTS
	// =============================================================================

	const calculateStats = useCallback(
		(subscriptionsList: SubscriptionData[]): SubscriptionsStats => {
			const total = subscriptionsList.length;
			const active = subscriptionsList.filter(
				(s) => s.status === 'active'
			).length;
			const inactive = subscriptionsList.filter(
				(s) => s.status === 'inactive'
			).length;
			const cancelled = subscriptionsList.filter(
				(s) => s.status === 'cancelled'
			).length;
			const expired = subscriptionsList.filter(
				(s) => s.status === 'expired'
			).length;

			// Statistiques par type d'abonnement
			const byType = {
				free: subscriptionsList.filter(
					(s) => s.subscription_type === 'free'
				).length,
				starter: subscriptionsList.filter(
					(s) => s.subscription_type === 'starter'
				).length,
				premium: subscriptionsList.filter(
					(s) => s.subscription_type === 'premium'
				).length,
				enterprise: subscriptionsList.filter(
					(s) => s.subscription_type === 'enterprise'
				).length,
			};

			// Calculs financiers
			const totalRevenue = subscriptionsList.reduce(
				(sum, subscription) => {
					return sum + subscription.monthly_price;
				},
				0
			);

			// Revenus mensuels (abonnements actifs seulement)
			const monthlyRevenue = subscriptionsList
				.filter((s) => s.status === 'active')
				.reduce((sum, subscription) => {
					return sum + subscription.monthly_price;
				}, 0);

			const averagePrice = total > 0 ? totalRevenue / total : 0;

			return {
				total,
				active,
				inactive,
				cancelled,
				expired,
				byType,
				totalRevenue,
				monthlyRevenue,
				averagePrice,
			};
		},
		[]
	);

	const loadSubscriptionsWithStats = useCallback(async () => {
		const subscriptionsList = await getAllClientSubscriptions();
		const calculatedStats = calculateStats(subscriptionsList);
		setStats(calculatedStats);
	}, [getAllClientSubscriptions, calculateStats]);

	// =============================================================================
	// TRANSFORMATION DES DONNÉES
	// =============================================================================

	const transformSubscription = (item: any): SubscriptionData => {
		return {
			id: item.id,
			subscription_type: item.subscription_type || 'free',
			monthly_price: parseFloat(item.monthly_price || '0'), // Conversion string -> number
			start_date: item.start_date || item.startDate || item.created_at,
			end_date: item.end_date || item.endDate || null,
			status: item.status || 'inactive',
			is_active: Boolean(item.is_active),
			is_expired: Boolean(item.is_expired),
			created_at:
				item.created_at || item.createdAt || new Date().toISOString(),
			updated_at:
				item.updated_at || item.updatedAt || new Date().toISOString(),
			features: {
				max_packages_per_month:
					item.features?.max_packages_per_month || 0,
				insurance_coverage: item.features?.insurance_coverage || 0,
				priority_support: Boolean(item.features?.priority_support),
			},
			utilisateur: {
				id: item.utilisateur?.id || 0,
				firstName: item.utilisateur?.firstName || '', // Souvent vide dans l'API
				lastName: item.utilisateur?.lastName || '', // Souvent vide dans l'API
				email: item.utilisateur?.email || '',
				phone_number: item.utilisateur?.phone_number || '',
				client: item.utilisateur?.client
					? {
							id: item.utilisateur.client.id || 0,
							loyalty_points:
								item.utilisateur.client.loyalty_points || 0,
							preferred_payment_method:
								item.utilisateur.client
									.preferred_payment_method || '',
					  }
					: null,
			},
		};
	};

	// =============================================================================
	// FILTRES ET RECHERCHE
	// =============================================================================

	const filterSubscriptions = useCallback(
		(
			subscriptionsList: SubscriptionData[],
			filters: {
				status?: string;
				subscription_type?: string;
				searchQuery?: string;
				active_only?: boolean;
			}
		): SubscriptionData[] => {
			let filtered = [...subscriptionsList];

			// Filtrer par statut
			if (filters.status && filters.status !== 'all') {
				filtered = filtered.filter(
					(sub) => sub.status === filters.status
				);
			}

			// Filtrer par type d'abonnement
			if (
				filters.subscription_type &&
				filters.subscription_type !== 'all'
			) {
				filtered = filtered.filter(
					(sub) => sub.subscription_type === filters.subscription_type
				);
			}

			// Filtrer seulement les actifs
			if (filters.active_only) {
				filtered = filtered.filter((sub) => sub.is_active);
			}

			// Recherche textuelle
			if (filters.searchQuery) {
				const query = filters.searchQuery.toLowerCase();
				filtered = filtered.filter((subscription) => {
					const userName =
						`${subscription.utilisateur.firstName} ${subscription.utilisateur.lastName}`.toLowerCase();
					const email = subscription.utilisateur.email.toLowerCase();
					const subscriptionType =
						subscription.subscription_type.toLowerCase();

					return (
						userName.includes(query) ||
						email.includes(query) ||
						subscriptionType.includes(query)
					);
				});
			}

			return filtered;
		},
		[]
	);

	// =============================================================================
	// UTILITAIRES
	// =============================================================================

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const refreshSubscriptions = useCallback(async () => {
		await loadSubscriptionsWithStats();
	}, [loadSubscriptionsWithStats]);

	const getSubscriptionById = useCallback(
		(id: number): SubscriptionData | undefined => {
			return subscriptions.find((sub) => sub.id === id);
		},
		[subscriptions]
	);

	const getActiveSubscriptions = useCallback((): SubscriptionData[] => {
		return subscriptions.filter((sub) => sub.is_active);
	}, [subscriptions]);

	const getSubscriptionsByType = useCallback(
		(type: string): SubscriptionData[] => {
			return subscriptions.filter(
				(sub) => sub.subscription_type === type
			);
		},
		[subscriptions]
	);

	const getSubscriptionsByStatus = useCallback(
		(status: string): SubscriptionData[] => {
			return subscriptions.filter((sub) => sub.status === status);
		},
		[subscriptions]
	);

	// Calculs de revenus
	const getTotalMonthlyRevenue = useCallback((): number => {
		return subscriptions
			.filter((sub) => sub.is_active)
			.reduce((sum, sub) => sum + sub.monthly_price, 0);
	}, [subscriptions]);

	const getRevenueByType = useCallback(() => {
		return {
			free: subscriptions
				.filter((s) => s.subscription_type === 'free' && s.is_active)
				.reduce((sum, s) => sum + s.monthly_price, 0),
			starter: subscriptions
				.filter((s) => s.subscription_type === 'starter' && s.is_active)
				.reduce((sum, s) => sum + s.monthly_price, 0),
			premium: subscriptions
				.filter((s) => s.subscription_type === 'premium' && s.is_active)
				.reduce((sum, s) => sum + s.monthly_price, 0),
			enterprise: subscriptions
				.filter(
					(s) => s.subscription_type === 'enterprise' && s.is_active
				)
				.reduce((sum, s) => sum + s.monthly_price, 0),
		};
	}, [subscriptions]);

	return {
		// Données
		subscriptions,
		stats,
		loading,
		error,

		// Actions
		getAllClientSubscriptions,
		loadSubscriptionsWithStats,
		refreshSubscriptions,
		clearError,

		// Utilitaires
		filterSubscriptions,
		calculateStats,
		getSubscriptionById,
		getActiveSubscriptions,
		getSubscriptionsByType,
		getSubscriptionsByStatus,
		getTotalMonthlyRevenue,
		getRevenueByType,

		// Statistiques rapides
		totalSubscriptions: subscriptions.length,
		activeSubscriptions: subscriptions.filter((s) => s.is_active).length,
		hasSubscriptions: subscriptions.length > 0,
		monthlyRevenue: getTotalMonthlyRevenue(),
	};
}
