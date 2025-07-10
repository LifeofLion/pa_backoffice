import { useState, useCallback, useEffect } from 'react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { RatingData, RatingStats } from '@/src/types/validators';
import { ratingService } from '@/services/rating-service';

const transformRatingData = (rawRating: any): RatingData => {
	const reviewer = rawRating.reviewer;
	// Les notes de l'API sont des chaînes de caractères, nous les convertissons en nombres.
	const ratingValue = rawRating.overallRating
		? parseFloat(rawRating.overallRating)
		: 0;

	return {
		id: rawRating.id,
		user_id: rawRating.reviewerId,
		item_id: rawRating.ratingForId,
		rating_type: rawRating.ratingType,
		rating: ratingValue,
		comment: rawRating.comment,
		is_visible: rawRating.isVisible,
		admin_response: rawRating.adminResponse,
		created_at: rawRating.createdAt,
		updated_at: rawRating.updatedAt,
		// Relations
		user_name: reviewer
			? `${reviewer.firstName} ${reviewer.lastName}`.trim()
			: `Utilisateur #${rawRating.reviewerId}`,
		user_email: reviewer ? reviewer.email : '',
		item_name: rawRating.itemName || `Item #${rawRating.ratingForId}`,
	};
};

const calculateStats = (ratingsData: RatingData[]): RatingStats => {
	const total = ratingsData.length;
	const visible = ratingsData.filter((r) => r.is_visible).length;
	const hidden = total - visible;
	const with_admin_response = ratingsData.filter(
		(r) => r.admin_response && r.admin_response.trim()
	).length;
	const average_rating =
		total > 0
			? ratingsData.reduce((sum, r) => sum + r.rating, 0) / total
			: 0;

	const ratings_distribution: Record<string, number> = {};
	for (let i = 1; i <= 5; i++) {
		ratings_distribution[`${i}`] = ratingsData.filter(
			(r) => Math.round(r.rating) === i
		).length;
	}

	return {
		total,
		visible,
		hidden,
		with_admin_response,
		average_rating,
		ratings_by_type: {
			service: ratingsData.filter((r) => r.rating_type === 'service')
				.length,
			delivery: ratingsData.filter((r) => r.rating_type === 'delivery')
				.length,
			prestataire: ratingsData.filter(
				(r) => r.rating_type === 'prestataire'
			).length,
			livreur: ratingsData.filter((r) => r.rating_type === 'livreur')
				.length,
		},
		ratings_distribution,
	};
};

export function useRatings() {
	const [ratings, setRatings] = useState<RatingData[]>([]);
	const [stats, setStats] = useState<RatingStats>({
		total: 0,
		visible: 0,
		hidden: 0,
		with_admin_response: 0,
		average_rating: 0,
		ratings_by_type: {
			service: 0,
			delivery: 0,
			prestataire: 0,
			livreur: 0,
		},
		ratings_distribution: {},
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRatings = useCallback(async () => {
		console.log('📦 [useRatings] Début du chargement des avis...');
		setLoading(true);
		setError(null);
		try {
			// Utilise le service centralisé au lieu de apiClient.get
			const rawRatingsData = await ratingService.getAllRatings();
			console.log(
				`📦 [useRatings] ${rawRatingsData.length} avis bruts reçus du service.`
			);

			const transformedRatings = rawRatingsData.map(transformRatingData);
			setRatings(transformedRatings);
			setStats(calculateStats(transformedRatings));

			console.log(
				`✅ [useRatings] ${transformedRatings.length} avis transformés et stockés.`
			);
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			console.error(
				'❌ [useRatings] Erreur chargement avis:',
				errorMessage
			);
			setError(errorMessage);
		} finally {
			setLoading(false);
			console.log('📦 [useRatings] Fin du chargement.');
		}
	}, []);

	useEffect(() => {
		fetchRatings();
	}, [fetchRatings]);

	return { ratings, stats, loading, error, refresh: fetchRatings };
}
