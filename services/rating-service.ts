import { ApiClient } from '@/lib/api-client';
import { RatingData, AdminRatingResponse } from '@/src/types/validators';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export const ratingService = {
	getAllRatings: async (): Promise<RatingData[]> => {
		const response = await ApiClient.get(
			`${API_BASE_URL}/api/admin/ratings`
		);
		// La réponse peut être un objet paginé { data: [...] } ou un tableau simple.
		if (
			response &&
			typeof response === 'object' &&
			'data' in response &&
			Array.isArray(response.data)
		) {
			return response.data;
		}
		if (Array.isArray(response)) {
			return response;
		}
		return [];
	},

	addAdminResponse: async (
		ratingId: number,
		responseData: AdminRatingResponse
	): Promise<RatingData> => {
		return await ApiClient.put(
			`${API_BASE_URL}/api/admin/ratings/${ratingId}/response`,
			responseData
		);
	},

	toggleVisibility: async (ratingId: number): Promise<RatingData> => {
		return await ApiClient.put(
			`${API_BASE_URL}/api/admin/ratings/${ratingId}/toggle-visibility`
		);
	},
};
