import { User } from '@/src/types';
import { API_CONFIG, API_ROUTES } from './api-routes';

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
			console.log('🔍 API Request Details:', {
				method: config.method || 'GET',
				url: url,
				headers: config.headers,
				body: config.body,
				config: config,
			});

			const response = await fetch(url, config);

			console.log('🔍 API Response Details:', {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
				url: response.url,
				headers: Object.fromEntries(response.headers.entries()),
			});

			// Gestion des erreurs HTTP
			if (!response.ok) {
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				let errorData = null;

				try {
					errorData = await response.json();
					console.log(
						'🔴 Backend error response STATUS:',
						response.status
					);
					console.log(
						'🔴 Backend error response HEADERS:',
						Object.fromEntries(response.headers.entries())
					);
					console.log('🔴 Backend error response DATA:', errorData);
					console.log(
						'🔴 Backend error response DATA TYPE:',
						typeof errorData
					);
					console.log(
						'🔴 Backend error response DATA KEYS:',
						errorData ? Object.keys(errorData) : 'No keys'
					);

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
				console.log('🔴 Full error details for debugging:', {
					status: response.status,
					statusText: response.statusText,
					url: response.url,
					errorData,
					extractedMessage: errorMessage,
				});
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

	async register(userData: any): Promise<{ token: string; user: User }> {
		const response = await this.post<{ token: string; user: User }>(
			API_ROUTES.AUTH.REGISTER,
			userData
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
		return this.get<any[]>(API_ROUTES.DELIVERY.BY_CLIENT(clientId));
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

	async createService(data: any): Promise<any> {
		return this.post<any>(API_ROUTES.SERVICE.CREATE, data);
	}

	async updateService(id: string, data: any): Promise<any> {
		return this.put<any>(API_ROUTES.SERVICE.UPDATE(id), data);
	}

	async deleteService(id: string): Promise<void> {
		return this.delete<void>(API_ROUTES.SERVICE.DELETE(id));
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

	async calculateETA(livraisonId: string): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.CALCULATE_ETA(livraisonId));
	}

	async getTrafficConditions(routeId: string): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.TRAFFIC_CONDITIONS(routeId));
	}

	async reportDetour(data: any): Promise<any> {
		return this.post<any>(API_ROUTES.TRACKING.REPORT_DETOUR, data);
	}

	async predictDeliveryTime(livraisonId: string): Promise<any> {
		return this.get<any>(
			API_ROUTES.TRACKING.PREDICT_DELIVERY_TIME(livraisonId)
		);
	}

	async predictOptimalRoute(
		startLat: number,
		startLng: number,
		endLat: number,
		endLng: number
	): Promise<any> {
		return this.get<any>(
			API_ROUTES.TRACKING.PREDICT_OPTIMAL_ROUTE(
				startLat,
				startLng,
				endLat,
				endLng
			)
		);
	}

	async getLivePositionsMap(): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.LIVE_POSITIONS);
	}

	async getActiveRoutesMap(): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.ACTIVE_ROUTES);
	}

	async getGeofences(): Promise<any> {
		return this.get<any>(API_ROUTES.TRACKING.GEOFENCES);
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
