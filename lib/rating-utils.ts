// Utilitaires pour la gestion des ratings et avis

export interface RatingData {
	id: number;
	client_name: string;
	overall_rating: number | string;
	punctuality_rating?: number | string;
	quality_rating?: number | string;
	communication_rating?: number | string;
	value_rating?: number | string;
	comment?: string;
	service_name?: string;
	is_verified_purchase: boolean;
	created_at: string;
}

export interface RatingAverages {
	overall: number;
	punctuality: number | null;
	quality: number | null;
	communication: number | null;
	value: number | null;
}

/**
 * Formate une note de manière sécurisée
 */
export function formatRating(value: any): string {
	if (value === null || value === undefined || value === '') return 'N/A';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	return !isNaN(num) && num > 0 ? num.toFixed(1) : 'N/A';
}

/**
 * Calcule la moyenne sécurisée d'un tableau de valeurs
 */
export function calculateSafeAverage(
	values: (number | string | null | undefined)[]
): number {
	const validValues = values
		.map((v) => {
			if (v === null || v === undefined || v === '') return null;
			const num = typeof v === 'string' ? parseFloat(v) : v;
			return !isNaN(num) && num > 0 ? num : null;
		})
		.filter((v) => v !== null) as number[];

	return validValues.length > 0
		? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
		: 0;
}

/**
 * Calcule les moyennes détaillées à partir d'une liste d'avis
 */
export function calculateDetailedAverages(
	reviews: RatingData[]
): RatingAverages {
	if (!reviews || reviews.length === 0) {
		return {
			overall: 0,
			punctuality: null,
			quality: null,
			communication: null,
			value: null,
		};
	}

	const calculate = (field: keyof RatingData) => {
		const values = reviews.map((r) => r[field]);
		const average = calculateSafeAverage(values);
		return average > 0 ? Math.round(average * 10) / 10 : null;
	};

	return {
		overall: calculate('overall_rating') || 0,
		punctuality: calculate('punctuality_rating'),
		quality: calculate('quality_rating'),
		communication: calculate('communication_rating'),
		value: calculate('value_rating'),
	};
}

/**
 * Calcule le pourcentage de satisfaction (notes >= 4)
 */
export function calculateSatisfactionRate(reviews: RatingData[]): number {
	if (!reviews || reviews.length === 0) return 0;

	const satisfiedReviews = reviews.filter((r) => {
		const rating =
			typeof r.overall_rating === 'string'
				? parseFloat(r.overall_rating)
				: r.overall_rating;
		return !isNaN(rating) && rating >= 4;
	});

	return Math.round((satisfiedReviews.length / reviews.length) * 100);
}

/**
 * Formate une date de manière lisible
 */
export function formatReviewDate(dateString: string): string {
	try {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}).format(date);
	} catch {
		return 'Date inconnue';
	}
}

/**
 * Obtient les initiales d'un nom
 */
export function getInitials(name: string): string {
	return name
		.split(' ')
		.map((word) => word.charAt(0))
		.join('')
		.toUpperCase()
		.substring(0, 2);
}
