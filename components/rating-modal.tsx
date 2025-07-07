'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RatingModalProps {
	serviceName: string;
	providerName: string;
	serviceId: number;
	providerId: number;
	onSubmit: (data: RatingSubmissionData) => void;
	onCancel: () => void;
}

export interface RatingSubmissionData {
	overall_rating: number;
	punctuality_rating?: number;
	quality_rating?: number;
	communication_rating?: number;
	value_rating?: number;
	comment?: string;
	reviewed_id: number;
	rating_type: 'service';
	rating_for_id: number;
}

export default function RatingModal({
	serviceName,
	providerName,
	serviceId,
	providerId,
	onSubmit,
	onCancel,
}: RatingModalProps) {
	const [overallRating, setOverallRating] = useState(0);
	const [punctualityRating, setPunctualityRating] = useState(0);
	const [qualityRating, setQualityRating] = useState(0);
	const [communicationRating, setCommunicationRating] = useState(0);
	const [valueRating, setValueRating] = useState(0);
	const [comment, setComment] = useState('');
	const [hoveredStar, setHoveredStar] = useState<{
		category: string;
		value: number;
	} | null>(null);

	const StarRating = ({
		value,
		onChange,
		category,
	}: {
		value: number;
		onChange: (rating: number) => void;
		category: string;
	}) => (
		<div className='flex'>
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type='button'
					onClick={() => onChange(star)}
					onMouseEnter={() =>
						setHoveredStar({ category, value: star })
					}
					onMouseLeave={() => setHoveredStar(null)}
					className='cursor-pointer p-1'
				>
					<Star
						className={`h-6 w-6 ${
							star <=
							(hoveredStar?.category === category
								? hoveredStar.value
								: value)
								? 'text-yellow-400 fill-yellow-400'
								: 'text-gray-300'
						}`}
					/>
				</button>
			))}
		</div>
	);

	const handleSubmit = () => {
		const ratingData: RatingSubmissionData = {
			overall_rating: overallRating,
			punctuality_rating: punctualityRating || undefined,
			quality_rating: qualityRating || undefined,
			communication_rating: communicationRating || undefined,
			value_rating: valueRating || undefined,
			comment: comment.trim() || undefined,
			reviewed_id: providerId,
			rating_type: 'service',
			rating_for_id: serviceId,
		};

		onSubmit(ratingData);
	};

	return (
		<div className='w-full max-w-md mx-auto p-6'>
			<h3 className='text-xl font-semibold mb-4 text-center'>
				Évaluer ce service
			</h3>

			<p className='mb-6 text-center text-gray-600'>
				Comment évalueriez-vous{' '}
				<span className='font-medium text-gray-900'>{serviceName}</span>{' '}
				de{' '}
				<span className='font-medium text-gray-900'>
					{providerName}
				</span>
				?
			</p>

			<div className='space-y-4'>
				{/* Note globale (obligatoire) */}
				<div>
					<Label className='text-sm font-medium'>
						Note globale *
					</Label>
					<div className='flex items-center gap-2 mt-1'>
						<StarRating
							value={overallRating}
							onChange={setOverallRating}
							category='overall'
						/>
						<span className='text-sm text-gray-500'>
							{overallRating > 0
								? `${overallRating}/5`
								: 'Requis'}
						</span>
					</div>
				</div>

				{/* Notes détaillées (optionnelles) */}
				<div className='grid grid-cols-1 gap-3 pt-2'>
					<div>
						<Label className='text-sm'>Ponctualité</Label>
						<div className='flex items-center gap-2 mt-1'>
							<StarRating
								value={punctualityRating}
								onChange={setPunctualityRating}
								category='punctuality'
							/>
							<span className='text-sm text-gray-500'>
								{punctualityRating > 0
									? `${punctualityRating}/5`
									: 'Optionnel'}
							</span>
						</div>
					</div>

					<div>
						<Label className='text-sm'>Qualité du service</Label>
						<div className='flex items-center gap-2 mt-1'>
							<StarRating
								value={qualityRating}
								onChange={setQualityRating}
								category='quality'
							/>
							<span className='text-sm text-gray-500'>
								{qualityRating > 0
									? `${qualityRating}/5`
									: 'Optionnel'}
							</span>
						</div>
					</div>

					<div>
						<Label className='text-sm'>Communication</Label>
						<div className='flex items-center gap-2 mt-1'>
							<StarRating
								value={communicationRating}
								onChange={setCommunicationRating}
								category='communication'
							/>
							<span className='text-sm text-gray-500'>
								{communicationRating > 0
									? `${communicationRating}/5`
									: 'Optionnel'}
							</span>
						</div>
					</div>

					<div>
						<Label className='text-sm'>Rapport qualité/prix</Label>
						<div className='flex items-center gap-2 mt-1'>
							<StarRating
								value={valueRating}
								onChange={setValueRating}
								category='value'
							/>
							<span className='text-sm text-gray-500'>
								{valueRating > 0
									? `${valueRating}/5`
									: 'Optionnel'}
							</span>
						</div>
					</div>
				</div>

				{/* Commentaire */}
				<div className='pt-2'>
					<Label htmlFor='comment' className='text-sm font-medium'>
						Commentaire (optionnel)
					</Label>
					<Textarea
						id='comment'
						placeholder='Partagez votre expérience avec ce service...'
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						className='mt-1'
						rows={3}
					/>
				</div>
			</div>

			<div className='flex justify-end space-x-3 mt-6'>
				<Button variant='outline' onClick={onCancel}>
					Annuler
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={overallRating === 0}
					className='bg-blue-600 hover:bg-blue-700'
				>
					Publier l'avis
				</Button>
			</div>
		</div>
	);
}
