'use client';

import { useState, useEffect } from 'react';
import {
	Star,
	MessageCircle,
	TrendingUp,
	Clock,
	Award,
	DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';

interface Review {
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

interface ProviderReviewsProps {
	prestataireId: number;
	prestataireNom: string;
}

interface DetailedAverages {
	overall: number | null;
	punctuality: number | null;
	quality: number | null;
	communication: number | null;
	value: number | null;
}

export default function ProviderReviews({
	prestataireId,
	prestataireNom,
}: ProviderReviewsProps) {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [averageRating, setAverageRating] = useState<number | null>(null);
	const [detailedAverages, setDetailedAverages] = useState<DetailedAverages>({
		overall: null,
		punctuality: null,
		quality: null,
		communication: null,
		value: null,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showAllReviews, setShowAllReviews] = useState(false);

	useEffect(() => {
		loadReviews();
	}, [prestataireId]);

	const loadReviews = async () => {
		try {
			setLoading(true);
			const BACKEND_URL =
				process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3333';
			const response = await fetch(
				`${BACKEND_URL}/ratings/prestataire/${prestataireId}`
			);

			if (!response.ok) {
				throw new Error('Erreur lors du chargement des avis');
			}

			const data = await response.json();
			setReviews(data.reviews || []);
			setAverageRating(data.average_rating);

			// Calculer les moyennes détaillées
			if (data.reviews && data.reviews.length > 0) {
				const averages = calculateDetailedAverages(data.reviews);
				setDetailedAverages(averages);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			setLoading(false);
		}
	};

	const calculateDetailedAverages = (
		reviewsData: Review[]
	): DetailedAverages => {
		const calculate = (field: keyof Review) => {
			const validRatings = reviewsData
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
	};

	const renderStars = (
		rating: number | null,
		size: 'sm' | 'md' | 'lg' = 'md'
	) => {
		if (!rating)
			return <span className='text-gray-400 text-sm'>Non évalué</span>;

		const sizeClasses = {
			sm: 'h-3 w-3',
			md: 'h-4 w-4',
			lg: 'h-5 w-5',
		};

		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 !== 0;

		for (let i = 0; i < fullStars; i++) {
			stars.push(
				<Star
					key={`full-${i}`}
					className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
				/>
			);
		}

		if (hasHalfStar) {
			stars.push(
				<Star
					key='half'
					className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400 opacity-50`}
				/>
			);
		}

		const emptyStars = 5 - Math.ceil(rating);
		for (let i = 0; i < emptyStars; i++) {
			stars.push(
				<Star
					key={`empty-${i}`}
					className={`${sizeClasses[size]} text-gray-300`}
				/>
			);
		}

		return (
			<div className='flex items-center gap-1'>
				<div className='flex'>{stars}</div>
				<span className='text-sm text-gray-600 ml-1'>({rating})</span>
			</div>
		);
	};

	const formatDate = (dateString: string) => {
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
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((word) => word.charAt(0))
			.join('')
			.toUpperCase()
			.substring(0, 2);
	};

	const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

	if (loading) {
		return (
			<Card>
				<CardContent className='flex items-center justify-center p-8'>
					<div className='text-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
						<p className='text-gray-500'>Chargement des avis...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className='flex items-center justify-center p-8'>
					<p className='text-red-500'>Erreur: {error}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Résumé des notes */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Star className='h-5 w-5 text-yellow-500' />
						Évaluations de {prestataireNom}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{reviews.length === 0 ? (
						<p className='text-gray-500 text-center py-4'>
							Aucun avis disponible pour ce prestataire
						</p>
					) : (
						<div className='space-y-4'>
							{/* Note globale */}
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-2xl font-bold'>
										{averageRating}/5
									</p>
									<p className='text-sm text-gray-500'>
										{reviews.length} avis
									</p>
								</div>
								<div className='text-right'>
									{renderStars(averageRating, 'lg')}
								</div>
							</div>

							<Separator />

							{/* Notes détaillées */}
							<div className='grid grid-cols-2 gap-4'>
								<div className='flex items-center gap-2'>
									<Clock className='h-4 w-4 text-blue-500' />
									<span className='text-sm'>Ponctualité</span>
									<div className='ml-auto'>
										{renderStars(
											detailedAverages.punctuality,
											'sm'
										)}
									</div>
								</div>

								<div className='flex items-center gap-2'>
									<Award className='h-4 w-4 text-green-500' />
									<span className='text-sm'>Qualité</span>
									<div className='ml-auto'>
										{renderStars(
											detailedAverages.quality,
											'sm'
										)}
									</div>
								</div>

								<div className='flex items-center gap-2'>
									<MessageCircle className='h-4 w-4 text-purple-500' />
									<span className='text-sm'>
										Communication
									</span>
									<div className='ml-auto'>
										{renderStars(
											detailedAverages.communication,
											'sm'
										)}
									</div>
								</div>

								<div className='flex items-center gap-2'>
									<DollarSign className='h-4 w-4 text-orange-500' />
									<span className='text-sm'>
										Rapport qualité/prix
									</span>
									<div className='ml-auto'>
										{renderStars(
											detailedAverages.value,
											'sm'
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Liste des avis */}
			{reviews.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Avis clients</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{displayedReviews.map((review, index) => (
							<div key={review.id}>
								<div className='flex items-start gap-3'>
									<Avatar className='w-10 h-10'>
										<AvatarFallback>
											{getInitials(review.client_name)}
										</AvatarFallback>
									</Avatar>

									<div className='flex-1 space-y-2'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<span className='font-medium'>
													{review.client_name}
												</span>
												{review.is_verified_purchase && (
													<Badge
														variant='secondary'
														className='text-xs'
													>
														✓ Achat vérifié
													</Badge>
												)}
											</div>
											<div className='text-right'>
												{renderStars(
													review.rating,
													'sm'
												)}
												<p className='text-xs text-gray-500 mt-1'>
													{formatDate(
														review.created_at
													)}
												</p>
											</div>
										</div>

										{review.service_name && (
											<p className='text-sm text-gray-600'>
												Service:{' '}
												<span className='font-medium'>
													{review.service_name}
												</span>
											</p>
										)}

										{review.comment && (
											<p className='text-sm text-gray-700'>
												{review.comment}
											</p>
										)}

										{/* Notes détaillées pour cet avis */}
										{(review.punctuality_rating ||
											review.quality_rating ||
											review.communication_rating ||
											review.value_rating) && (
											<div className='flex flex-wrap gap-4 pt-2 text-xs'>
												{review.punctuality_rating && (
													<span className='text-gray-600'>
														Ponctualité:{' '}
														{
															review.punctuality_rating
														}
														/5
													</span>
												)}
												{review.quality_rating && (
													<span className='text-gray-600'>
														Qualité:{' '}
														{review.quality_rating}
														/5
													</span>
												)}
												{review.communication_rating && (
													<span className='text-gray-600'>
														Communication:{' '}
														{
															review.communication_rating
														}
														/5
													</span>
												)}
												{review.value_rating && (
													<span className='text-gray-600'>
														Rapport qualité/prix:{' '}
														{review.value_rating}/5
													</span>
												)}
											</div>
										)}
									</div>
								</div>

								{index < displayedReviews.length - 1 && (
									<Separator className='my-4' />
								)}
							</div>
						))}

						{/* Bouton pour voir plus d'avis */}
						{reviews.length > 3 && (
							<div className='text-center pt-4'>
								<Button
									variant='outline'
									onClick={() =>
										setShowAllReviews(!showAllReviews)
									}
								>
									{showAllReviews
										? 'Voir moins'
										: `Voir tous les avis (${reviews.length})`}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
