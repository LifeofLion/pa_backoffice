'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import {
	RatingData,
	RatingFilters,
	RatingType,
	AdminRatingResponse,
	RatingValidators,
} from '@/src/types/validators';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Star,
	MessageSquare,
	Eye,
	EyeOff,
	Filter,
	Search,
	Reply,
	Award,
} from 'lucide-react';
import { ratingService } from '@/services/rating-service';
import { useRatings } from '@/hooks/use-ratings'; // Importation du hook

export function RatingsManagement() {
	const { t } = useLanguage();
	const { toast } = useToast();

	// Utilisation du hook pour gérer les données
	const { ratings, stats, loading, error, refresh } = useRatings();

	// Gérer l'affichage des erreurs
	useEffect(() => {
		if (error) {
			toast({
				title: 'Erreur',
				description: `Impossible de charger les avis: ${error}`,
				variant: 'destructive',
			});
		}
	}, [error, toast]);

	// Filtres et recherche (conservés dans le composant)
	const [filters, setFilters] = useState<RatingFilters>({});
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);

	// Dialogues (conservés dans le composant)
	const [selectedRating, setSelectedRating] = useState<RatingData | null>(
		null
	);
	const [responseDialog, setResponseDialog] = useState(false);
	const [adminResponse, setAdminResponse] = useState('');

	const handleAddAdminResponse = useCallback(async () => {
		if (!selectedRating || !adminResponse.trim()) return;

		try {
			const responseData: AdminRatingResponse = {
				admin_response: adminResponse.trim(),
			};

			const validationErrors =
				RatingValidators.validateAdminRatingResponse(responseData);
			if (validationErrors.length > 0) {
				toast({
					title: 'Erreur de validation',
					description: validationErrors.join(', '),
					variant: 'destructive',
				});
				return;
			}

			// Utilisation du service
			await ratingService.addAdminResponse(
				selectedRating.id,
				responseData
			);

			toast({
				title: 'Succès',
				description: 'Réponse admin ajoutée avec succès',
			});

			setResponseDialog(false);
			setSelectedRating(null);
			setAdminResponse('');
			await refresh(); // Utilise la fonction de rafraîchissement du hook
		} catch (error) {
			toast({
				title: 'Erreur',
				description: `Impossible d'ajouter la réponse: ${getErrorMessage(
					error
				)}`,
				variant: 'destructive',
			});
		}
	}, [selectedRating, adminResponse, refresh, toast]);

	const handleToggleVisibility = useCallback(
		async (rating: RatingData) => {
			try {
				// Utilisation du service
				await ratingService.toggleVisibility(rating.id);

				toast({
					title: 'Succès',
					description: `Avis ${
						rating.is_visible ? 'masqué' : 'rendu visible'
					}`,
				});

				await refresh(); // Utilise la fonction de rafraîchissement du hook
			} catch (error) {
				toast({
					title: 'Erreur',
					description: `Impossible de modifier la visibilité: ${getErrorMessage(
						error
					)}`,
					variant: 'destructive',
				});
			}
		},
		[refresh, toast]
	);

	const filteredRatings = useCallback(() => {
		let filtered = [...ratings];

		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(rating) =>
					rating.user_name.toLowerCase().includes(term) ||
					rating.user_email.toLowerCase().includes(term) ||
					rating.item_name.toLowerCase().includes(term) ||
					(rating.comment &&
						rating.comment.toLowerCase().includes(term)) ||
					rating.id.toString().includes(term)
			);
		}
		// NOTE: Le filtrage par "filters" (type, note, etc.) doit être implémenté
		// si vous souhaitez un filtrage côté client en plus de la recherche.
		// Pour l'instant, seul le searchTerm est appliqué.
		return filtered;
	}, [ratings, searchTerm]);

	// ==========================================================================
	// UTILITAIRES UI
	// ==========================================================================

	const formatDate = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleDateString('fr-FR');
		} catch {
			return dateString;
		}
	};

	const renderStars = (rating: number) => {
		return (
			<div className='flex'>
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`h-4 w-4 ${
							star <= rating
								? 'text-yellow-400 fill-current'
								: 'text-gray-300'
						}`}
					/>
				))}
			</div>
		);
	};

	const getTypeLabel = (type: RatingType): string => {
		switch (type) {
			case 'service':
				return 'Service';
			case 'delivery':
				return 'Livraison';
			case 'prestataire':
				return 'Prestataire';
			case 'livreur':
				return 'Livreur';
			default:
				return type;
		}
	};

	const getTypeColor = (type: RatingType): string => {
		switch (type) {
			case 'service':
				return 'bg-blue-100 text-blue-800';
			case 'delivery':
				return 'bg-green-100 text-green-800';
			case 'prestataire':
				return 'bg-purple-100 text-purple-800';
			case 'livreur':
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getVisibilityBadgeVariant = (
		isVisible: boolean
	): 'default' | 'secondary' | 'destructive' | 'outline' => {
		return isVisible ? 'default' : 'outline';
	};

	// ==========================================================================
	// RENDU DU COMPOSANT
	// ==========================================================================

	if (loading && ratings.length === 0) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-green-500'></div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						Gestion des Avis
					</h1>
					<p className='text-muted-foreground'>
						Gérez tous les avis et évaluations de la plateforme
					</p>
				</div>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						onClick={() => setShowFilters(!showFilters)}
						className='flex items-center gap-2'
					>
						<Filter className='h-4 w-4' />
						Filtres
					</Button>
					<Button
						onClick={refresh}
						disabled={loading}
						className='flex items-center gap-2'
					>
						{loading ? (
							<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
						) : (
							'Actualiser'
						)}
					</Button>
				</div>
			</div>

			{/* Statistiques */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Avis
						</CardTitle>
						<MessageSquare className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.total}</div>
						<p className='text-xs text-muted-foreground'>
							{stats.visible} visibles, {stats.hidden} masqués
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Note Moyenne
						</CardTitle>
						<Star className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{typeof stats.average_rating === 'number'
								? `${stats.average_rating.toFixed(1)}/5`
								: 'N/A'}
						</div>
						<div className='flex items-center gap-1'>
							{renderStars(Math.round(stats.average_rating))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Réponses Admin
						</CardTitle>
						<Reply className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.with_admin_response}
						</div>
						<p className='text-xs text-muted-foreground'>
							{stats.total > 0
								? Math.round(
										(stats.with_admin_response /
											stats.total) *
											100
								  )
								: 0}
							% avec réponse
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							5 Étoiles
						</CardTitle>
						<Award className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.ratings_distribution['5'] || 0}
						</div>
						<p className='text-xs text-muted-foreground'>
							Excellentes évaluations
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtres */}
			{showFilters && (
				<Card>
					<CardHeader>
						<CardTitle>Filtres</CardTitle>
						<CardDescription>
							Filtrez les avis selon vos critères
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid gap-4 md:grid-cols-4'>
							<div>
								<Label>Type d'avis</Label>
								<Select
									value={filters.rating_type || ''}
									onValueChange={(value) =>
										setFilters({
											...filters,
											rating_type:
												value && value !== 'all'
													? (value as RatingType)
													: undefined,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Tous les types' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>
											Tous
										</SelectItem>
										<SelectItem value='service'>
											Service
										</SelectItem>
										<SelectItem value='delivery'>
											Livraison
										</SelectItem>
										<SelectItem value='prestataire'>
											Prestataire
										</SelectItem>
										<SelectItem value='livreur'>
											Livreur
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Note</Label>
								<Select
									value={filters.rating?.toString() || ''}
									onValueChange={(value) =>
										setFilters({
											...filters,
											rating:
												value && value !== 'all'
													? parseInt(value)
													: undefined,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Toutes les notes' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>
											Toutes
										</SelectItem>
										<SelectItem value='5'>
											5 étoiles
										</SelectItem>
										<SelectItem value='4'>
											4 étoiles
										</SelectItem>
										<SelectItem value='3'>
											3 étoiles
										</SelectItem>
										<SelectItem value='2'>
											2 étoiles
										</SelectItem>
										<SelectItem value='1'>
											1 étoile
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Visibilité</Label>
								<Select
									value={
										filters.is_visible !== undefined
											? filters.is_visible.toString()
											: ''
									}
									onValueChange={(value) =>
										setFilters({
											...filters,
											is_visible:
												value && value !== 'all'
													? value === 'true'
													: undefined,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Toutes les visibilités' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>
											Toutes
										</SelectItem>
										<SelectItem value='true'>
											Visible
										</SelectItem>
										<SelectItem value='false'>
											Masqué
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Réponse admin</Label>
								<Select
									value={
										filters.has_admin_response !== undefined
											? filters.has_admin_response.toString()
											: ''
									}
									onValueChange={(value) =>
										setFilters({
											...filters,
											has_admin_response:
												value && value !== 'all'
													? value === 'true'
													: undefined,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Toutes les réponses' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>
											Toutes
										</SelectItem>
										<SelectItem value='true'>
											Avec réponse
										</SelectItem>
										<SelectItem value='false'>
											Sans réponse
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='flex gap-2'>
							<Button onClick={() => refresh()}>Appliquer</Button>
							<Button
								variant='outline'
								onClick={() => setFilters({})}
							>
								Réinitialiser
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Recherche */}
			<div className='flex items-center space-x-2'>
				<Search className='h-4 w-4 text-muted-foreground' />
				<Input
					placeholder='Rechercher par utilisateur, commentaire...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='max-w-sm'
				/>
			</div>

			{/* Tableau des avis */}
			<Card>
				<CardHeader>
					<CardTitle>Avis ({filteredRatings().length})</CardTitle>
					<CardDescription>
						Liste de tous les avis avec leurs détails
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Utilisateur</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Élément évalué</TableHead>
								<TableHead>Note</TableHead>
								<TableHead>Commentaire</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRatings().map((rating) => (
								<TableRow key={rating.id}>
									<TableCell className='font-medium'>
										#{rating.id}
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{rating.user_name}
											</div>
											<div className='text-sm text-muted-foreground'>
												{rating.user_email}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											className={getTypeColor(
												rating.rating_type
											)}
										>
											{getTypeLabel(rating.rating_type)}
										</Badge>
									</TableCell>
									<TableCell>
										<div className='font-medium'>
											{rating.item_name}
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-2'>
											{renderStars(rating.rating)}
											<span className='text-sm font-medium'>
												{typeof rating.rating ===
												'number'
													? `${rating.rating.toFixed(
															1
													  )}/5`
													: 'N/A'}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className='max-w-xs'>
											{rating.comment ? (
												<p
													className='text-sm truncate'
													title={rating.comment}
												>
													{rating.comment}
												</p>
											) : (
												<span className='text-sm text-muted-foreground'>
													Aucun commentaire
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className='space-y-1'>
											<Badge
												variant={getVisibilityBadgeVariant(
													rating.is_visible
												)}
											>
												{rating.is_visible
													? 'Visible'
													: 'Masqué'}
											</Badge>
											{rating.admin_response && (
												<Badge
													variant='secondary'
													className='block'
												>
													Réponse admin
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className='text-sm'>
											{formatDate(rating.created_at)}
										</div>
									</TableCell>
									<TableCell>
										<div className='flex gap-1'>
											<Button
												variant='outline'
												size='sm'
												onClick={() =>
													handleToggleVisibility(
														rating
													)
												}
												title={
													rating.is_visible
														? 'Masquer'
														: 'Rendre visible'
												}
											>
												{rating.is_visible ? (
													<EyeOff className='h-3 w-3' />
												) : (
													<Eye className='h-3 w-3' />
												)}
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() => {
													setSelectedRating(rating);
													setAdminResponse(
														rating.admin_response ||
															''
													);
													setResponseDialog(true);
												}}
												title='Répondre'
											>
												<Reply className='h-3 w-3' />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{filteredRatings().length === 0 && (
						<div className='text-center py-8'>
							<p className='text-muted-foreground'>
								Aucun avis trouvé
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog de réponse admin */}
			<Dialog open={responseDialog} onOpenChange={setResponseDialog}>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>
							Répondre à l'avis #{selectedRating?.id}
						</DialogTitle>
						<DialogDescription>
							Ajouter ou modifier la réponse administrateur à cet
							avis
						</DialogDescription>
					</DialogHeader>

					{selectedRating && (
						<div className='space-y-4'>
							{/* Détails de l'avis */}
							<Card>
								<CardContent className='pt-4'>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<div>
												<span className='font-medium'>
													{selectedRating.user_name}
												</span>
												<Badge
													className={`ml-2 ${getTypeColor(
														selectedRating.rating_type
													)}`}
												>
													{getTypeLabel(
														selectedRating.rating_type
													)}
												</Badge>
											</div>
											<div className='flex items-center gap-2'>
												{renderStars(
													selectedRating.rating
												)}
												<span className='font-medium'>
													{typeof selectedRating.rating ===
													'number'
														? `${selectedRating.rating.toFixed(
																1
														  )}/5`
														: 'N/A'}
												</span>
											</div>
										</div>
										<div className='text-sm text-muted-foreground'>
											{selectedRating.item_name} •{' '}
											{formatDate(
												selectedRating.created_at
											)}
										</div>
										{selectedRating.comment && (
											<div className='mt-2 p-3 bg-gray-50 rounded-md'>
												<p className='text-sm'>
													{selectedRating.comment}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Zone de réponse */}
							<div>
								<Label>Réponse administrateur</Label>
								<Textarea
									placeholder='Tapez votre réponse ici...'
									value={adminResponse}
									onChange={(e) =>
										setAdminResponse(e.target.value)
									}
									rows={4}
									className='mt-1'
								/>
								<p className='text-xs text-muted-foreground mt-1'>
									Cette réponse sera visible par tous les
									utilisateurs
								</p>
							</div>

							<div className='flex gap-2 justify-end'>
								<Button
									variant='outline'
									onClick={() => setResponseDialog(false)}
								>
									Annuler
								</Button>
								<Button
									onClick={handleAddAdminResponse}
									disabled={!adminResponse.trim()}
								>
									{selectedRating.admin_response
										? 'Modifier la réponse'
										: 'Ajouter la réponse'}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
