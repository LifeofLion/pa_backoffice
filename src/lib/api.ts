import { User } from '@/src/types';
import {
	API_CONFIG,
	WALLET_ROUTES,
	STRIPE_ROUTES,
	AUTH_ROUTES,
	USER_ROUTES,
	ANNOUNCEMENT_ROUTES,
	DELIVERY_ROUTES,
	COMPLAINT_ROUTES,
	MESSAGE_ROUTES,
	SERVICE_ROUTES,
	SERVICE_TYPE_ROUTES,
	PACKAGE_ROUTES,
	TRACKING_ROUTES,
} from './api-routes';

// Regroupement des routes pour compatibilité
const API_ROUTES = {
	AUTH: AUTH_ROUTES,
	USER: USER_ROUTES,
	ANNOUNCEMENT: ANNOUNCEMENT_ROUTES,
	DELIVERY: DELIVERY_ROUTES,
	COMPLAINT: COMPLAINT_ROUTES,
	MESSAGE: MESSAGE_ROUTES,
	SERVICE: SERVICE_ROUTES,
	PACKAGE: PACKAGE_ROUTES,
	TRACKING: TRACKING_ROUTES,
	STRIPE: STRIPE_ROUTES,
	WALLET: WALLET_ROUTES,
};

// =============================================================================
// CLASSE D'ERREUR API PERSONNALISÉE
// =============================================================================

export class ApiErrorException extends Error {
	public status: number;
	public data?: any;

	constructor(status: number, message: string, data?: any) {
		super(message);
		this.name = 'ApiErrorException';
		this.status = status;
		this.data = data;
	}
}

// =============================================================================
// CLIENT API PRINCIPAL
// =============================================================================

class ApiClient {
	private baseURL: string;
	private token: string | null = null;

	constructor(baseURL: string) {
		this.baseURL = baseURL;
		this.initializeToken();
	}

	/**
	 * Initialise le token depuis le localStorage/sessionStorage
	 */
	private initializeToken(): void {
		if (typeof window !== 'undefined') {
			this.token =
				localStorage.getItem('authToken') ||
				sessionStorage.getItem('authToken');
		}
	}

	/**
	 * Définit le token d'authentification
	 */
	setToken(token: string): void {
		this.token = token;
	}

	/**
	 * Supprime le token d'authentification
	 */
	clearToken(): void {
		this.token = null;
		if (typeof window !== 'undefined') {
			localStorage.removeItem('authToken');
			sessionStorage.removeItem('authToken');
		}
	}

	/**
	 * Effectue une requête HTTP générique
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		// Ajouter le token d'auth si disponible
		if (this.token) {
			(
				headers as Record<string, string>
			).Authorization = `Bearer ${this.token}`;
		}

		const config: RequestInit = {
			...options,
			headers,
			credentials: 'include',
		};

		try {
			const response = await fetch(url, config);

			// Gestion des erreurs HTTP
			if (!response.ok) {
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				let errorData = null;

				try {
					errorData = await response.json();
					console.log('🔴 Backend error response:', errorData);

					// Améliorer l'extraction du message d'erreur selon le format backend
					if (typeof errorData === 'string') {
						errorMessage = errorData;
					} else if (errorData && typeof errorData === 'object') {
						// Essayer plusieurs formats courants d'erreur backend
						errorMessage =
							errorData.message ||
							errorData.error_message ||
							errorData.error ||
							errorData.errors?.[0]?.message ||
							(Array.isArray(errorData.errors)
								? errorData.errors.join(', ')
								: null) ||
							JSON.stringify(errorData);
					}
				} catch (parseError) {
					console.log('🔴 Could not parse error JSON:', parseError);
					// Si on ne peut pas parser le JSON, on garde le message HTTP
				}

				console.log('🔴 Extracted error message:', errorMessage);
				throw new ApiErrorException(
					response.status,
					errorMessage,
					errorData
				);
			}

			// Retourner la réponse JSON
			return await response.json();
		} catch (error) {
			if (error instanceof ApiErrorException) {
				throw error;
			}

			// Erreur réseau ou autre
			throw new ApiErrorException(0, 'Erreur de connexion au serveur');
		}
	}

	// ==========================================================================
	// MÉTHODES HTTP GÉNÉRIQUES
	// ==========================================================================

	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	async post<T>(endpoint: string, data?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T>(endpoint: string, data?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T>(endpoint: string, data?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}

	/**
	 * Upload de fichiers avec FormData
	 */
	async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;

