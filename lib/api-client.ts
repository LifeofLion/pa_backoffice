import { useAuthStore } from '@/src/stores/auth-store';

// Utilitaire client API pour pa-backoffice
export class ApiClient {
	private static getAuthHeaders(): HeadersInit {
		// Récupère le token directement depuis le store Zustand
		const token = useAuthStore.getState().token;
		return {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` }),
		};
	}

	static async get(url: string): Promise<any> {
		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: this.getAuthHeaders(),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('API GET Error:', error);
			throw error;
		}
	}

	static async post(url: string, data: any): Promise<any> {
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: this.getAuthHeaders(),
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message ||
						`HTTP error! status: ${response.status}`
				);
			}

			return await response.json();
		} catch (error) {
			console.error('API POST Error:', error);
			throw error;
		}
	}

	static async put(url: string, data?: any): Promise<any> {
		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: this.getAuthHeaders(),
				...(data && { body: JSON.stringify(data) }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.message ||
						`HTTP error! status: ${response.status}`
				);
			}

			return await response.json();
		} catch (error) {
			console.error('API PUT Error:', error);
			throw error;
		}
	}

	static async delete(url: string): Promise<any> {
		try {
			const response = await fetch(url, {
				method: 'DELETE',
				headers: this.getAuthHeaders(), // Utilise la nouvelle méthode
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Pour les suppressions, le backend retourne 204 No Content sans body JSON
			if (response.status === 204) {
				return { success: true };
			}

			// Tenter de parser JSON seulement si il y a du contenu
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				return await response.json();
			}

			return { success: true };
		} catch (error) {
			console.error('API DELETE Error:', error);
			throw error;
		}
	}
}

// Hook personnalisé pour utiliser le client API avec gestion des erreurs
export function useApiClient() {
	const handleApiError = (error: any) => {
		if (error.message?.includes('401') || error.message?.includes('403')) {
			// Rediriger vers la page de connexion en cas d'erreur d'authentification
			window.location.href = '/login';
		}
		throw error;
	};

	return {
		get: async (url: string) => {
			try {
				return await ApiClient.get(url);
			} catch (error) {
				handleApiError(error);
			}
		},
		post: async (url: string, data: any) => {
			try {
				return await ApiClient.post(url, data);
			} catch (error) {
				handleApiError(error);
			}
		},
		put: async (url: string, data?: any) => {
			try {
				return await ApiClient.put(url, data);
			} catch (error) {
				handleApiError(error);
			}
		},
		delete: async (url: string) => {
			try {
				return await ApiClient.delete(url);
			} catch (error) {
				handleApiError(error);
			}
		},
	};
}
