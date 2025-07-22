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
				setLoading(true);
				setError(null);

				const result = await operation();
				return result;
			} catch (err) {
				const message = getErrorMessage(err);
				setError(`${errorMessage}: ${message}`);
				console.error(errorMessage, err);
				return null;
			} finally {
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

	/**
	 * Création complète d'un utilisateur avec tous les rôles et relations
	 * Respecte les contraintes : appels multiples selon les spécifications
	 */
	const createCompleteUser = useCallback(
		async (userData: AdminUserCreationRequest) => {
			const validationErrors =
				FrontendValidators.validateAdminUserCreationRequest(userData);
			if (Object.keys(validationErrors).length > 0) {
				setError(Object.values(validationErrors).join(', '));
				return null;
			}

			return handleAsync(async () => {
				// 1️⃣ Créer l'utilisateur de base via /auth/register
				const registerData = {
					first_name: userData.first_name,
					last_name: userData.last_name,
					email: userData.email,
					password: userData.password,
					confirm_password: userData.password, // Requis pour register
					phone_number: userData.phone_number,
					address: userData.address,
					city: userData.city,
					postalCode: userData.postalCode,
					country: userData.country,
				};

				console.log('🔄 Étape 1: Création utilisateur de base...');
				const userResponse = await apiClient.post<{
					user: User;
					token: string;
				}>(API_ROUTES.AUTH.REGISTER, registerData);

				if (!userResponse || !userResponse.user) {
					throw new Error(
						"Échec de la création de l'utilisateur de base"
					);
				}

				const createdUser = userResponse.user;
				const userId = createdUser.id;
				console.log('✅ Utilisateur créé:', userId);

				// 2️⃣ Créer le client automatiquement (toujours)
				console.log('🔄 Étape 2: Création du client...');
				try {
					await apiClient.post(API_ROUTES.CLIENT.ADD, {
						utilisateur_id: userId,
					});
					console.log('✅ Client créé pour utilisateur:', userId);
				} catch (err) {
					console.warn(
						'⚠️ Échec création client:',
						getErrorMessage(err)
					);
					// Ne pas bloquer si le client existe déjà
				}

				// 3️⃣ Créer les rôles selon la sélection
				const rolesCreated = [];
				if (userData.roles && userData.roles.length > 0) {
					for (const role of userData.roles) {
						try {
							console.log(
								`🔄 Étape 3: Création du rôle ${role}...`
							);

							switch (role) {
								case 'livreur':
									await apiClient.post(
										API_ROUTES.DELIVERYMAN.ADD,
										{ utilisateur_id: userId }
									);
									rolesCreated.push('livreur');
									console.log(
										'✅ Livreur créé pour utilisateur:',
										userId
									);
									break;

								case 'prestataire':
									await apiClient.post(
										API_ROUTES.SERVICE_PROVIDER.ADD,
										{ utilisateur_id: userId }
									);
									rolesCreated.push('prestataire');
									console.log(
										'✅ Prestataire créé pour utilisateur:',
										userId
									);
									break;

								case 'commercant':
									const commercantData = {
										utilisateur_id: userId,
										store_name: 'Boutique crée',
									};
									await apiClient.post(
										API_ROUTES.SHOPKEEPER.ADD,
										commercantData
									);
									rolesCreated.push('commerçant');
									console.log(
										'✅ Commerçant créé pour utilisateur:',
										userId
									);
									break;

								case 'administrateur':
									// Traité dans l'étape suivante avec les privilèges
									break;

								default:
									console.warn(
										`⚠️ Rôle non reconnu: ${role}`
									);
							}
						} catch (err) {
							console.warn(
								`⚠️ Échec création rôle ${role}:`,
								getErrorMessage(err)
							);
							// Continue avec les autres rôles
						}
					}
				}

				// 4️⃣ Créer l'admin si privilèges définis ou rôle administrateur
				const hasAdminRole = userData.roles?.includes('administrateur');
				const hasAdminPrivileges =
					userData.privileges &&
					['advanced', 'super'].includes(userData.privileges);

				if (hasAdminRole || hasAdminPrivileges) {
					try {
						console.log("🔄 Étape 4: Création de l'admin...");
						const adminData = {
							id: userId,
							privileges: userData.privileges || 'basic',
						};
						await apiClient.post(
							API_ROUTES.ADMIN.CREATE,
							adminData
						);
						rolesCreated.push('administrateur');
						console.log('✅ Admin créé pour utilisateur:', userId);
					} catch (err) {
						console.warn(
							'⚠️ Échec création admin:',
							getErrorMessage(err)
						);
					}
				}

				// 5️⃣ Résultat final
				console.log(
					'🎉 Création complète terminée pour utilisateur:',
					userId
				);
				console.log('📋 Rôles créés:', rolesCreated);

				return {
					user: createdUser,
					rolesCreated: rolesCreated,
					success: true,
				};
			}, "Erreur lors de la création complète de l'utilisateur");
		},
		[handleAsync]
	);

	// Fonction de compatibilité pour le composant existant
	const createUserWithEmail = useCallback(
		async (userData: AdminUserCreationRequest) => {
			const result = await createCompleteUser(userData);
			// Retourne juste l'utilisateur pour compatibilité avec l'existant
			return result?.user || null;
		},
		[createCompleteUser]
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
				const response: any = await apiClient.get(
					API_ROUTES.SERVICE.INDEX
				);
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
	// GESTION COMMERÇANTS - FONCTIONNALITÉS DE VALIDATION
	// ========================================================================

	const getUnverifiedShopkeepers = useCallback(async () => {
		return handleAsync(async () => {
			const response: any = await apiClient.get(
				API_ROUTES.SHOPKEEPER.UNVERIFIED
			);
			return Array.isArray(response.commercants)
				? response.commercants
				: [];
		}, 'Erreur lors du chargement des commerçants non vérifiés');
	}, [handleAsync]);

	const getVerifiedShopkeepers = useCallback(async () => {
		return handleAsync(async () => {
			const response: any = await apiClient.get(
				API_ROUTES.SHOPKEEPER.VERIFIED
			);
			return Array.isArray(response.commercants)
				? response.commercants
				: [];
		}, 'Erreur lors du chargement des commerçants vérifiés');
	}, [handleAsync]);

	const verifyShopkeeper = useCallback(
		async (id: string) => {
			return handleAsync(async () => {
				const response = await apiClient.put(
					API_ROUTES.SHOPKEEPER.VERIFY(id)
				);
				return response;
			}, 'Erreur lors de la vérification du commerçant');
		},
		[handleAsync]
	);

	const rejectShopkeeper = useCallback(
		async (id: string) => {
			return handleAsync(async () => {
				const response = await apiClient.put(
					API_ROUTES.SHOPKEEPER.REJECT(id)
				);
				return response;
			}, 'Erreur lors du rejet du commerçant');
		},
		[handleAsync]
	);

	// ========================================================================
	// NOUVELLES FONCTIONNALITÉS - MODE MOCK/OPTIONNEL
	// ========================================================================

	const getAllPrestataires = useCallback(async () => {
		return handleAsync(async () => {
			try {
				// Essayer avec la route existante des prestataires
				const response: any = await apiClient.get(
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
				const response: any = await apiClient.get(
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
		createUserWithEmail, // Fonction de compatibilité
		createCompleteUser, // Nouvelle fonction complète
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

		// Gestion commerçants ✅ FONCTIONNEL
		getUnverifiedShopkeepers,
		getVerifiedShopkeepers,
		verifyShopkeeper,
		rejectShopkeeper,

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