		const headers: HeadersInit = {};
		if (this.token) {
			(
				headers as Record<string, string>
			).Authorization = `Bearer ${this.token}`;
		}

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: formData,
			credentials: 'include',
		});

		if (!response.ok) {
			let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
			try {
				const errorData = await response.json();
				errorMessage = errorData.message || errorMessage;
			} catch {
				// Ignore JSON parse errors
			}
			throw new ApiErrorException(response.status, errorMessage);
		}

		return await response.json();
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES À L'AUTHENTIFICATION (ROUTES CENTRALISÉES)
	// ==========================================================================

	async login(
		email: string,
		password: string
	): Promise<{ token: string; user: User }> {
		const response = await this.post<{ token: string; user: User }>(
			API_ROUTES.AUTH.LOGIN,
			{
				email,
				password,
			}
		);

		// Stocker automatiquement le token
		if (response.token) {
			this.setToken(response.token);
		}

		return response;
	}



	async getCurrentUser(): Promise<User> {
		return this.get<User>(API_ROUTES.AUTH.ME);
	}

	async logout(): Promise<void> {
		try {
			await this.post(API_ROUTES.AUTH.LOGOUT);
		} finally {
			// Toujours nettoyer le token, même en cas d'erreur
			this.clearToken();
		}
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX ANNONCES (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getAnnouncements(): Promise<{ annonces: any[] }> {
		return this.get<{ annonces: any[] }>(API_ROUTES.ANNOUNCEMENT.ALL);
	}

	async getUserAnnouncements(userId: string): Promise<{ annonces: any[] }> {
		return this.get<{ annonces: any[] }>(
			API_ROUTES.ANNOUNCEMENT.BY_USER(userId)
		);
	}

	async getAnnouncement(id: string): Promise<{ annonce: any }> {
		return this.get<{ annonce: any }>(API_ROUTES.ANNOUNCEMENT.BY_ID(id));
	}

	async createAnnouncement(data: any): Promise<{ annonce: any }> {
		return this.post<{ annonce: any }>(
			API_ROUTES.ANNOUNCEMENT.CREATE,
			data
		);
	}

	async createAnnouncementWithImage(
		data: any,
		imageFile?: File
	): Promise<{ annonce: any }> {
		// Si pas d'image, utiliser la méthode JSON normale
		if (!imageFile) {
			return this.createAnnouncement(data);
		}

		// Créer FormData pour l'upload d'image
		const formData = new FormData();

		// Ajouter toutes les données de l'annonce
		Object.keys(data).forEach((key) => {
			const value = data[key];
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					// Pour les arrays (tags), ajouter chaque élément séparément
					value.forEach((item, index) => {
						formData.append(`${key}[${index}]`, item.toString());
					});
				} else {
					formData.append(key, value.toString());
				}
			}
		});

		// Ajouter l'image
		formData.append('image', imageFile);

		return this.uploadFile<{ annonce: any }>(
			API_ROUTES.ANNOUNCEMENT.CREATE,
			formData
		);
	}

	async updateAnnouncement(id: string, data: any): Promise<{ annonce: any }> {
		return this.put<{ annonce: any }>(
			API_ROUTES.ANNOUNCEMENT.UPDATE(id),
			data
		);
	}

	async updateAnnouncementWithImage(
		id: string,
		data: any,
		imageFile?: File
	): Promise<{ annonce: any }> {
		// Si pas d'image, utiliser la méthode JSON normale
		if (!imageFile) {
			return this.updateAnnouncement(id, data);
		}

		// Créer FormData pour l'upload d'image
		const formData = new FormData();

		// Ajouter toutes les données de l'annonce
		Object.keys(data).forEach((key) => {
			const value = data[key];
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					// Pour les arrays (tags), ajouter chaque élément séparément
					value.forEach((item, index) => {
						formData.append(`${key}[${index}]`, item.toString());
					});
				} else {
					formData.append(key, value.toString());
				}
			}
		});

		// Ajouter l'image
		formData.append('image', imageFile);

		return this.uploadFile<{ annonce: any }>(
			API_ROUTES.ANNOUNCEMENT.UPDATE(id),
			formData
		);
	}

	async deleteAnnouncement(id: string): Promise<void> {
		return this.delete<void>(API_ROUTES.ANNOUNCEMENT.BY_ID(id));
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX LIVRAISONS (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getDelivery(id: string): Promise<any> {
		return this.get<any>(API_ROUTES.DELIVERY.BY_ID(id));
	}

	async updateDelivery(id: string, data: any): Promise<any> {
		return this.put<any>(API_ROUTES.DELIVERY.UPDATE(id), data);
	}

	async getClientDeliveries(clientId: string): Promise<any[]> {
		console.log(
			'🔍 API call: getClientDeliveries with clientId:',
			clientId
		);
		console.log(
			'🔍 URL construite:',
			API_ROUTES.DELIVERY.BY_CLIENT(clientId)
		);

		const response = await this.get<any>(
			API_ROUTES.DELIVERY.BY_CLIENT(clientId)
		);
		console.log('🔍 Raw API response:', response);
		console.log(
			'🔍 Response structure:',
			JSON.stringify(response, null, 2)
		);

		// Le backend retourne { livraisons: { data: [...] } } avec pagination
		if (
			response.livraisons?.data &&
			Array.isArray(response.livraisons.data)
		) {
			console.log(
				'✅ Found livraisons.data with length:',
				response.livraisons.data.length
			);
			return response.livraisons.data;
		}
		// Si pas de pagination, retourner directement le tableau
		if (Array.isArray(response.livraisons)) {
			console.log(
				'✅ Found livraisons array with length:',
				response.livraisons.length
			);
			return response.livraisons;
		}
		// Nouvelle vérification: si response.success et response.data
		if (response.success && response.data?.data) {
			console.log(
				'✅ Found success response with data.data:',
				response.data.data.length
			);
			return response.data.data;
		}
		// Autre possibilité: response directe est un array
		if (Array.isArray(response)) {
			console.log(
				'✅ Response is direct array with length:',
				response.length
			);
			return response;
		}

		console.log('⚠️ No livraisons found, returning empty array');
		console.log('🔍 Available response keys:', Object.keys(response || {}));
		// Fallback: retourner un tableau vide
		return [];
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX RÉCLAMATIONS (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getComplaints(): Promise<any[]> {
		const response = await this.get<{ complaints: any[] }>(
			API_ROUTES.COMPLAINT.INDEX
		);
		return Array.isArray(response.complaints) ? response.complaints : [];
	}

	async getComplaint(id: string): Promise<any> {
		const response = await this.get<{ complaint: any }>(
			API_ROUTES.COMPLAINT.BY_ID(id)
		);
		return response.complaint;
	}

	async getUserComplaints(userId: string): Promise<any[]> {
		const response = await this.get<{ complaints: any[] }>(
			API_ROUTES.COMPLAINT.BY_USER(userId)
		);
		return Array.isArray(response.complaints) ? response.complaints : [];
	}

	async createComplaint(data: any): Promise<any> {
		const response = await this.post<{ complaint: any }>(
			API_ROUTES.COMPLAINT.CREATE,
			data
		);
		return response.complaint;
	}

	async updateComplaint(id: string, data: any): Promise<any> {
		const response = await this.put<{ complaint: any }>(
			API_ROUTES.COMPLAINT.UPDATE(id),
			data
		);
		return response.complaint;
	}

	async deleteComplaint(id: string): Promise<void> {
		return this.delete<void>(API_ROUTES.COMPLAINT.DELETE(id));
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX MESSAGES (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getConversations(): Promise<{ conversations: any[] }> {
		return this.get<{ conversations: any[] }>(
			API_ROUTES.MESSAGE.CONVERSATIONS
		);
	}

	async getInbox(): Promise<{ messages: any[] }> {
		return this.get<{ messages: any[] }>(API_ROUTES.MESSAGE.INBOX);
	}

	async getAvailableUsers(): Promise<{ data: any[] }> {
		return this.get<{ data: any[] }>(API_ROUTES.MESSAGE.AVAILABLE_USERS);
	}

	async sendMessage(data: any): Promise<any> {
		return this.post<any>(API_ROUTES.MESSAGE.SEND, data);
	}

	async markMessageAsRead(messageId: string): Promise<void> {
		return this.put<void>(API_ROUTES.MESSAGE.MARK_READ(messageId), {});
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX SERVICES (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getServices(): Promise<any[]> {
		return this.get<any[]>(API_ROUTES.SERVICE.INDEX);
	}

	async getService(id: string): Promise<any> {
		return this.get<any>(API_ROUTES.SERVICE.BY_ID(id));
	}

	async getPrestataires(): Promise<any[]> {
		// L'endpoint renvoie actuellement un objet { prestataires: [...] } mais
		// gardons une logique défensive pour gérer les différents formats.
		const resp = await this.get<any>('/prestataires/');

		if (Array.isArray(resp)) {
			return resp;
		}

		if (Array.isArray(resp?.prestataires)) {
			return resp.prestataires;
		}

		if (Array.isArray(resp?.data?.prestataires)) {
			return resp.data.prestataires;
		}

		if (Array.isArray(resp?.data)) {
			return resp.data;
		}

		// Fallback : aucun tableau détecté ➡︎ retourner tableau vide
		return [];
	}

	async createService(data: any): Promise<any> {
		// S'aligner sur la structure de la table 'services' du backend
		const isHourly = data.pricing_type === 'hourly';

		const servicePayload = {
			prestataireId: data.prestataireId, // 🔑 AJOUT IMPORTANT
			name: data.name,
			description: data.description,
			price: data.price, // Toujours stocker le montant saisi
			pricing_type: data.pricing_type,
			hourly_rate: isHourly ? data.price : null, // Taux horaire stocké séparément
			location: data.location,
			service_type_id: data.service_type_id,
			home_service: data.home_service,
			requires_materials: data.requires_materials,
			duration: data.duration,
			availability_description:
				data.availability_description || 'Disponible sur demande',
			status: 'pending',
			is_active: false,
		};
		return this.post<any>(API_ROUTES.SERVICE.CREATE, servicePayload);
	}

	async updateService(id: string, data: any): Promise<any> {
		return this.put<any>(API_ROUTES.SERVICE.UPDATE(id), data);
	}

	async deleteService(id: string): Promise<void> {
		return this.delete<void>(API_ROUTES.SERVICE.DELETE(id));
	}

	// ========================================================================
	// 🔎 VALIDATION DES SERVICES (ADMIN)
	// ========================================================================

	async getPendingServices(): Promise<any> {
		return this.get<any>('/services/pending');
	}

	async validateService(
		id: string,
		status: 'approved' | 'rejected' | 'pending',
		comments?: string,
		requireJustifications: boolean = false
	): Promise<any> {
		return this.post<any>(`/services/${id}/validate`, {
			validation_status: status,
			admin_comments: comments,
			require_justifications: requireJustifications,
		});
	}

	// ==========================================================================
	// 🚀 NOUVEAU: MÉTHODES TYPES DE SERVICES
	// ==========================================================================

	async getServiceTypes(): Promise<any> {
		return this.get<any>(SERVICE_TYPE_ROUTES.INDEX);
	}

	async getServiceType(id: string): Promise<any> {
		return this.get<any>(SERVICE_TYPE_ROUTES.BY_ID(id));
	}

	async createServiceType(data: any): Promise<any> {
		return this.post<any>(SERVICE_TYPE_ROUTES.CREATE, data);
	}

	async updateServiceType(id: string, data: any): Promise<any> {
		return this.put<any>(SERVICE_TYPE_ROUTES.UPDATE(id), data);
	}

	async deleteServiceType(id: string): Promise<void> {
		return this.delete<void>(SERVICE_TYPE_ROUTES.DELETE(id));
	}

	async toggleServiceTypeStatus(id: string): Promise<any> {
		return this.put<any>(SERVICE_TYPE_ROUTES.TOGGLE_STATUS(id), {});
	}

	// ==========================================================================
	// 🚀 NOUVEAU: MÉTHODES ADMIN SERVICES
	// ==========================================================================

	async getAdminServices(filters?: any): Promise<any> {
		// Utiliser la route /services/ qui existe dans le backend
		let url = '/services/';
		if (filters) {
			const params = new URLSearchParams();
			if (filters.status)
				params.append(
					'status',
					Array.isArray(filters.status)
						? filters.status.join(',')
						: filters.status
				);
			if (filters.service_type_id)
				params.append(
					'service_type_id',
					Array.isArray(filters.service_type_id)
						? filters.service_type_id.join(',')
						: filters.service_type_id
				);
			if (filters.location) params.append('location', filters.location);
			if (filters.is_active !== undefined)
				params.append('is_active', filters.is_active.toString());

			const queryString = params.toString();
			if (queryString) url += `?${queryString}`;
		}
		return this.get<any>(url);
	}

	async getAdminServiceTypes(): Promise<any> {
		// Utiliser la route publique /service-types/ qui existe dans le backend (ligne 441+ routes.ts)
		return this.get<any>('/service-types/');
	}

	async updateServiceStatus(id: string, isActive: boolean): Promise<any> {
		// Utiliser la route /services/:id pour mise à jour
		return this.put<any>(`/services/${id}`, { is_active: isActive });
	}

	// ==========================================================================
	// 🚀 NOUVEAU: MÉTHODES BOOKINGS ADMIN
	// ==========================================================================

	async getBookings(filters?: any): Promise<any> {
		let url = '/bookings/';
		if (filters) {
			const params = new URLSearchParams();
			if (filters.status)
				params.append(
					'status',
					Array.isArray(filters.status)
						? filters.status.join(',')
						: filters.status
				);
			if (filters.client_id)
				params.append('client_id', filters.client_id.toString());
			if (filters.prestataire_id)
				params.append(
					'prestataire_id',
					filters.prestataire_id.toString()
				);
			if (filters.service_id)
				params.append('service_id', filters.service_id.toString());
			if (filters.date_start)
				params.append('date_start', filters.date_start);
			if (filters.date_end) params.append('date_end', filters.date_end);
			if (filters.payment_status)
				params.append(
					'payment_status',
					Array.isArray(filters.payment_status)
						? filters.payment_status.join(',')
						: filters.payment_status
				);

			const queryString = params.toString();
			if (queryString) url += `?${queryString}`;
		}
		return this.get<any>(url);
	}

	async getBooking(id: string): Promise<any> {
		return this.get<any>(`/bookings/${id}`);
	}

	async createBooking(data: any): Promise<any> {
		return this.post<any>('/bookings/', data);
	}

	async updateBookingStatus(
		id: string,
		data: { status: string; notes?: string }
	): Promise<any> {
		return this.put<any>(`/bookings/${id}/status`, data);
	}

	async getClientBookings(clientId: string): Promise<any> {
		return this.get<any>(`/bookings/client/${clientId}`);
	}

	async getProviderBookings(prestataireId: string): Promise<any> {
		return this.get<any>(`/bookings/provider/${prestataireId}`);
	}

	async getBookingStats(): Promise<any> {
		return this.get<any>('/bookings/admin/stats');
	}

	// ==========================================================================
	// 🚀 NOUVEAU: MÉTHODES RATINGS ADMIN (en plus des méthodes existantes)
	// ==========================================================================

	async getAllRatingsAdmin(filters?: any): Promise<any> {
		// Nouvelle méthode pour l'admin avec filtres avancés
		let url = '/ratings/';
		if (filters) {
			const params = new URLSearchParams();
			if (filters.rating_type)
				params.append(
					'rating_type',
					Array.isArray(filters.rating_type)
						? filters.rating_type.join(',')
						: filters.rating_type
				);
			if (filters.rating)
				params.append(
					'rating',
					Array.isArray(filters.rating)
						? filters.rating.join(',')
						: filters.rating
				);
			if (filters.is_visible !== undefined)
				params.append('is_visible', filters.is_visible.toString());
			if (filters.has_admin_response !== undefined)
				params.append(
					'has_admin_response',
					filters.has_admin_response.toString()
				);
			if (filters.date_start)
				params.append('date_start', filters.date_start);
			if (filters.date_end) params.append('date_end', filters.date_end);
			if (filters.user_id)
				params.append('user_id', filters.user_id.toString());

			const queryString = params.toString();
			if (queryString) url += `?${queryString}`;
		}
		return this.get<any>(url);
	}

	async addAdminRatingResponse(
		ratingId: string,
		response: string
	): Promise<any> {
		return this.post<any>(`/ratings/${ratingId}/admin-response`, {
			admin_response: response,
		});
	}

	async toggleRatingVisibility(ratingId: string): Promise<any> {
		// Temporairement utiliser POST au lieu de PATCH pour éviter les problèmes CORS
		return this.post<any>(`/ratings/${ratingId}/visibility`, {});
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AU TRACKING (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getPackageTracking(trackingNumber: string): Promise<any> {
		return this.get<any>(API_ROUTES.PACKAGE.BY_TRACKING(trackingNumber));
	}

	async getPackageLocationHistory(trackingNumber: string): Promise<any[]> {
		return this.get<any[]>(
			API_ROUTES.PACKAGE.LOCATION_HISTORY(trackingNumber)
		);
	}

	async updatePackageLocation(
		trackingNumber: string,
		locationData: any
	): Promise<any> {
		return this.patch<any>(
			API_ROUTES.PACKAGE.UPDATE_LOCATION(trackingNumber),
			locationData
		);
	}

	// ==========================================================================
	// NOUVELLES MÉTHODES DE TRACKING TEMPS RÉEL
	// ==========================================================================

	async getLivraisonTracking(livraisonId: string): Promise<any> {
		return this.get<any>(
			API_ROUTES.TRACKING.LIVRAISON_TRACKING(livraisonId)
		);
	}

	async getLivreurPositions(
		livreurId: string,
		options?: {
			startDate?: string;
			endDate?: string;
			livraisonId?: string;
		}
	): Promise<any> {
		let url = API_ROUTES.TRACKING.LIVREUR_POSITIONS(livreurId);
		if (options) {
			const params = new URLSearchParams();
			if (options.startDate)
				params.append('start_date', options.startDate);
			if (options.endDate) params.append('end_date', options.endDate);
			if (options.livraisonId)
				params.append('livraison_id', options.livraisonId);
			if (params.toString()) url += `?${params.toString()}`;
		}
		return this.get<any>(url);
	}

	async getLastLivreurPosition(livreurId: string): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.LAST_POSITION(livreurId));
	}

	async getActiveLivreurs(): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.ACTIVE_LIVREURS);
	}

	async getRealTimePackageLocation(trackingNumber: string): Promise<any> {
		return this.get<any>(
			API_ROUTES.PACKAGE.REAL_TIME_LOCATION(trackingNumber)
		);
	}

	async getLiveTrackingData(): Promise<any> {
		return this.get<any>(API_ROUTES.PACKAGE.LIVE_TRACKING);
	}

	// ==========================================================================
	// MÉTHODES À STRIPE
	// ==========================================================================

	// Abonnements
	async getStripePlans(): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.PLANS);
	}

	async subscribeUser(data: {
		planId: string;
		priceId: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.SUBSCRIBE, data);
	}

	async cancelSubscription(subscriptionId: string): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CANCEL_SUBSCRIPTION, {
			subscriptionId,
		});
	}

	async createCustomerPortalSession(): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CUSTOMER_PORTAL, {});
	}

	async getUserSubscription(userId: string): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.GET_SUBSCRIPTION(userId));
	}

	async updateSubscription(subscriptionId: string, data: any): Promise<any> {
		return this.put<any>(
			API_ROUTES.STRIPE.UPDATE_SUBSCRIPTION(subscriptionId),
			data
		);
	}

	// Paiements directs
	async createPaymentIntent(data: {
		amount: number;
		currency?: string;
		deliveryId?: string;
		serviceId?: string;
		description?: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CREATE_PAYMENT_INTENT, data);
	}

	async confirmPayment(data: {
		paymentIntentId: string;
		paymentMethodId?: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CONFIRM_PAYMENT, data);
	}

	async capturePayment(paymentIntentId: string): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CAPTURE_PAYMENT, {
			paymentIntentId,
		});
	}

	async refundPayment(data: {
		paymentIntentId: string;
		amount?: number;
		reason?: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.REFUND_PAYMENT, data);
	}

	// Stripe Connect (pour livreurs/prestataires)
	async createConnectedAccount(data: {
		email: string;
		country?: string;
		accountType?: 'individual' | 'company';
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CREATE_CONNECTED_ACCOUNT, data);
	}

	async getOnboardingLink(accountId: string): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.GET_ONBOARDING_LINK, {
			accountId,
		});
	}

	async getConnectedAccountStatus(accountId: string): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.GET_ACCOUNT_STATUS(accountId));
	}

	async createExpressDashboardLink(accountId: string): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.CREATE_EXPRESS_DASHBOARD_LINK(accountId),
			{}
		);
	}

	// ==========================================================================
	// 🚀 NOUVEAU: MÉTHODES STRIPE CONNECT (ALIGNÉES SUR BACKEND)
	// ==========================================================================

	// Créer un compte Stripe Connect Express pour livreur
	async createStripeConnectAccount(): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CREATE_ACCOUNT,
			{}
		);
	}

	// Créer un lien d'onboarding Stripe Connect
	async createStripeConnectOnboardingLink(data: {
		returnUrl?: string;
		refreshUrl?: string;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_ONBOARDING_LINK,
			data
		);
	}

	// Vérifier le statut du compte Stripe Connect
	async getStripeConnectAccountStatus(): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.STRIPE_CONNECT_ACCOUNT_STATUS);
	}

	// Effectuer un virement depuis le portefeuille vers la banque
	async transferFromWalletToBank(data: {
		montant: number;
		description?: string;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_TRANSFER_FROM_WALLET,
			data
		);
	}

	// Créer un lien vers le dashboard Stripe Express
	async createStripeConnectDashboardLink(): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.STRIPE_CONNECT_DASHBOARD_LINK);
	}

	// Configurer les virements automatiques
	async configureStripeConnectPayouts(data: {
		schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
		delayDays?: number;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CONFIGURE_PAYOUTS,
			data
		);
	}

	// Paiements avec commissions (Connect)
	async createDeliveryPayment(data: {
		amount: number;
		annonce_id: number;
		description: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CREATE_DELIVERY_PAYMENT, data);
	}

	async createServicePayment(data: {
		amount: number;
		service_id: number;
		description: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CREATE_SERVICE_PAYMENT, data);
	}

	// 🚀 NOUVEAU: Paiement pour livraison avec livraison_id
	async createLivraisonPayment(data: {
		amount: number;
		livraison_id: number;
		description: string;
	}): Promise<any> {
		return this.post<any>('/stripe/payments/livraison', data);
	}

	async transferToProvider(data: {
		amount: number;
		destinationAccountId: string;
		transferDescription?: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.TRANSFER_TO_PROVIDER, data);
	}

	// Facturation
	async createStripeInvoice(data: {
		customerId: string;
		items: Array<{
			description: string;
			amount: number;
			quantity?: number;
		}>;
		dueDate?: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.CREATE_INVOICE, data);
	}

	// Téléchargement de factures
	async downloadInvoice(
		invoiceId: string
	): Promise<{ success: boolean; download_url: string }> {
		return this.get<{ success: boolean; download_url: string }>(
			`/stripe/invoice/${invoiceId}/download`
		);
	}

	// 🚀 NOUVEAU: Générer et télécharger une facture pour une livraison
	async downloadDeliveryInvoice(
		deliveryId: string
	): Promise<{
		success: boolean;
		download_url?: string;
		invoice_data?: any;
	}> {
		// Pour l'instant, cette route n'existe pas encore côté backend
		// En attendant, on retourne les données nécessaires pour générer la facture côté client
		try {
			const delivery = await this.getDelivery(deliveryId);
			return {
				success: true,
				invoice_data: {
					delivery,
					invoiceNumber: `ECO-${new Date().getFullYear()}-${deliveryId.padStart(
						5,
						'0'
					)}`,
					date: new Date().toLocaleDateString('fr-FR'),
					// TODO: Ajouter plus de détails quand l'API sera prête
				},
			};
		} catch (error) {
			return {
				success: false,
			};
		}
	}

	async sendInvoice(invoiceId: string): Promise<any> {
		return this.post<any>(API_ROUTES.STRIPE.SEND_INVOICE(invoiceId), {});
	}

	async getCustomerInvoices(customerId: string): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.GET_INVOICES(customerId));
	}

	// Admin/Analytics
	async getRevenueAnalytics(params?: {
		startDate?: string;
		endDate?: string;
		groupBy?: 'day' | 'week' | 'month';
	}): Promise<any> {
		let url = API_ROUTES.STRIPE.GET_REVENUE_ANALYTICS;
		if (params) {
			const searchParams = new URLSearchParams();
			if (params.startDate)
				searchParams.append('start_date', params.startDate);
			if (params.endDate) searchParams.append('end_date', params.endDate);
			if (params.groupBy) searchParams.append('group_by', params.groupBy);
			if (searchParams.toString()) url += `?${searchParams.toString()}`;
		}
		return this.get<any>(url);
	}

	async getCommissionReport(params?: {
		startDate?: string;
		endDate?: string;
		providerId?: string;
	}): Promise<any> {
		let url = API_ROUTES.STRIPE.GET_COMMISSION_REPORT;
		if (params) {
			const searchParams = new URLSearchParams();
			if (params.startDate)
				searchParams.append('start_date', params.startDate);
			if (params.endDate) searchParams.append('end_date', params.endDate);
			if (params.providerId)
				searchParams.append('provider_id', params.providerId);
			if (searchParams.toString()) url += `?${searchParams.toString()}`;
		}
		return this.get<any>(url);
	}

	async getSubscriptionAnalytics(): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.GET_SUBSCRIPTION_ANALYTICS);
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX RATINGS
	// ==========================================================================

	// Créer une évaluation
	async createRating(ratingData: {
		reviewed_id: number;
		rating_type: 'delivery' | 'service';
		rating_for_id: number;
		overall_rating: number;
		punctuality_rating?: number;
		quality_rating?: number;
		communication_rating?: number;
		comment?: string;
	}): Promise<{ success: boolean; message: string; rating: any }> {
		return this.post<{ success: boolean; message: string; rating: any }>(
			'/ratings',
			ratingData
		);
	}

	// Récupérer les évaluations d'un utilisateur
	async getUserRatings(userId: string): Promise<{
		success: boolean;
		ratings: any[];
		average_rating: number;
		total_ratings: number;
	}> {
		return this.get<{
			success: boolean;
			ratings: any[];
			average_rating: number;
			total_ratings: number;
		}>(`/ratings/user/${userId}`);
	}

	// Récupérer les évaluations d'une livraison/service
	async getItemRatings(
		type: 'delivery' | 'service',
		itemId: string
	): Promise<{
		success: boolean;
		ratings: any[];
		average_rating: number;
		total_ratings: number;
	}> {
		return this.get<{
			success: boolean;
			ratings: any[];
			average_rating: number;
			total_ratings: number;
		}>(`/ratings/${type}/${itemId}`);
	}

	// Récupérer les statistiques de rating d'un utilisateur
	async getRatingStats(userId: string): Promise<{
		success: boolean;
		stats: {
			average_overall_rating: number;
			average_punctuality_rating: number;
			average_quality_rating: number;
			average_communication_rating: number;
			total_ratings: number;
			rating_distribution: Record<string, number>;
		};
	}> {
		return this.get<{
			success: boolean;
			stats: any;
		}>(`/ratings/stats/${userId}`);
	}

	// 🌟 NOUVEAU: Vérifier si l'utilisateur connecté a déjà évalué un élément
	async checkUserRating(
		type: 'delivery' | 'service',
		itemId: string
	): Promise<{
		success: boolean;
		has_rated: boolean;
		rating?: {
			id: number;
			overall_rating: number;
			punctuality_rating?: number;
			quality_rating?: number;
			communication_rating?: number;
			comment?: string;
			created_at: string;
		};
	}> {
		return this.get<{
			success: boolean;
			has_rated: boolean;
			rating?: any;
		}>(`/ratings/check/${type}/${itemId}`);
	}

  // async getAllRatings(): Promise<{

  // }> {

  // }

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AUX UTILISATEURS (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getAllUsers(): Promise<any[]> {
		return this.get<any[]>(API_ROUTES.USER.ALL);
	}

	async getUser(id: string): Promise<any> {
		return this.get<any>(API_ROUTES.USER.BY_ID(id));
	}

	async updateUser(id: string, data: any): Promise<any> {
		return this.put<any>(API_ROUTES.USER.UPDATE(id), data);
	}

	async checkPassword(password: string): Promise<boolean> {
		const response = await this.post<{ valid: boolean }>(
			API_ROUTES.USER.CHECK_PASSWORD,
			{ password }
		);
		return response.valid;
	}

	// ==========================================================================
	// MÉTHODES SPÉCIFIQUES AU PORTEFEUILLE (ROUTES CENTRALISÉES)
	// ==========================================================================

	async getUserWallet(userId: string): Promise<any> {
		// Utiliser la nouvelle route /show pour les clients
		return this.get<any>(API_ROUTES.WALLET.SHOW);
	}

	async getWalletHistory(userId: string): Promise<any> {
		return this.get<any>(API_ROUTES.WALLET.GET_HISTORY(userId));
	}

	async configureAutoTransfer(
		userId: string,
		data: {
			iban: string;
			bic: string;
			seuil: number;
		}
	): Promise<any> {
		return this.post<any>(
			API_ROUTES.WALLET.CONFIGURE_AUTO_TRANSFER(userId),
			data
		);
	}

	async disableAutoTransfer(userId: string): Promise<any> {
		return this.post<any>(
			API_ROUTES.WALLET.DISABLE_AUTO_TRANSFER(userId),
			{}
		);
	}

	async requestTransfer(
		userId: string,
		data: {
			montant: number;
			iban: string;
			bic: string;
		}
	): Promise<any> {
		return this.post<any>(API_ROUTES.WALLET.REQUEST_TRANSFER(userId), data);
	}

	async getWalletStatistics(): Promise<any> {
		return this.get<any>(API_ROUTES.WALLET.GET_STATISTICS);
	}

	// ==========================================================================
	// 🆕 NOUVELLES MÉTHODES CLIENT MULTI-RÔLES CAGNOTTE
	// ==========================================================================

	// Recharger la cagnotte client
	async rechargerCagnotte(data: { montant: number }): Promise<any> {
		return this.post<any>(API_ROUTES.WALLET.RECHARGER_CAGNOTTE, data);
	}

	// Confirmer la recharge de cagnotte après paiement Stripe
	async confirmerRechargeCagnotte(data: {
		payment_intent_id: string;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.WALLET.CONFIRMER_RECHARGE_CAGNOTTE,
			data
		);
	}

	// Payer depuis la cagnotte
	async payerDepuisCagnotte(data: {
		montant: number;
		description: string;
		type: 'livraison' | 'service';
		referenceId: string;
	}): Promise<any> {
		return this.post<any>(API_ROUTES.WALLET.PAYER_DEPUIS_CAGNOTTE, data);
	}

	// Récupérer les gains prestataire
	async getGainsPrestataire(): Promise<any> {
		return this.get<any>(API_ROUTES.WALLET.GAINS_PRESTATAIRE);
	}

	// ==========================================================================
	// 🆕 NOUVELLES MÉTHODES STRIPE CONNECT CLIENT
	// ==========================================================================

	// Créer un compte Stripe Connect pour client
	async createClientStripeConnectAccount(): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CLIENT_CREATE_ACCOUNT,
			{}
		);
	}

	// Créer un lien d'onboarding pour client
	async createClientStripeConnectOnboardingLink(data: {
		returnUrl?: string;
		refreshUrl?: string;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CLIENT_ONBOARDING_LINK,
			data
		);
	}

	// Vérifier le statut du compte Stripe Connect client
	async getClientStripeConnectAccountStatus(): Promise<any> {
		return this.get<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CLIENT_ACCOUNT_STATUS
		);
	}

	// Effectuer un virement depuis la cagnotte client vers la banque
	async transferFromClientWalletToBank(data: {
		montant: number;
		description?: string;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CLIENT_TRANSFER_FROM_WALLET,
			data
		);
	}

	// Créer un lien vers le dashboard Stripe Express pour client
	async createClientStripeConnectDashboardLink(): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.STRIPE_CONNECT_CLIENT_DASHBOARD_LINK,
			{}
		);
	}

	// ==========================================================================
	// 🆕 NOUVELLES MÉTHODES PAIEMENTS AVEC CAGNOTTE
	// ==========================================================================

	// Créer un paiement de livraison avec option cagnotte
	async createLivraisonPaymentWithWallet(data: {
		amount: number;
		livraison_id: number;
		description: string;
		use_wallet?: boolean;
		wallet_amount?: number;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.CREATE_LIVRAISON_PAYMENT_WITH_WALLET,
			data
		);
	}

	// Créer un paiement de service avec option cagnotte
	async createServicePaymentWithWallet(data: {
		amount: number;
		service_id: number;
		description: string;
		use_wallet?: boolean;
		wallet_amount?: number;
	}): Promise<any> {
		return this.post<any>(
			API_ROUTES.STRIPE.CREATE_SERVICE_PAYMENT_WITH_WALLET,
			data
		);
	}

	// Récupérer le solde de la cagnotte client pour l'interface de paiement
	async getClientWalletBalance(): Promise<any> {
		return this.get<any>(API_ROUTES.STRIPE.GET_CLIENT_WALLET_BALANCE);
	}

	// ==========================================================================
	// MÉTHODES UTILITAIRES
	// ==========================================================================

	/**
	 * Test de connectivité avec le serveur
	 */
	async healthCheck(): Promise<boolean> {
		try {
			// Essayer d'accéder à une route simple
			await this.get('/health');
			return true;
		} catch {
			return false;
		}
	}
}

