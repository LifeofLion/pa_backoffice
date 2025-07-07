// Service pour gérer les ratings/avis
import { ApiClient } from '@/lib/api-client';

const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3333';

export interface CreateRatingData {
	reviewed_id: number;
	rating_type: 'service' | 'delivery' | 'product';
	rating_for_id: number;
	overall_rating: number;
	punctuality_rating?: number;
	quality_rating?: number;
	communication_rating?: number;
	value_rating?: number;
	comment?: string;
}

export interface RatingResponse {
	id: number;
	client_name: string;
	rating: number;
	punctuality_rating?: number;
	quality_rating?: number;
	communication_rating?: number;
	value_rating?: number;
	comment?: string;
	service_name?: string;
	is_verified_purchase: boolean;
	created_at: string;
}

export interface RatingsResponse {
	reviews: RatingResponse[];
	total: number;
	average_rating: number | null;
}

export class RatingService {
	/**
	 * Créer un nouvel avis
	 */
	static async createRating(data: CreateRatingData): Promise<any> {
		try {
			const response = await ApiClient.post(
				`${BACKEND_URL}/ratings`,
				data
			);
			return response;
		} catch (error) {
			console.error('Erreur création avis:', error);
			throw error;
		}
	}

	/**
	 * Récupérer les avis d'un prestataire
	 */
	static async getProviderRatings(
		prestataireId: number
	): Promise<RatingsResponse> {
		try {
			const response = await fetch(
				`${BACKEND_URL}/ratings/prestataire/${prestataireId}`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error('Erreur récupération avis prestataire:', error);
			throw error;
		}
	}

	/**
	 * Récupérer les avis d'un service
	 */
	static async getServiceRatings(
		serviceId: number
	): Promise<RatingsResponse> {
		try {
			const response = await fetch(
				`${BACKEND_URL}/ratings/service/${serviceId}`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error('Erreur récupération avis service:', error);
			throw error;
		}
	}

	/**
	 * Récupérer tous les avis (admin)
	 */
	static async getAllRatings(params?: {
		page?: number;
		limit?: number;
		status?: 'visible' | 'hidden' | 'all';
	}): Promise<any> {
		try {
			const searchParams = new URLSearchParams();
			if (params?.page)
				searchParams.append('page', params.page.toString());
			if (params?.limit)
				searchParams.append('limit', params.limit.toString());
			if (params?.status) searchParams.append('status', params.status);

			const url = `${BACKEND_URL}/ratings/admin/all${
				searchParams.toString() ? '?' + searchParams.toString() : ''
			}`;

			return await ApiClient.get(url);
		} catch (error) {
			console.error('Erreur récupération tous les avis:', error);
			throw error;
		}
	}

	/**
	 * Mettre à jour un avis (modération admin)
	 */
	static async updateRating(
		ratingId: number,
		data: {
			is_visible?: boolean;
			admin_response?: string;
		}
	): Promise<any> {
		try {
			return await ApiClient.put(
				`${BACKEND_URL}/ratings/${ratingId}`,
				data
			);
		} catch (error) {
			console.error('Erreur mise à jour avis:', error);
			throw error;
		}
	}

	/**
	 * Supprimer un avis
	 */
	static async deleteRating(ratingId: number): Promise<any> {
		try {
			return await ApiClient.delete(`${BACKEND_URL}/ratings/${ratingId}`);
		} catch (error) {
			console.error('Erreur suppression avis:', error);
			throw error;
		}
	}

	/**
	 * Calculer la moyenne des notes détaillées
	 */
	static calculateDetailedAverage(ratings: RatingResponse[]): {
		overall: number | null;
		punctuality: number | null;
		quality: number | null;
		communication: number | null;
		value: number | null;
	} {
		if (!ratings || ratings.length === 0) {
			return {
				overall: null,
				punctuality: null,
				quality: null,
				communication: null,
				value: null,
			};
		}

		const calculate = (field: keyof RatingResponse) => {
			const validRatings = ratings
				.map((r) => r[field])
				.filter(
					(rating) => rating != null && typeof rating === 'number'
				) as number[];

			return validRatings.length > 0
				? Math.round(
						(validRatings.reduce((sum, rating) => sum + rating, 0) /
							validRatings.length) *
							10
				  ) / 10
				: null;
		};

		return {
			overall: calculate('rating'),
			punctuality: calculate('punctuality_rating'),
			quality: calculate('quality_rating'),
			communication: calculate('communication_rating'),
			value: calculate('value_rating'),
		};
	}

	/**
	 * Formater l'affichage des étoiles
	 */
	static formatStarDisplay(rating: number | null): string {
		if (!rating) return 'Non évalué';
		return `${rating}/5 ⭐`;
	}

	/**
	 * Obtenir la couleur selon la note
	 */
	static getRatingColor(rating: number | null): string {
		if (!rating) return 'text-gray-400';
		if (rating >= 4.5) return 'text-green-600';
		if (rating >= 3.5) return 'text-yellow-600';
		if (rating >= 2.5) return 'text-orange-600';
		return 'text-red-600';
	}
}
 