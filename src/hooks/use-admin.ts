// =============================================================================
// HOOK ADMIN - GESTION CENTRALISÉE DES FONCTIONNALITÉS ADMINISTRATEUR
// =============================================================================

import { useState, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';
import { User } from '@/src/types';
import {
	AdminUserCreationRequest,
	JustificationPiecesApiResponse,
	JustificationVerifyApiResponse,
	JustificationReviewRequest,
	FrontendValidators,
	ComplaintsApiResponse,
	ComplaintApiResponse,
	ComplaintData,
	ComplaintTransformed,
	UpdateComplaintRequest,
	UsersApiResponse,
} from '@/src/types/validators';
import {
	AdminComplaintData,
	AdminServiceData,
	AdminDashboardStats,
} from '@/src/types/admin';

/**
 * Interface pour les statistiques du dashboard admin
 */
export interface AdminStats {
	totalUsers: number;
	totalClients: number;
	totalDeliverymen: number;
	totalServiceProviders: number;
	totalShopkeepers: number;
	totalComplaints: number;
	totalActiveAnnouncements: number;
	totalDeliveries: number;
	recentActivity: {
		newUsers: number;
		newComplaints: number;
		completedDeliveries: number;
	};
}

/**
 * Hook principal pour la gestion admin
 * Centralise toute la logique métier admin
 */
export function useAdmin() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// ========================================================================
	// UTILITIES
	// ========================================================================

	const handleAsync = useCallback(
		async <T>(
			operation: () => Promise<T>,
			errorMessage: string = "Erreur lors de l'opération"
		): Promise<T | null> => {
			try {
				console.log(
					'🔍 Hook useAdmin - handleAsync début, errorMessage:',
					errorMessage
				);
				setLoading(true);
				setError(null);

				const result = await operation();
				console.log(
					'✅ Hook useAdmin - handleAsync succès, résultat:',
					result
				);
				return result;
			} catch (err) {
				console.error(
					'❌ Hook useAdmin - handleAsync erreur capturée:',
					err
				);
				const message = getErrorMessage(err);
				const fullErrorMessage = `${errorMessage}: ${message}`;
				console.error(
					"❌ Hook useAdmin - Message d'erreur final:",
					fullErrorMessage
				);
				setError(fullErrorMessage);
				return null;
			} finally {
				console.log(
					'🔍 Hook useAdmin - handleAsync finally, loading=false'
				);
				setLoading(false);
			}
		},
		[]
	);

	// ========================================================================
	// DASHBOARD & STATISTICS - FONCTIONNALITÉS DE BASE QUI MARCHENT
	// ========================================================================

	const getDashboardStats = useCallback(async () => {
		return handleAsync(async () => {
			// Utilise la route admin existante qui marche
			const response = await apiClient.get(API_ROUTES.ADMIN.INDEX);
			return response;
		}, 'Erreur lors du chargement des statistiques');
	}, [handleAsync]);

	// ========================================================================
	// USER MANAGEMENT - RESTAURÉ AUX FONCTIONNALITÉS QUI MARCHAIENT
	// ========================================================================

	const getAllUsers = useCallback(async () => {
		return handleAsync(async () => {
			const response: any = await apiClient.get(API_ROUTES.USER.ALL);
			console.log('🔍 Users Response from backend:', response);

			// Gestion robuste des différents formats de réponse
			if (Array.isArray(response)) {
				console.log(
					'✅ Utilisateurs chargés (array direct):',
					response.length
				);
				return response;
			}

			if (response && Array.isArray(response.data)) {
				console.log(
					'✅ Utilisateurs chargés (response.data):',
					response.data.length
				);
				return response.data;
			}

			if (response && Array.isArray(response.users)) {
				console.log(
					'✅ Utilisateurs chargés (response.users):',
					response.users.length
				);
				return response.users;
			}

			console.warn(
				'⚠️ Format de réponse utilisateurs inattendu:',
				response
			);
			return [];
		}, 'Erreur lors du chargement des utilisateurs');
	}, [handleAsync]);

	const createUserWithEmail = useCallback(
		async (userData: AdminUserCreationRequest) => {
			console.log(
				'🔍 Hook useAdmin - createUserWithEmail appelé avec:',
				userData
			);

			const validationErrors =
				FrontendValidators.validateAdminUserCreationRequest(userData);
			if (validationErrors.length > 0) {
				console.error(
					'❌ Hook useAdmin - Erreurs de validation:',
					validationErrors
				);
				setError(validationErrors.join(', '));
				return null;
			}

			console.log('✅ Hook useAdmin - Validation réussie, appel API...');

			return handleAsync(async () => {
				console.log(
					'🔍 Hook useAdmin - Route API:',
					API_ROUTES.ADMIN.CREATE_USER
				);
				console.log('🔍 Hook useAdmin - Données envoyées:', userData);

				const response = await apiClient.post(
					API_ROUTES.ADMIN.CREATE_USER,
					userData
				);

				console.log('🔍 Hook useAdmin - Réponse reçue:', response);
				return response;
			}, "Erreur lors de la création de l'utilisateur");
		},
		[handleAsync]
	);

	const toggleUserStatus = useCallback(
		async (userId: number) => {
			return handleAsync(async () => {
				const response = await apiClient.put(
					API_ROUTES.ADMIN.TOGGLE_USER_STATUS(userId.toString()),
					{}
				);
				return response;
			}, 'Erreur lors du changement de statut');
		},
		[handleAsync]
	);

	const deleteUser = useCallback(
		async (userId: number) => {
			return handleAsync(async () => {
				const response = await apiClient.delete(
					API_ROUTES.ADMIN.DELETE_USER(userId.toString())
				);
				return response;
			}, "Erreur lors de la suppression de l'utilisateur");
		},
		[handleAsync]
	);

	// ========================================================================
	// COMPLAINT MANAGEMENT - RESTAURÉ AUX FONCTIONNALITÉS QUI MARCHAIENT
	// ========================================================================

	const getComplaints = useCallback(async (): Promise<
		ComplaintData[] | null
	> => {
		return handleAsync(async () => {
			const response: any = await apiClient.get(
				API_ROUTES.COMPLAINT.INDEX
			);
			console.log('🔍 Response from backend:', response);

			// Le backend retourne { complaints: [] }
			if (response && Array.isArray(response.complaints)) {
				console.log(
					'✅ Réclamations chargées:',
					response.complaints.length
				);
				return response.complaints;
			}

			// Fallback : si la réponse est directement un array
			if (Array.isArray(response)) {
				console.log(
					'✅ Réclamations chargées (array direct):',
					response.length
				);
				return response;
			}

			// Dernière chance : response.data
			if (response && Array.isArray(response.data)) {
				console.log(
					'✅ Réclamations chargées (response.data):',
					response.data.length
				);
				return response.data;
			}

			console.warn('⚠️ Format de réponse inattendu:', response);
			return [];
		}, 'Erreur lors du chargement des réclamations');
	}, [handleAsync]);

	const getComplaint = useCallback(
		async (id: number): Promise<ComplaintData | null> => {
			return handleAsync(async () => {
				const response: any = await apiClient.get(
					API_ROUTES.COMPLAINT.BY_ID(id.toString())
				);
				// Retour simple sans transformation complexe
				return response.complaint || response.data || response;
			}, 'Erreur lors du chargement de la réclamation');
		},
		[handleAsync]
	);

	const updateComplaint = useCallback(
		async (id: number, data: UpdateComplaintRequest) => {
			const validationErrors =
				FrontendValidators.validateUpdateComplaintRequest(data);
			if (validationErrors.length > 0) {
				setError(validationErrors.join(', '));
				return null;
			}

			return handleAsync(async () => {
				const response = await apiClient.put(
					API_ROUTES.COMPLAINT.UPDATE(id.toString()),
					data
				);
				return response;
			}, 'Erreur lors de la mise à jour de la réclamation');
		},
		[handleAsync]
	);

	const resolveComplaint = useCallback(
		async (id: number, adminNotes?: string) => {
			return updateComplaint(id, {
				status: 'resolved',
				admin_notes: adminNotes,
			});
		},
		[updateComplaint]
	);

	const closeComplaint = useCallback(
		async (id: number, adminNotes?: string) => {
			return updateComplaint(id, {
				status: 'closed',
				admin_notes: adminNotes,
			});
		},
		[updateComplaint]
	);

	const setComplaintInProgress = useCallback(
		async (id: number, adminNotes?: string) => {
			return updateComplaint(id, {
				status: 'in_progress',
				admin_notes: adminNotes,
			});
		},
		[updateComplaint]
	);

	const deleteComplaint = useCallback(
		async (id: number) => {
			return handleAsync(async () => {
				const response = await apiClient.delete(
					API_ROUTES.COMPLAINT.DELETE(id.toString())
				);
				return response;
			}, 'Erreur lors de la suppression de la réclamation');
		},
		[handleAsync]
	);

	// ========================================================================
	// SERVICES - FONCTIONNALITÉS BASIQUES (SANS LES NOUVELLES FEATURES)
	// ========================================================================

	const getAllServices = useCallback(async () => {
		return handleAsync(async () => {
			try {
				const response = await apiClient.get(API_ROUTES.SERVICE.INDEX);
				// Retourne les services tels qu'ils arrivent du backend
				return Array.isArray(response)
					? response
					: Array.isArray(response.services)
					? response.services
					: Array.isArray(response.data)
					? response.data
					: [];
			} catch (err) {
				console.warn('Services non disponibles, retour tableau vide');
				return [];
			}
		}, 'Erreur lors du chargement des services');
	}, [handleAsync]);

	// ========================================================================
	// NOUVELLES FONCTIONNALITÉS - MODE MOCK/OPTIONNEL
	// ========================================================================

	const getAllPrestataires = useCallback(async () => {
		return handleAsync(async () => {
			try {
				// Essayer avec la route existante des prestataires
				const response = await apiClient.get(
					API_ROUTES.SERVICE_PROVIDER.INDEX
				);
				return Array.isArray(response)
					? response
					: Array.isArray(response.data)
					? response.data
					: [];
			} catch (err) {
				console.warn(
					'Prestataires non disponibles, retour tableau vide'
				);
				return [];
			}
		}, 'Erreur lors du chargement des prestataires');
	}, [handleAsync]);

	const getAllServiceTypes = useCallback(async () => {
		return handleAsync(async () => {
			try {
				const response = await apiClient.get(
					API_ROUTES.SERVICE_TYPE.INDEX
				);
				return Array.isArray(response)
					? response
					: Array.isArray(response.data)
					? response.data
					: [];
			} catch (err) {
				console.warn(
					'Types de services non disponibles, retour tableau vide'
				);
				return [];
			}
		}, 'Erreur lors du chargement des types de services');
	}, [handleAsync]);

	const getServiceAnalytics = useCallback(async () => {
		return handleAsync(async () => {
			// MOCK DATA en attendant l'implémentation backend
			return {
				generalStats: {
					totalServices: 0,
					activeServices: 0,
					completedServices: 0,
					completionRate: '0%',
				},
				topServices: [],
				servicesByType: [],
				revenueStats: {
					totalRevenue: 0,
					averagePrice: 0,
					minPrice: 0,
					maxPrice: 0,
				},
				topProviders: [],
				generatedAt: new Date().toISOString(),
			};
		}, 'Analytics non disponibles (mode mock)');
	}, [handleAsync]);

	// Actions pour services (NON-OP pour l'instant)
	const validateService = useCallback(
		async (id: number, validationData: any) => {
			console.warn(
				'validateService: Fonctionnalité pas encore implémentée'
			);
			return null;
		},
		[]
	);

	const validatePrestataire = useCallback(
		async (id: number, validationData: any) => {
			console.warn(
				'validatePrestataire: Fonctionnalité pas encore implémentée'
			);
			return null;
		},
		[]
	);

	const toggleServiceStatus = useCallback(async (id: number) => {
		console.warn(
			'toggleServiceStatus: Fonctionnalité pas encore implémentée'
		);
		return null;
	}, []);

	const generateMonthlyInvoices = useCallback(
		async (month: number, year: number) => {
			console.warn(
				'generateMonthlyInvoices: Fonctionnalité pas encore implémentée'
			);
			return null;
		},
		[]
	);

	// ========================================================================
	// MÉTHODES UTILITAIRES
	// ========================================================================

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const refreshData = useCallback(async () => {
		// Rafraîchit seulement les données de base qui marchent
		const promises = [getDashboardStats(), getAllUsers(), getComplaints()];

		try {
			await Promise.all(promises);
		} catch (err) {
			setError('Erreur lors du rafraîchissement des données');
		}
	}, [getDashboardStats, getAllUsers, getComplaints]);

	return {
		// États
		loading,
		error,

		// Dashboard & stats
		getDashboardStats,

		// Gestion utilisateurs ✅ FONCTIONNEL
		getAllUsers,
		createUserWithEmail,
		toggleUserStatus,
		deleteUser,

		// Gestion réclamations ✅ FONCTIONNEL
		getComplaints,
		getComplaint,
		updateComplaint,
		resolveComplaint,
		closeComplaint,
		setComplaintInProgress,
		deleteComplaint,

		// Gestion services ⚠️ BASIQUE
		getAllServices,
		getAllPrestataires,
		getAllServiceTypes,
		getServiceAnalytics,

		// Actions (NON-OP pour l'instant)
		validateService,
		validatePrestataire,
		toggleServiceStatus,
		generateMonthlyInvoices,

		// Utilitaires
		clearError,
		refreshData,
	};
}

/**
 * Hook pour vérifier les permissions admin
 */
export function useAdminPermissions() {
	// TODO: Implémenter avec le système d'auth
	const hasPermission = (permission: string): boolean => {
		// Logique de vérification des permissions
		return true; // Temporaire
	};

	const isSupperAdmin = (): boolean => {
		// Vérifier si l'utilisateur est super admin
		return true; // Temporaire
	};

	return {
		hasPermission,
		isSupperAdmin,
	};
}
