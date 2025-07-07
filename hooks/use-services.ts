import { useState, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { useToast } from './use-toast';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceData {
	id: number;
	name: string;
	description: string;
	price: number;
	pricing_type: 'fixed' | 'hourly' | 'custom';
	hourly_rate: number | null;
	location: string;
	status: string;
	availability_description: string | null;
	home_service: boolean;
	requires_materials: boolean;
	service_type_id: number | null;
	duration: number | null;
	is_active: boolean;
	prestataire_id: number | null;
	prestataireName: string;
	prestataireEmail: string;
	prestataireRating: number | null;
	serviceTypeName: string | null;
	created_at: string;
	updated_at: string;
}

export interface ServiceTypeData {
	id: number;
	name: string;
	description: string | null;
	is_active: boolean;
	service_count?: number;
}

export interface PrestataireData {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	service_type: string;
	rating: number | null;
	is_validated: boolean;
	state: string;
	created_at: string;
	updated_at: string;
	phone_number?: string;
	address?: string;
	city?: string;
}

export interface ServiceFormData {
	name: string;
	description: string;
	price: number;
	pricing_type: 'fixed' | 'hourly' | 'custom';
	hourly_rate: number | null;
	prestataire_id: string;
	service_type_id: string;
	location: string;
	duration: number | null;
	home_service: boolean;
	requires_materials: boolean;
	availability_description: string | null;
}

export interface ServiceTypeFormData {
	name: string;
	description: string;
	isActive: boolean;
}

export interface BookingData {
	id: number;
	clientId: number;
	serviceId: number;
	client_first_name: string;
	client_last_name: string;
	client_email: string;
	service_name: string;
	service_description: string;
	booking_date: string;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	total_price: number;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface BookingStats {
	total: number;
	pending: number;
	confirmed: number;
	completed: number;
	cancelled: number;
	monthly_revenue: number;
}

interface ApiResponse {
	id: number;
	[key: string]: any;
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useServices() {
	const [services, setServices] = useState<ServiceData[]>([]);
	const [serviceTypes, setServiceTypes] = useState<ServiceTypeData[]>([]);
	const [prestataires, setPrestataires] = useState<PrestataireData[]>([]);
	const [bookings, setBookings] = useState<BookingData[]>([]);
	const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const { toast } = useToast();

	// =============================================================================
	// FONCTIONS DE CHARGEMENT
	// =============================================================================

	const loadServices = useCallback(async () => {
		try {
			const response = await apiClient.get('/services');

			// La réponse est maintenant directement un tableau de services
			const servicesData = Array.isArray(response) ? response : [];

			const transformedServices: ServiceData[] = servicesData.map(
				(item: any) => ({
					id: item.id,
					name: item.name,
					description: item.description,
					price: parseFloat(item.price),
					pricing_type: item.pricing_type,
					hourly_rate: item.hourly_rate
						? parseFloat(item.hourly_rate)
						: null,
					location: item.location,
					status: item.status,
					availability_description: item.availability_description,
					home_service: item.home_service,
					requires_materials: item.requires_materials,
					duration: item.duration,
					is_active: item.isActive,
					service_type_id: null,
					prestataire_id: null,
					prestataireName: item.prestataireName,
					prestataireEmail: item.prestataireEmail,
					prestataireRating: item.prestataireRating
						? parseFloat(item.prestataireRating)
						: null,
					serviceTypeName: item.serviceTypeName,
					created_at: item.created_at || new Date().toISOString(),
					updated_at: item.updated_at || new Date().toISOString(),
				})
			);

			setServices(transformedServices);
		} catch (error) {
			console.error('Erreur chargement services:', error);
			setServices([]);
			toast({
				title: 'Erreur',
				description:
					'Impossible de charger les services. Veuillez réessayer.',
				variant: 'destructive',
			});
		}
	}, [toast]);

	const loadServiceTypes = useCallback(async () => {
		try {
			const response = (await apiClient.get(
				'/service-types?include_inactive=true'
			)) as any;

			// Transformer les données backend (snake_case) vers frontend (camelCase)
			const transformedServiceTypes: ServiceTypeData[] = Array.isArray(
				response.serviceTypes
			)
				? response.serviceTypes.map((item: any) => ({
						id: item.id,
						name: item.name,
						description: item.description,
						is_active: item.is_active, // Conversion snake_case -> camelCase
						service_count: item.service_count || 0, // Conversion snake_case -> camelCase
				  }))
				: [];

			setServiceTypes(transformedServiceTypes);
		} catch (error) {
			console.error('Erreur chargement types:', error);
			setServiceTypes([]);
		}
	}, []);

	const loadPrestataires = useCallback(async () => {
		try {
			const response = (await apiClient.get('/prestataires')) as any;
			console.log('🔍 Données prestataires du backend:', response);

			// Transformer les données backend vers l'interface frontend
			const prestatairesMapped: PrestataireData[] = Array.isArray(
				response.prestataires
			)
				? response.prestataires.map((item: any) => {
						console.log('🔍 Item prestataire:', item);
						console.log('🔍 User data:', item.user);

						// Conversion sécurisée du rating en number
						const rating = item.rating
							? parseFloat(item.rating)
							: undefined;

						// Formatage du serviceType pour un affichage plus convivial
						const formatServiceType = (type: string): string => {
							if (!type) return 'Non spécifié';

							const serviceTypes: Record<string, string> = {
								transport_personnes: 'Transport de personnes',
								services_menagers: 'Services ménagers',
								garde_enfants: "Garde d'enfants",
								livraison_colis: 'Livraison de colis',
								cours_particuliers: 'Cours particuliers',
								aide_personne_agee: 'Aide aux personnes âgées',
								jardinage: 'Jardinage',
								bricolage: 'Bricolage',
								cuisine: 'Cuisine et repas',
								pet_sitting: "Garde d'animaux",
							};

							return (
								serviceTypes[type] ||
								type
									.replace(/_/g, ' ')
									.replace(/\b\w/g, (l) => l.toUpperCase())
							);
						};

						return {
							id: item.id,
							first_name:
								item.user?.firstName ||
								item.user?.first_name ||
								'Prénom inconnu',
							last_name:
								item.user?.lastName ||
								item.user?.last_name ||
								'Nom inconnu',
							email: item.user?.email || 'Email non disponible',
							service_type: formatServiceType(
								item.serviceType ||
									item.service_type ||
									item.user?.specialization
							),
							rating: rating,
							is_validated: item.user?.state === 'open',
							state: item.user?.state || 'unknown',
							created_at: item.createdAt || item.created_at,
							updated_at: item.updatedAt || item.updated_at,
							phone_number:
								item.user?.phoneNumber ||
								item.user?.phone_number,
							address: item.user?.address,
							city: item.user?.city,
						};
				  })
				: [];

			console.log('📋 Données transformées:', prestatairesMapped);
			setPrestataires(prestatairesMapped);
		} catch (error) {
			console.error('Erreur chargement prestataires:', error);
			setPrestataires([]);
		}
	}, []);

	const loadAllData = useCallback(async () => {
		setRefreshing(true);
		try {
			// Charger d'abord les types de services pour que les services puissent les utiliser
			await loadServiceTypes();
			// Ensuite charger les services et prestataires en parallèle
			await Promise.all([loadServices(), loadPrestataires()]);
		} finally {
			setRefreshing(false);
		}
	}, [loadServices, loadServiceTypes, loadPrestataires]);

	// =============================================================================
	// GESTION DES SERVICES
	// =============================================================================

	const createService = async (
		serviceData: ServiceFormData
	): Promise<boolean> => {
		try {
			const response = (await apiClient.post('/services', {
				name: serviceData.name,
				description: serviceData.description,
				price: serviceData.price.toString(),
				pricing_type: serviceData.pricing_type,
				hourly_rate: serviceData.hourly_rate?.toString() || null,
				location: serviceData.location,
				duration: serviceData.duration,
				home_service: serviceData.home_service,
				requires_materials: serviceData.requires_materials,
				availability_description: serviceData.availability_description,
				prestataire_id: serviceData.prestataire_id,
				service_type_id: serviceData.service_type_id,
			})) as ApiResponse;

			if (response.id) {
				await loadServices();
				return true;
			}
			return false;
		} catch (error) {
			console.error('Erreur lors de la création du service:', error);
			return false;
		}
	};

	const updateService = async (
		serviceId: number,
		serviceData: ServiceFormData
	): Promise<boolean> => {
		try {
			const response = (await apiClient.put(`/services/${serviceId}`, {
				name: serviceData.name,
				description: serviceData.description,
				price: serviceData.price.toString(),
				pricing_type: serviceData.pricing_type,
				hourly_rate: serviceData.hourly_rate?.toString() || null,
				location: serviceData.location,
				duration: serviceData.duration,
				home_service: serviceData.home_service,
				requires_materials: serviceData.requires_materials,
				availability_description: serviceData.availability_description,
				prestataire_id: serviceData.prestataire_id,
				service_type_id: serviceData.service_type_id,
			})) as ApiResponse;

			if (response.id) {
				await loadServices();
				return true;
			}
			return false;
		} catch (error) {
			console.error('Erreur lors de la mise à jour du service:', error);
			return false;
		}
	};

	const toggleServiceStatus = useCallback(
		async (serviceId: number, currentStatus: boolean) => {
			try {
				await apiClient.put(`/services/${serviceId}`, {
					is_active: !currentStatus,
				});

				toast({
					title: 'Statut modifié',
					description: `Service ${
						!currentStatus ? 'activé' : 'désactivé'
					} avec succès.`,
				});

				await loadServices();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de modifier le statut: ${errorMessage}`,
				});
			}
		},
		[loadServices, toast]
	);

	const deleteService = useCallback(
		async (serviceId: number) => {
			try {
				await apiClient.delete(`/services/${serviceId}`);

				toast({
					title: 'Service supprimé',
					description: 'Le service a été supprimé avec succès.',
				});

				await loadServices();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de supprimer le service: ${errorMessage}`,
				});
			}
		},
		[loadServices, toast]
	);

	// =============================================================================
	// GESTION DES TYPES DE SERVICES
	// =============================================================================

	const createServiceType = useCallback(
		async (serviceTypeData: ServiceTypeFormData) => {
			setLoading(true);
			try {
				await apiClient.post('/service-types', serviceTypeData);

				toast({
					title: 'Type de service créé',
					description: 'Le type de service a été créé avec succès.',
				});

				await loadServiceTypes();
				return true;
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de créer le type: ${errorMessage}`,
				});
				return false;
			} finally {
				setLoading(false);
			}
		},
		[loadServiceTypes, toast]
	);

	const updateServiceType = useCallback(
		async (serviceTypeId: number, serviceTypeData: ServiceTypeFormData) => {
			setLoading(true);
			try {
				await apiClient.put(
					`/service-types/${serviceTypeId}`,
					serviceTypeData
				);

				toast({
					title: 'Type de service mis à jour',
					description:
						'Le type de service a été modifié avec succès.',
				});

				await loadServiceTypes();
				return true;
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de modifier le type: ${errorMessage}`,
				});
				return false;
			} finally {
				setLoading(false);
			}
		},
		[loadServiceTypes, toast]
	);

	const toggleServiceTypeStatus = useCallback(
		async (serviceTypeId: number) => {
			try {
				await apiClient.put(
					`/service-types/${serviceTypeId}/toggle-status`
				);

				toast({
					title: 'Type modifié',
					description: 'Le statut du type de service a été modifié.',
				});

				await loadServiceTypes();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de modifier le type: ${errorMessage}`,
				});
			}
		},
		[loadServiceTypes, toast]
	);

	const deleteServiceType = useCallback(
		async (serviceTypeId: number) => {
			try {
				await apiClient.delete(`/service-types/${serviceTypeId}`);

				toast({
					title: 'Type supprimé',
					description:
						'Le type de service a été supprimé avec succès.',
				});

				await loadServiceTypes();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de supprimer le type de service: ${errorMessage}`,
				});
			}
		},
		[loadServiceTypes, toast]
	);

	// =============================================================================
	// GESTION DES AVIS
	// =============================================================================

	const loadPrestataireReviews = useCallback(
		async (prestataireId: number) => {
			try {
				const response = (await apiClient.get(
					`/ratings/prestataire/${prestataireId}`
				)) as any;
				return response.reviews || [];
			} catch (error) {
				console.error('Erreur chargement avis:', error);
				return [];
			}
		},
		[]
	);

	// =============================================================================
	// GESTION DES BOOKINGS/RÉSERVATIONS
	// =============================================================================

	const loadBookings = useCallback(
		async (status?: string, page = 1, limit = 20) => {
			try {
				const params = new URLSearchParams({
					page: page.toString(),
					limit: limit.toString(),
				});
				if (status && status !== 'all') {
					params.append('status', status);
				}

				const response = (await apiClient.get(
					`/bookings?${params.toString()}`
				)) as any;
				setBookings(
					Array.isArray(response.bookings) ? response.bookings : []
				);
				return response.pagination || null;
			} catch (error) {
				console.error('Erreur chargement bookings:', error);
				setBookings([]);
				return null;
			}
		},
		[]
	);

	const loadBookingStats = useCallback(async () => {
		try {
			const response = (await apiClient.get('/bookings/stats')) as any;
			setBookingStats(response.stats || null);
		} catch (error) {
			console.error('Erreur chargement stats bookings:', error);
			setBookingStats(null);
		}
	}, []);

	const updateBookingStatus = useCallback(
		async (bookingId: number, status: string, notes?: string) => {
			try {
				await apiClient.put(`/bookings/${bookingId}/status`, {
					status,
					notes,
				});

				toast({
					title: 'Statut mis à jour',
					description: `Réservation ${status} avec succès.`,
				});

				await loadBookings();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de modifier le statut: ${errorMessage}`,
				});
			}
		},
		[loadBookings, toast]
	);

	const getBookingDetails = useCallback(
		async (bookingId: number) => {
			try {
				const response = (await apiClient.get(
					`/bookings/${bookingId}`
				)) as any;
				return response.booking || null;
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				toast({
					variant: 'destructive',
					title: 'Erreur',
					description: `Impossible de charger les détails: ${errorMessage}`,
				});
				return null;
			}
		},
		[toast]
	);

	return {
		// Données
		services,
		serviceTypes,
		prestataires,
		bookings,
		bookingStats,
		loading,
		refreshing,

		// Actions de chargement
		loadAllData,
		loadServices,
		loadServiceTypes,
		loadPrestataires,

		// Actions des services
		createService,
		updateService,
		toggleServiceStatus,
		deleteService,

		// Actions des types de services
		createServiceType,
		updateServiceType,
		toggleServiceTypeStatus,
		deleteServiceType,

		// Actions des avis
		loadPrestataireReviews,

		// Actions des bookings
		loadBookings,
		loadBookingStats,
		updateBookingStatus,
		getBookingDetails,
	};
}