// =============================================================================
// INSTANCE SINGLETON DU CLIENT API
// =============================================================================

// Créer l'instance avec l'URL du backend depuis la configuration centralisée
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

// Export du type pour utilisation dans les composants
export type { ApiClient };

// =============================================================================
// UTILITAIRES POUR LA GESTION D'ERREURS
// =============================================================================

/**
 * Vérifie si une erreur est une ApiErrorException
 */
export function isApiError(error: unknown): error is ApiErrorException {
	return error instanceof ApiErrorException;
}

/**
 * Extrait un message d'erreur lisible depuis une erreur quelconque
 */
export function getErrorMessage(error: unknown): string {
	if (isApiError(error)) {
		// Si l'erreur a des données supplémentaires, essayer de les utiliser
		if (error.data && typeof error.data === 'object') {
			const dataMessage =
				error.data.message ||
				error.data.error_message ||
				error.data.error ||
				(Array.isArray(error.data.errors)
					? error.data.errors.join(', ')
					: null);

			if (dataMessage && typeof dataMessage === 'string') {
				return dataMessage;
			}
		}

		// Sinon utiliser le message principal
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	// Dernière chance : essayer de convertir l'objet en string lisible
	if (error && typeof error === 'object') {
		try {
			const errorObj = error as any;
			return (
				errorObj.message ||
				errorObj.error_message ||
				JSON.stringify(error)
			);
		} catch {
			return 'Une erreur inattendue est survenue';
		}
	}

	return 'Une erreur inattendue est survenue';
}

/**
 * Vérifie si l'erreur indique une déconnexion (401/403)
 */
export function isAuthError(error: unknown): boolean {
	return isApiError(error) && (error.status === 401 || error.status === 403);
}
