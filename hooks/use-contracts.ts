import { useState, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';

// =============================================================================
// TYPES POUR LES CONTRATS
// =============================================================================

export interface ContractData {
	id: number;
	status: 'active' | 'inactive' | 'cancelled' | 'expired';
	startDate: string;
	endDate: string | null;
	createdAt: string;
	updatedAt: string;
	plan: {
		id: number;
		name: string;
		price: number;
		description: string;
	};
	commercant: {
		id: number;
		storeName: string;
		businessAddress: string;
		contactNumber: string;
		verificationState: string;
		user: {
			id: number;
			firstName: string;
			lastName: string;
			email: string;
			phone_number: string;
		};
	};
}

export interface ContractsStats {
	total: number;
	active: number;
	inactive: number;
	cancelled: number;
	expired: number;
	totalRevenue: number;
	monthlyRevenue: number;
}

// =============================================================================
// HOOK POUR LES CONTRATS
// =============================================================================

export function useContracts() {
	const [contracts, setContracts] = useState<ContractData[]>([]);
	const [stats, setStats] = useState<ContractsStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// =============================================================================
	// RÉCUPÉRATION DES CONTRATS COMMERÇANTS (ADMIN)
	// =============================================================================

	const getAllShopkeeperContracts = useCallback(async (): Promise<
		ContractData[]
	> => {
		setLoading(true);
		setError(null);

		try {
			console.log('🔍 Récupération des contrats commerçants...');

			// Utiliser l'endpoint admin pour récupérer tous les contrats
			const response = await apiClient.get<any>(
				'/admins/shopkeeper-contracts'
			);
			console.log('📋 Réponse contrats:', response);

			let contractsData: any[] = [];
			if (Array.isArray(response)) {
				contractsData = response;
			} else if (response && Array.isArray(response.data)) {
				contractsData = response.data;
			} else if (response && Array.isArray(response.contracts)) {
				contractsData = response.contracts;
			}

			if (contractsData.length === 0) {
				console.log('⚠️ Aucun contrat trouvé');
				setContracts([]);
				return [];
			}

			// Transformation des données pour le frontend
			const transformedContracts: ContractData[] =
				contractsData.map(transformContract);

			console.log('🔍 Exemple de contrat brut:', contractsData[0]);
			console.log(
				'🔍 Exemple de contrat transformé:',
				transformedContracts[0]
			);

			console.log(
				`✅ ${transformedContracts.length} contrats transformés`
			);
			setContracts(transformedContracts);
			return transformedContracts;
		} catch (error) {
			console.error('❌ Erreur récupération contrats:', error);
			const errorMessage = getErrorMessage(error);
			setError(`Erreur lors du chargement des contrats: ${errorMessage}`);
			setContracts([]);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	// =============================================================================
	// STATISTIQUES DES CONTRATS
	// =============================================================================

	const calculateStats = useCallback(
		(contractsList: ContractData[]): ContractsStats => {
			const total = contractsList.length;
			const active = contractsList.filter(
				(c) => c.status === 'active'
			).length;
			const inactive = contractsList.filter(
				(c) => c.status === 'inactive'
			).length;
			const cancelled = contractsList.filter(
				(c) => c.status === 'cancelled'
			).length;
			const expired = contractsList.filter(
				(c) => c.status === 'expired'
			).length;

			const totalRevenue = contractsList.reduce((sum, contract) => {
				return sum + (contract.plan.price || 0);
			}, 0);

			// Revenus mensuels (contrats actifs seulement)
			const monthlyRevenue = contractsList
				.filter((c) => c.status === 'active')
				.reduce((sum, contract) => {
					return sum + (contract.plan.price || 0);
				}, 0);

			return {
				total,
				active,
				inactive,
				cancelled,
				expired,
				totalRevenue,
				monthlyRevenue,
			};
		},
		[]
	);

	const loadContractsWithStats = useCallback(async () => {
		const contractsList = await getAllShopkeeperContracts();
		const calculatedStats = calculateStats(contractsList);
		setStats(calculatedStats);
	}, [getAllShopkeeperContracts, calculateStats]);

	// =============================================================================
	// TRANSFORMATION DES DONNÉES
	// =============================================================================

	const transformContract = (item: any): ContractData => {
		return {
			id: item.id,
			status: item.status || 'inactive',
			startDate: item.startDate || item.start_date || item.createdAt,
			endDate: item.endDate || item.end_date || null,
			createdAt:
				item.createdAt || item.created_at || new Date().toISOString(),
			updatedAt:
				item.updatedAt || item.updated_at || new Date().toISOString(),
			plan: {
				id: item.plan?.id || 0,
				name: item.plan?.name || 'Plan inconnu',
				price: parseFloat(item.plan?.price || '0'), // Conversion string -> number
				description: item.plan?.description || '',
			},
			commercant: {
				id: item.commercant?.id || 0,
				storeName: item.commercant?.storeName || 'Magasin inconnu',
				businessAddress: item.commercant?.businessAddress || '',
				contactNumber: item.commercant?.contactNumber || '',
				verificationState:
					item.commercant?.verificationState || 'pending',
				user: {
					id: item.commercant?.user?.id || 0,
					firstName: item.commercant?.user?.firstName || '',
					lastName: item.commercant?.user?.lastName || '',
					email: item.commercant?.user?.email || '',
					phone_number:
						item.commercant?.user?.phone ||
						item.commercant?.user?.phone_number ||
						'',
				},
			},
		};
	};

	// =============================================================================
	// FILTRES ET RECHERCHE
	// =============================================================================

	const filterContracts = useCallback(
		(
			contractsList: ContractData[],
			filters: {
				status?: string;
				searchQuery?: string;
				planId?: number;
			}
		): ContractData[] => {
			let filtered = [...contractsList];

			// Filtrer par statut
			if (filters.status && filters.status !== 'all') {
				filtered = filtered.filter(
					(contract) => contract.status === filters.status
				);
			}

			// Filtrer par plan
			if (filters.planId) {
				filtered = filtered.filter(
					(contract) => contract.plan.id === filters.planId
				);
			}

			// Recherche textuelle
			if (filters.searchQuery) {
				const query = filters.searchQuery.toLowerCase();
				filtered = filtered.filter((contract) => {
					const commercantName =
						`${contract.commercant.user.firstName} ${contract.commercant.user.lastName}`.toLowerCase();
					const storeName =
						contract.commercant.storeName.toLowerCase();
					const email = contract.commercant.user.email.toLowerCase();
					const planName = contract.plan.name.toLowerCase();

					return (
						commercantName.includes(query) ||
						storeName.includes(query) ||
						email.includes(query) ||
						planName.includes(query)
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

	const refreshContracts = useCallback(async () => {
		await loadContractsWithStats();
	}, [loadContractsWithStats]);

	const getContractById = useCallback(
		(id: number): ContractData | undefined => {
			return contracts.find((contract) => contract.id === id);
		},
		[contracts]
	);

	const getActiveContracts = useCallback((): ContractData[] => {
		return contracts.filter((contract) => contract.status === 'active');
	}, [contracts]);

	const getContractsByStatus = useCallback(
		(status: string): ContractData[] => {
			return contracts.filter((contract) => contract.status === status);
		},
		[contracts]
	);

	return {
		// Données
		contracts,
		stats,
		loading,
		error,

		// Actions
		getAllShopkeeperContracts,
		loadContractsWithStats,
		refreshContracts,
		clearError,

		// Utilitaires
		filterContracts,
		calculateStats,
		getContractById,
		getActiveContracts,
		getContractsByStatus,

		// Statistiques rapides
		totalContracts: contracts.length,
		activeContracts: contracts.filter((c) => c.status === 'active').length,
		hasContracts: contracts.length > 0,
	};
}
