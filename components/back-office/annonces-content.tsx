'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
	Package,
	Truck,
	Users,
	TrendingUp,
	Search,
	MapPin,
	Calendar,
	Euro,
	Eye,
} from 'lucide-react';

import { useAnnouncements, type Annonce } from '@/hooks/use-announcements';

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function getStatusBadgeColor(status: string) {
	switch (status) {
		case 'active':
			return 'bg-green-100 text-green-800';
		case 'pending':
			return 'bg-yellow-100 text-yellow-800';
		case 'completed':
			return 'bg-blue-100 text-blue-800';
		case 'cancelled':
			return 'bg-red-100 text-red-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

function getStatusLabel(status: string) {
	switch (status) {
		case 'active':
			return 'En cours';
		case 'pending':
			return 'En attente';
		case 'completed':
			return 'Terminé';
		case 'cancelled':
			return 'Annulé';
		default:
			return status;
	}
}

function getTypeBadgeColor(type: string) {
	switch (type) {
		case 'transport_colis':
			return 'bg-purple-100 text-purple-800';
		case 'course':
			return 'bg-orange-100 text-orange-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

function getUserTypeBadge(userType?: string) {
	switch (userType) {
		case 'commercant':
			return (
				<Badge className='bg-blue-100 text-blue-800'>Commerçant</Badge>
			);
		case 'client':
			return (
				<Badge className='bg-green-100 text-green-800'>Client</Badge>
			);
		default:
			return <Badge className='bg-gray-100 text-gray-800'>Inconnu</Badge>;
	}
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString('fr-FR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatPrice(price: number) {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
	}).format(price);
}

// =============================================================================
// COMPOSANT ANNONCES CONTENT
// =============================================================================

export function AnnoncesContent() {
	const { getAnnouncements, loading, error, clearError, retry } =
		useAnnouncements();
	const [annonces, setAnnonces] = useState<Annonce[]>([]);

	// Filtres
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedType, setSelectedType] = useState('all');
	const [selectedStatus, setSelectedStatus] = useState('all');
	const [selectedUserType, setSelectedUserType] = useState('all');

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 20;

	// =============================================================================
	// CHARGEMENT DES DONNÉES
	// =============================================================================

	const loadAnnonces = async () => {
		try {
			console.log('🔍 Chargement des annonces avec le hook...');
			const data = await getAnnouncements();
			setAnnonces(data);
		} catch (err) {
			console.error('❌ Erreur lors du chargement:', err);
			// L'erreur est déjà gérée par le hook
		}
	};

	useEffect(() => {
		loadAnnonces();
	}, []);

	// =============================================================================
	// FILTRAGE ET STATISTIQUES
	// =============================================================================

	const filteredAnnonces = useMemo(() => {
		return annonces.filter((annonce) => {
			// Filtre de recherche
			const matchesSearch =
				!searchQuery ||
				annonce.title
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				annonce.description
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				(annonce.userName || '')
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				annonce.start_location
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				annonce.end_location
					.toLowerCase()
					.includes(searchQuery.toLowerCase());

			// Filtre de type
			const matchesType =
				selectedType === 'all' || annonce.type === selectedType;

			// Filtre de statut
			const matchesStatus =
				selectedStatus === 'all' || annonce.status === selectedStatus;

			// Filtre de type d'utilisateur
			const matchesUserType =
				selectedUserType === 'all' ||
				annonce.userType === selectedUserType;

			return (
				matchesSearch && matchesType && matchesStatus && matchesUserType
			);
		});
	}, [annonces, searchQuery, selectedType, selectedStatus, selectedUserType]);

	const statistics = useMemo(() => {
		const stats = {
			total: annonces.length,
			byType: {
				transport_colis: 0,
				course: 0,
			},
			byStatus: {
				active: 0,
				pending: 0,
				completed: 0,
				cancelled: 0,
			},
			byUserType: {
				clients: 0,
				commercants: 0,
			},
			// Nouvelle stat : colis créés par les commerçants
			commercantPackages: 0,
		};

		annonces.forEach((annonce) => {
			// Par type
			if (annonce.type === 'transport_colis')
				stats.byType.transport_colis++;
			if (annonce.type === 'course') stats.byType.course++;

			// Par statut
			stats.byStatus[annonce.status as keyof typeof stats.byStatus]++;

			// Par type d'utilisateur
			if (annonce.userType === 'client') stats.byUserType.clients++;
			if (annonce.userType === 'commercant') {
				stats.byUserType.commercants++;
				// Compter les colis des commerçants (shopkeeper deliveries)
				if (annonce.source === 'shopkeeper') {
					stats.commercantPackages++;
				}
			}
		});

		return stats;
	}, [annonces]);

	// Pagination
	const totalPages = Math.ceil(filteredAnnonces.length / itemsPerPage);
	const paginatedAnnonces = filteredAnnonces.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// =============================================================================
	// GESTION DES ERREURS ET RETRY
	// =============================================================================

	const handleRetry = () => {
		clearError();
		loadAnnonces();
	};

	// =============================================================================
	// RENDU
	// =============================================================================

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Chargement des annonces...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<Card className='border-red-200'>
				<CardContent className='pt-6'>
					<div className='text-center text-red-600'>
						<p className='font-medium'>Erreur lors du chargement</p>
						<p className='text-sm mt-1'>{error}</p>
						<Button
							onClick={handleRetry}
							variant='outline'
							className='mt-4'
						>
							Réessayer
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						Gestion des Annonces
					</h1>
					<p className='text-gray-600 mt-2'>
						Gérez toutes les annonces de transport de colis et
						courses de la plateforme
					</p>
				</div>
				<Button onClick={loadAnnonces} variant='outline'>
					<TrendingUp className='w-4 h-4 mr-2' />
					Actualiser
				</Button>
			</div>

			{/* Statistiques */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Annonces
						</CardTitle>
						<Package className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{statistics.total}
						</div>
						<p className='text-xs text-muted-foreground'>
							{filteredAnnonces.length !== statistics.total &&
								`${filteredAnnonces.length} filtrées`}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Transport de Colis
						</CardTitle>
						<Truck className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{statistics.byType.transport_colis}
						</div>
						<p className='text-xs text-muted-foreground'>
							{(
								(statistics.byType.transport_colis /
									statistics.total) *
								100
							).toFixed(1)}
							% du total
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Colis Commerçants
						</CardTitle>
						<Package className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{statistics.commercantPackages || 0}
						</div>
						<p className='text-xs text-muted-foreground'>
							{statistics.commercantPackages > 0
								? (
										(statistics.commercantPackages /
											statistics.total) *
										100
								  ).toFixed(1)
								: '0'}
							% du total
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Clients & Courses
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{statistics.byUserType.clients}
						</div>
						<p className='text-xs text-muted-foreground'>
							Courses: {statistics.byType.course}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filtres */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>
						Filtres et Recherche
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
						{/* Recherche */}
						<div className='lg:col-span-2'>
							<div className='relative'>
								<Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
								<Input
									placeholder='Rechercher par titre, description, utilisateur...'
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className='pl-10'
								/>
							</div>
						</div>

						{/* Filtre Type */}
						<Select
							value={selectedType}
							onValueChange={setSelectedType}
						>
							<SelectTrigger>
								<SelectValue placeholder="Type d'annonce" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les types
								</SelectItem>
								<SelectItem value='transport_colis'>
									Transport de colis
								</SelectItem>
								<SelectItem value='course'>Course</SelectItem>
							</SelectContent>
						</Select>

						{/* Filtre Statut */}
						<Select
							value={selectedStatus}
							onValueChange={setSelectedStatus}
						>
							<SelectTrigger>
								<SelectValue placeholder='Statut' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les statuts
								</SelectItem>
								<SelectItem value='active'>En cours</SelectItem>
								<SelectItem value='pending'>
									En attente
								</SelectItem>
								<SelectItem value='completed'>
									Terminé
								</SelectItem>
								<SelectItem value='cancelled'>
									Annulé
								</SelectItem>
							</SelectContent>
						</Select>

						{/* Filtre Type d'utilisateur */}
						<Select
							value={selectedUserType}
							onValueChange={setSelectedUserType}
						>
							<SelectTrigger>
								<SelectValue placeholder="Type d'utilisateur" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les utilisateurs
								</SelectItem>
								<SelectItem value='client'>Clients</SelectItem>
								<SelectItem value='commercant'>
									Commerçants
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Tableau des annonces */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>
						Liste des Annonces ({filteredAnnonces.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Annonce</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Utilisateur</TableHead>
									<TableHead>Trajets</TableHead>
									<TableHead>Prix</TableHead>
									<TableHead>Statut</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedAnnonces.map((annonce, index) => (
									<TableRow
										key={`${annonce.source || 'unknown'}_${
											annonce.id
										}_${index}`}
									>
										<TableCell>
											<div className='font-medium'>
												{annonce.title}
											</div>
											{annonce.description && (
												<div className='text-sm text-gray-500 truncate max-w-xs'>
													{annonce.description}
												</div>
											)}
											{annonce.priority && (
												<Badge className='bg-red-100 text-red-800 text-xs mt-1'>
													Priorité
												</Badge>
											)}
										</TableCell>
										<TableCell>
											<Badge
												className={getTypeBadgeColor(
													annonce.type
												)}
											>
												{annonce.type ===
												'transport_colis'
													? 'Transport'
													: 'Course'}
											</Badge>
										</TableCell>
										<TableCell>
											<div className='space-y-1'>
												<div className='font-medium text-sm'>
													{annonce.userName ||
														'Utilisateur inconnu'}
												</div>
												{getUserTypeBadge(
													annonce.userType
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className='space-y-1'>
												<div className='flex items-center text-xs text-gray-600'>
													<MapPin className='w-3 h-3 mr-1' />
													{annonce.start_location}
												</div>
												<div className='flex items-center text-xs text-gray-600'>
													<MapPin className='w-3 h-3 mr-1' />
													{annonce.end_location}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center'>
												<Euro className='w-4 h-4 mr-1 text-green-600' />
												{formatPrice(annonce.price)}
											</div>
										</TableCell>
										<TableCell>
											<Badge
												className={getStatusBadgeColor(
													annonce.status
												)}
											>
												{getStatusLabel(annonce.status)}
											</Badge>
										</TableCell>
										<TableCell>
											<div className='flex items-center text-sm text-gray-600'>
												<Calendar className='w-4 h-4 mr-1' />
												{formatDate(annonce.created_at)}
											</div>
										</TableCell>
										<TableCell>
											<Link
												href={`/admin/annonces/${annonce.id}`}
											>
												<Button
													size='sm'
													variant='outline'
												>
													<Eye className='w-4 h-4 mr-1' />
													Voir
												</Button>
											</Link>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className='flex items-center justify-between px-2 py-4'>
							<div className='text-sm text-gray-500'>
								Page {currentPage} sur {totalPages} (
								{filteredAnnonces.length} résultats)
							</div>
							<div className='flex items-center space-x-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setCurrentPage(
											Math.max(1, currentPage - 1)
										)
									}
									disabled={currentPage === 1}
								>
									Précédent
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setCurrentPage(
											Math.min(
												totalPages,
												currentPage + 1
											)
										)
									}
									disabled={currentPage === totalPages}
								>
									Suivant
								</Button>
							</div>
						</div>
					)}

					{filteredAnnonces.length === 0 && (
						<div className='text-center py-8 text-gray-500'>
							<Package className='w-12 h-12 mx-auto mb-4 text-gray-300' />
							<p>
								Aucune annonce trouvée avec les filtres actuels
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
