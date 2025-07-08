import { useState, useCallback } from 'react';
import {
	API_CONFIG,
	ANNOUNCEMENT_ROUTES,
	ADMIN_ROUTES,
	SHOPKEEPER_ROUTES,
} from '@/src/lib/api-routes';

// =============================================================================
// TYPES
// =============================================================================

export interface Annonce {
	id: string; // ✅ Changé en string pour supporter les préfixes
	title: string;
	description: string;
	type: 'transport_colis' | 'course';
	status:
		| 'active'
		| 'pending'
		| 'completed'
		| 'cancelled'
		| 'pending_acceptance'
		| 'accepted'
		| 'in_transit'
		| 'delivered';
	start_location: string;
	end_location: string;
	price: number;
	desired_date: string;
	created_at: string;
	priority: boolean;
	// Données utilisateur enrichies
	utilisateur?: {
		id: number;
		first_name: string;
		last_name: string;
		email?: string; // ✅ Optionnel
		phone_number?: string;
		client?: any;
		commercant?: any;
	};
	userName?: string;
	userType?: 'commercant' | 'client';
	source?: 'traditional' | 'shopkeeper'; // ✅ Nouveau champ pour identifier la source
}

// =============================================================================
// CLIENT API SIMPLE
// =============================================================================

class AnnouncementsApiClient {
	private getAuthHeaders(): HeadersInit {
		const token =
			localStorage.getItem('authToken') ||
			sessionStorage.getItem('authToken');
		return {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` }),
		};
	}

	async get<T>(endpoint: string): Promise<T> {
		const url = `${API_CONFIG.BASE_URL}${endpoint}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	}

	async deleteAnnouncement(id: string): Promise<void> {
		const url = `${API_CONFIG.BASE_URL}${ANNOUNCEMENT_ROUTES.DELETE(id)}`;
		const response = await fetch(url, {
			method: 'DELETE',
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	}

	async delete<T>(endpoint: string): Promise<T> {
		const url = `${API_CONFIG.BASE_URL}${endpoint}`;
		const response = await fetch(url, {
			method: 'DELETE',
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		// Pour les DELETE, le contenu peut être vide
		const text = await response.text();
		return text ? JSON.parse(text) : ({} as T);
	}
}

const apiClient = new AnnouncementsApiClient();

// =============================================================================
// HOOK ANNOUNCEMENTS
// =============================================================================

export function useAnnouncements() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// =============================================================================
	// RÉCUPÉRATION DES ANNONCES TRADITIONNELLES
	// =============================================================================

	const getTraditionalAnnouncements = async (): Promise<Annonce[]> => {
		try {
			console.log('🔍 Récupération des annonces traditionnelles...');

			// Essayer d'abord l'endpoint admin, puis fallback sur l'ancien
			let response: any;
			let useAdminFormat = false;

			try {
				// Utiliser l'endpoint admin qui retourne plus d'informations utilisateur
				response = await apiClient.get<any>(
					ADMIN_ROUTES.ADMIN_ANNONCES
				);
				useAdminFormat = true;
				console.log('📋 Réponse annonces admin:', response);
			} catch (adminError) {
				console.warn(
					"⚠️ Endpoint admin non disponible, utilisation de l'endpoint traditionnel:",
					adminError
				);
				// Fallback sur l'ancien endpoint
				response = await apiClient.get<any>(ANNOUNCEMENT_ROUTES.ALL);
				useAdminFormat = false;
				console.log('📋 Réponse annonces traditionnelles:', response);
			}

			let annoncesData: any[] = [];
			if (
				response &&
				response.annonces &&
				Array.isArray(response.annonces)
			) {
				annoncesData = response.annonces;
			} else if (Array.isArray(response)) {
				annoncesData = response;
			}

			if (annoncesData.length === 0) {
				console.log('⚠️ Aucune annonce traditionnelle trouvée');
				return [];
			}

			// Transformation selon le format disponible
			const transformedAnnounces = annoncesData.map((item) => {
				if (useAdminFormat) {
					// Debug log pour comprendre la structure admin
					console.log('🔍 Structure annonce admin:', {
						id: item.id,
						title: item.title,
						user: item.user,
						user_keys: item.user ? Object.keys(item.user) : 'null',
						hasUser: !!item.user,
						first_name: item.user?.firstName,
						last_name: item.user?.lastName,
						fullData: item,
					});

					return transformAdminAnnounce(item);
				} else {
					// Debug log pour comprendre la structure traditionnelle
					console.log('🔍 Structure annonce traditionnelle:', {
						id: item.id,
						title: item.title,
						utilisateur: item.utilisateur,
						utilisateur_keys: item.utilisateur
							? Object.keys(item.utilisateur)
							: 'null',
						hasUtilisateur: !!item.utilisateur,
						first_name: item.utilisateur?.first_name,
						last_name: item.utilisateur?.last_name,
						fullData: item,
					});

					return transformTraditionalAnnounce(item);
				}
			});

			console.log(
				`✅ ${transformedAnnounces.length} annonces ${
					useAdminFormat ? 'admin' : 'traditionnelles'
				} transformées`
			);
			return transformedAnnounces;
		} catch (error) {
			console.error('❌ Erreur récupération annonces:', error);
			throw error;
		}
	};

	// =============================================================================
	// RÉCUPÉRATION DES SHOPKEEPER DELIVERIES
	// =============================================================================

	const getShopkeeperDeliveries = async (): Promise<Annonce[]> => {
		try {
			console.log('🔍 Récupération des livraisons de commerçants...');
			const response = await apiClient.get<any>(
				ADMIN_ROUTES.SHOPKEEPER_DELIVERIES
			);
			console.log('📋 Réponse shopkeeper deliveries:', response);

			let deliveriesData: any[] = [];
			if (Array.isArray(response)) {
				deliveriesData = response;
			} else if (response && Array.isArray(response.data)) {
				deliveriesData = response.data;
			}

			if (deliveriesData.length === 0) {
				console.log('⚠️ Aucune livraison de commerçant trouvée');
				return [];
			}

			// Transformation des shopkeeper deliveries
			const transformedDeliveries = deliveriesData.map(
				transformShopkeeperDelivery
			);

			console.log(
				`✅ ${transformedDeliveries.length} livraisons de commerçants transformées`
			);
			return transformedDeliveries;
		} catch (error) {
			console.error(
				'❌ Erreur récupération livraisons commerçants:',
				error
			);
			throw error;
		}
	};

	// =============================================================================
	// SUPPRESSION DES ANNONCES
	// =============================================================================

	/**
	 * Supprime une annonce traditionnelle (client)
	 */
	const deleteAnnouncement = useCallback(
		async (id: string): Promise<boolean> => {
			setLoading(true);
			setError(null);

			try {
				console.log("🗑️ Suppression de l'annonce traditionnelle:", id);

				// Extraire l'ID réel (enlever le préfixe si présent)
				const realId = id.startsWith('traditional_')
					? id.replace('traditional_', '')
					: id;

				// Appeler l'API de suppression
				await apiClient.deleteAnnouncement(realId);

				console.log('✅ Annonce supprimée avec succès:', realId);
				return true;
			} catch (error) {
				console.error('❌ Erreur suppression annonce:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Erreur inconnue';
				setError(`Erreur lors de la suppression: ${errorMessage}`);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	/**
	 * Supprime une livraison de commerçant (shopkeeper delivery)
	 */
	const deleteShopkeeperDelivery = useCallback(
		async (id: string): Promise<boolean> => {
			setLoading(true);
			setError(null);

			try {
				console.log('🗑️ Suppression de la livraison commerçant:', id);

				// Extraire l'ID réel (enlever le préfixe si présent)
				const realId = id.startsWith('shopkeeper_')
					? id.replace('shopkeeper_', '')
					: id;

				// Appeler l'API de suppression des livraisons de commerçants via la route admin
				await apiClient.delete(
					ADMIN_ROUTES.DELETE_SHOPKEEPER_DELIVERY(realId)
				);

				console.log(
					'✅ Livraison commerçant supprimée avec succès:',
					realId
				);
				return true;
			} catch (error) {
				console.error(
					'❌ Erreur suppression livraison commerçant:',
					error
				);
				const errorMessage =
					error instanceof Error ? error.message : 'Erreur inconnue';
				setError(`Erreur lors de la suppression: ${errorMessage}`);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	/**
	 * Supprime une annonce en déterminant automatiquement le type
	 */
	const deleteAnnounceSmart = useCallback(
		async (annonce: Annonce): Promise<boolean> => {
			if (annonce.source === 'shopkeeper') {
				return await deleteShopkeeperDelivery(annonce.id);
			} else {
				return await deleteAnnouncement(annonce.id);
			}
		},
		[deleteAnnouncement, deleteShopkeeperDelivery]
	);

	// =============================================================================
	// UTILITAIRES DE TRANSFORMATION
	// =============================================================================

	/**
	 * Mappe les statuts spécifiques des shopkeeper deliveries vers les statuts standards
	 */
	const mapShopkeeperStatus = (
		status: string
	): 'active' | 'pending' | 'completed' | 'cancelled' => {
		switch (status) {
			case 'pending_acceptance':
				return 'pending';
			case 'accepted':
			case 'in_transit':
				return 'active';
			case 'delivered':
				return 'completed';
			case 'cancelled':
				return 'cancelled';
			default:
				return 'pending'; // Statut par défaut
		}
	};

	// =============================================================================
	// TRANSFORMATION DES ANNONCES ADMIN (FORMAT getAdminAnnonces)
	// =============================================================================

	const transformAdminAnnounce = (item: any): Annonce => {
		// Gérer les dates de façon sécurisée
		const createdAt =
			item.createdAt || item.created_at || new Date().toISOString();
		const desiredDate = item.desiredDate || item.desired_date || createdAt;

		// Déterminer le type d'utilisateur selon le format admin
		let userType: 'commercant' | 'client' = 'client';
		if (item.user) {
			// Le format admin retourne user.type directement
			if (item.user.type === 'commercant') {
				userType = 'commercant';
			}
		}

		// Récupérer le nom d'utilisateur selon le format admin
		let userName = 'Utilisateur inconnu';
		if (item.user) {
			const user = item.user;

			// Le format admin utilise firstName/lastName
			const firstName = user.firstName || '';
			const lastName = user.lastName || '';

			if (firstName || lastName) {
				userName = `${firstName} ${lastName}`.trim();
			} else if (user.email) {
				// Si pas de nom, utiliser l'email comme fallback
				userName = user.email.split('@')[0];
			}

			console.log('🔍 Debug userName admin:', {
				original: user,
				firstName,
				lastName,
				final: userName,
			});
		}

		return {
			id: `traditional_${item.id}`, // ✅ Préfixe unique pour éviter conflits
			title: item.title || 'Annonce sans titre',
			description: item.description || 'Aucune description',
			type: item.type || 'transport_colis',
			status: item.status || 'pending',
			start_location:
				item.startLocation ||
				item.start_location ||
				'Adresse non spécifiée',
			end_location:
				item.endLocation ||
				item.end_location ||
				'Adresse non spécifiée',
			price: Number(item.price) || 0,
			desired_date: desiredDate,
			created_at: createdAt,
			priority: Boolean(item.priority),
			// Données utilisateur enrichies (format admin)
			utilisateur: {
				id: item.user?.id || 0,
				first_name: item.user?.firstName || '',
				last_name: item.user?.lastName || '',
				email: item.user?.email || '',
				commercant: userType === 'commercant',
			},
			userName: userName,
			userType: userType,
			source: 'traditional', // ✅ Source pour déboguer
		};
	};

	// =============================================================================
	// TRANSFORMATION DES ANNONCES TRADITIONNELLES (FORMAT getAllAnnonces - BACKUP)
	// =============================================================================

	const transformTraditionalAnnounce = (item: any): Annonce => {
		// Gérer les dates de façon sécurisée
		const createdAt =
			item.created_at || item.createdAt || new Date().toISOString();
		const desiredDate = item.desired_date || item.desiredDate || createdAt;

		// Déterminer le type d'utilisateur de façon plus robuste
		let userType: 'commercant' | 'client' = 'client';
		if (item.utilisateur) {
			// Vérifier s'il y a une relation commercant
			if (
				item.utilisateur.commercant ||
				item.utilisateur.is_commercant ||
				item.utilisateur.type === 'commercant'
			) {
				userType = 'commercant';
			}
		}

		// Récupérer le nom d'utilisateur de façon plus robuste
		let userName = 'Utilisateur inconnu';
		if (item.utilisateur) {
			const user = item.utilisateur;

			// Essayer différents formats de noms
			const firstName =
				user.first_name || user.firstName || user.prenom || '';
			const lastName = user.last_name || user.lastName || user.nom || '';

			if (firstName || lastName) {
				userName = `${firstName} ${lastName}`.trim();
			} else if (user.email) {
				// Si pas de nom, utiliser l'email comme fallback
				userName = user.email.split('@')[0];
			}

			console.log('🔍 Debug userName:', {
				original: user,
				firstName,
				lastName,
				final: userName,
			});
		}

		return {
			id: `traditional_${item.id}`, // ✅ Préfixe unique pour éviter conflits
			title: item.title || 'Annonce sans titre',
			description: item.description || 'Aucune description',
			type: item.type || 'transport_colis',
			status: item.status || 'pending',
			start_location:
				item.start_location ||
				item.startLocation ||
				'Adresse non spécifiée',
			end_location:
				item.end_location ||
				item.endLocation ||
				'Adresse non spécifiée',
			price: Number(item.price) || 0,
			desired_date: desiredDate,
			created_at: createdAt,
			priority: Boolean(item.priority),
			// Données utilisateur enrichies
			utilisateur: item.utilisateur,
			userName: userName,
			userType: userType,
			source: 'traditional', // ✅ Source pour déboguer
		};
	};

	// =============================================================================
	// TRANSFORMATION DES SHOPKEEPER DELIVERIES
	// =============================================================================

	const transformShopkeeperDelivery = (item: any): Annonce => {
		return {
			id: `shopkeeper_${item.id}`, // ✅ Préfixe unique pour éviter conflits
			title: `Livraison: ${item.customer_name}`,
			description: item.products_summary || 'Livraison de commerçant',
			type: 'transport_colis' as const,
			status: mapShopkeeperStatus(item.status),
			start_location: item.pickup_address || 'Adresse commerçant',
			end_location: item.customer_address || 'Adresse client',
			price: Number(item.price) || 0,
			desired_date: item.created_at,
			created_at: item.created_at,
			priority: false,
			// Données utilisateur (commerçant)
			utilisateur: {
				id: item.commercant_id,
				first_name: item.commercant_first_name || 'Commerçant',
				last_name: item.commercant_last_name || '',
				commercant: true,
			},
			userName: item.commercant_first_name
				? `${item.commercant_first_name} ${
						item.commercant_last_name || ''
				  }`.trim()
				: 'Commerçant inconnu',
			userType: 'commercant' as const,
			source: 'shopkeeper', // ✅ Source pour déboguer
		};
	};

	// =============================================================================
	// RÉCUPÉRATION COMBINÉE
	// =============================================================================

	const getAnnouncements = useCallback(async (): Promise<Annonce[]> => {
		setLoading(true);
		setError(null);

		try {
			console.log('🔍 Récupération de toutes les annonces...');

			// Récupérer les deux types de données de manière plus robuste
			const traditionalAnnouncementsPromise =
				getTraditionalAnnouncements()
					.then((data) => {
						console.log(
							`✅ Annonces traditionnelles: ${data.length} récupérées`
						);
						return data;
					})
					.catch((error) => {
						console.warn(
							'⚠️ Échec récupération annonces traditionnelles:',
							error.message
						);
						return []; // Retourner un tableau vide en cas d'erreur
					});

			const shopkeeperDeliveriesPromise = getShopkeeperDeliveries()
				.then((data) => {
					console.log(
						`✅ Livraisons commerçants: ${data.length} récupérées`
					);
					return data;
				})
				.catch((error) => {
					console.warn(
						'⚠️ Échec récupération livraisons commerçants:',
						error.message
					);
					return []; // Retourner un tableau vide en cas d'erreur
				});

			// Attendre les deux requêtes (même si l'une échoue)
			const [traditionalAnnouncements, shopkeeperDeliveries] =
				await Promise.all([
					traditionalAnnouncementsPromise,
					shopkeeperDeliveriesPromise,
				]);

			// Fusionner et trier par date de création (plus récent en premier)
			const allAnnouncements = [
				...traditionalAnnouncements,
				...shopkeeperDeliveries,
			].sort(
				(a, b) =>
					new Date(b.created_at).getTime() -
					new Date(a.created_at).getTime()
			);

			console.log(
				`✅ Total récupéré: ${allAnnouncements.length} annonces (${traditionalAnnouncements.length} traditionnelles + ${shopkeeperDeliveries.length} livraisons)`
			);

			return allAnnouncements;
		} catch (err) {
			console.error('❌ Erreur lors du chargement des annonces:', err);
			const errorMessage =
				err instanceof Error ? err.message : 'Erreur inconnue';
			setError(errorMessage);
			return []; // Retourner un tableau vide plutôt que de lancer l'erreur
		} finally {
			setLoading(false);
		}
	}, []);

	// =============================================================================
	// UTILITAIRES
	// =============================================================================

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const retry = useCallback(async () => {
		return await getAnnouncements();
	}, [getAnnouncements]);

	return {
		// État
		loading,
		error,

		// Actions
		getAnnouncements,
		deleteAnnouncement,
		deleteShopkeeperDelivery,
		deleteAnnounceSmart,
		clearError,
		retry,
	};
}
