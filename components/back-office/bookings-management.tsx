'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import {
	BookingData,
	BookingStats,
	BookingFilters,
	BookingStatus,
	BookingStatusUpdateRequest,
	BookingValidators,
	ServiceData,
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
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Clock,
	MapPin,
	Euro,
	User,
	Star,
	Filter,
	Search,
	Plus,
	Edit,
	Trash2,
	Eye,
	CalendarIcon,
} from 'lucide-react';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export function BookingsManagement() {
	const { t } = useLanguage();
	const { toast } = useToast();

	// ==========================================================================
	// ÉTAT DU COMPOSANT
	// ==========================================================================

	const [bookings, setBookings] = useState<BookingData[]>([]);
	const [stats, setStats] = useState<BookingStats>({
		total: 0,
		pending: 0,
		confirmed: 0,
		in_progress: 0,
		completed: 0,
		cancelled: 0,
		total_revenue: 0,
		average_booking_value: 0,
		growth_rate: 0,
	});
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	// Filtres et recherche
	const [filters, setFilters] = useState<BookingFilters>({});
	const [searchTerm, setSearchTerm] = useState('');
	const [showFilters, setShowFilters] = useState(false);

	// Dialogues
	const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
		null
	);
	const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
	const [newStatus, setNewStatus] = useState<BookingStatus>('pending');
	const [statusNotes, setStatusNotes] = useState('');

	// === States for new booking dialog ===
	const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
	const [bookingClients, setBookingClients] = useState<any[]>([]);
	const [bookingServices, setBookingServices] = useState<ServiceData[]>([]);
	const [bookingClientId, setBookingClientId] = useState('');
	const [bookingServiceId, setBookingServiceId] = useState('');
	const [bookingDate, setBookingDate] = useState(''); // ISO string via input datetime-local
	const [bookingNotes, setBookingNotes] = useState('');

	const openNewBookingDialog = async () => {
		setNewBookingDialogOpen(true);
		try {
			if (bookingClients.length === 0) {
				const users = await apiClient.getAllUsers();
				const clients = users.filter((u: any) => u.client);
				setBookingClients(clients);
			}
			if (bookingServices.length === 0) {
				const svc = await apiClient.getServices();
				const avail = Array.isArray(svc)
					? svc.filter(
							(s: any) =>
								s.status === 'available' ||
								s.status === 'active' ||
								s.status === 'scheduled'
					  )
					: [];
				setBookingServices(avail);
			}
		} catch (e) {
			console.error(e);
			toast({
				title: 'Erreur',
				description: 'Impossible de charger les données',
				variant: 'destructive',
			});
		}
	};

	const handleCreateBooking = async () => {
		if (!bookingClientId || !bookingServiceId || !bookingDate) {
			toast({
				title: 'Erreur',
				description: 'Veuillez remplir tous les champs obligatoires',
				variant: 'destructive',
			});
			return;
		}
		try {
			await apiClient.createBooking({
				client_id: parseInt(bookingClientId),
				service_id: parseInt(bookingServiceId),
				booking_date: new Date(bookingDate).toISOString(),
				notes: bookingNotes.trim() || undefined,
			});
			toast({ title: 'Succès', description: 'Réservation créée' });
			setNewBookingDialogOpen(false);
			setBookingClientId('');
			setBookingServiceId('');
			setBookingDate('');
			setBookingNotes('');
			await refreshData();
		} catch (err) {
			toast({
				title: 'Erreur',
				description: getErrorMessage(err),
				variant: 'destructive',
			});
		}
	};

	// ==========================================================================
	// FONCTIONS DE CHARGEMENT DES DONNÉES
	// ==========================================================================

	/**
	 * Transforme les données brutes de l'API en BookingData typé
	 */
	const transformBookingData = useCallback((rawBooking: any): BookingData => {
		const { client, service } = rawBooking;
		const prestataire = service?.prestataire;

		const clientName = client
			? `${client.first_name || ''} ${client.last_name || ''}`.trim()
			: `Client ${rawBooking.client_id || 'N/A'}`;
		const clientEmail = client ? client.email : '';

		const prestataireName = prestataire
			? `${prestataire.first_name || ''} ${
					prestataire.last_name || ''
			  }`.trim()
			: 'Prestataire N/A';
		const prestataireEmail = prestataire ? prestataire.email : '';

		const serviceName = service
			? service.name
			: `Service ${rawBooking.service_id || 'N/A'}`;
		const serviceDescription = service ? service.description : '';
		const serviceTypeName = service?.serviceType?.name || undefined;

		return {
			id: rawBooking.id || 0,
			client_id: rawBooking.client_id || 0,
			prestataire_id: prestataire?.id || 0,
			service_id: rawBooking.service_id || 0,
			status: rawBooking.status || 'pending',
			booked_date: rawBooking.bookingDate || rawBooking.booked_date || '',
			booked_time: '', // The new API response only has one date field
			location: rawBooking.location || '',
			notes: rawBooking.notes || null,
			total_price:
				typeof rawBooking.totalPrice === 'string'
					? parseFloat(rawBooking.totalPrice)
					: rawBooking.totalPrice || 0,
			payment_status: rawBooking.payment_status || 'pending',
			created_at: rawBooking.createdAt || '',
			updated_at: rawBooking.updatedAt || '',
			// Relations
			client_name: clientName,
			client_email: clientEmail,
			prestataire_name: prestataireName,
			prestataire_email: prestataireEmail,
			service_name: serviceName,
			service_description: serviceDescription,
			service_type_name: serviceTypeName,
		};
	}, []);

	/**
	 * Charge les réservations depuis l'API
	 */
	const loadBookings = useCallback(async () => {
		try {
			setLoading(true);
			console.log('📦 Chargement des réservations...');

			const response = await apiClient.getBookings(filters);
			console.log('📦 Réponse API bookings:', response);

			// Traitement de la réponse selon sa structure
			let rawBookingsData: any[] = [];

			if (Array.isArray(response)) {
				rawBookingsData = response;
			} else if (
				response &&
				response.data &&
				Array.isArray(response.data)
			) {
				rawBookingsData = response.data;
			} else if (
				response &&
				response.bookings &&
				Array.isArray(response.bookings)
			) {
				rawBookingsData = response.bookings;
			} else if (response && response.meta && response.data) {
				// Handle paginated response
				rawBookingsData = response.data;
			} else {
				console.warn('⚠️ Structure de réponse inattendue:', response);
				rawBookingsData = [];
			}

			// Transformation des données
			const transformedBookings =
				rawBookingsData.map(transformBookingData);

			setBookings(transformedBookings);
			calculateStats(transformedBookings);

			console.log(
				`✅ ${transformedBookings.length} réservations chargées`
			);
		} catch (error) {
			console.error('❌ Erreur chargement réservations:', error);
			toast({
				title: 'Erreur',
				description: `Impossible de charger les réservations: ${getErrorMessage(
					error
				)}`,
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	}, [filters, transformBookingData, toast]);

	/**
	 * Charge les statistiques depuis l'API
	 */
	const loadStats = useCallback(async () => {
		try {
			console.log('📊 Chargement des statistiques de réservations...');

			const response = await apiClient.getBookingStats();
			console.log('📊 Réponse API stats:', response);

			if (
				response &&
				response.stats &&
				typeof response.stats === 'object'
			) {
				const apiStats = response.stats;
				setStats({
					total: apiStats.total || 0,
					pending: apiStats.pending || 0,
					confirmed: apiStats.confirmed || 0,
					in_progress: apiStats.in_progress || 0,
					completed: apiStats.completed || 0,
					cancelled: apiStats.cancelled || 0,
					total_revenue: apiStats.monthly_revenue || 0,
					average_booking_value:
						apiStats.total > 0
							? (apiStats.monthly_revenue || 0) /
							  apiStats.completed
							: 0,
					growth_rate: parseFloat(apiStats.completion_rate || '0'),
				});
				console.log(
					'✅ Statistiques chargées avec taux de completion:',
					apiStats.completion_rate
				);
			}
		} catch (error) {
			console.error('❌ Erreur chargement statistiques:', error);
			// Ne pas afficher de toast pour les stats, c'est moins critique
		}
	}, []);

	/**
	 * Calcule les statistiques localement à partir des données
	 */
	const calculateStats = useCallback((bookingsData: BookingData[]) => {
		const stats: BookingStats = {
			total: bookingsData.length,
			pending: bookingsData.filter((b) => b.status === 'pending').length,
			confirmed: bookingsData.filter((b) => b.status === 'confirmed')
				.length,
			in_progress: bookingsData.filter((b) => b.status === 'in_progress')
				.length,
			completed: bookingsData.filter((b) => b.status === 'completed')
				.length,
			cancelled: bookingsData.filter((b) => b.status === 'cancelled')
				.length,
			total_revenue: bookingsData
				.filter((b) => b.status === 'completed')
				.reduce((sum, b) => sum + b.total_price, 0),
			average_booking_value: 0,
			growth_rate: 0,
		};

		if (stats.total > 0) {
			stats.average_booking_value =
				stats.total_revenue / stats.completed || 0;
		}

		setStats(stats);
	}, []);

	/**
	 * Actualise toutes les données
	 */
	const refreshData = useCallback(async () => {
		setRefreshing(true);
		try {
			await Promise.all([loadBookings(), loadStats()]);
		} finally {
			setRefreshing(false);
		}
	}, [loadBookings, loadStats]);

	// ==========================================================================
	// ACTIONS DE GESTION DES RÉSERVATIONS
	// ==========================================================================

	/**
	 * Met à jour le statut d'une réservation
	 */
	const handleUpdateStatus = useCallback(async () => {
		if (!selectedBooking) return;

		try {
			const updateData: BookingStatusUpdateRequest = {
				status: newStatus,
				notes: statusNotes.trim() || undefined,
			};

			// Validation des données
			const validationErrors =
				BookingValidators.validateBookingStatusUpdate(updateData);
			if (validationErrors.length > 0) {
				toast({
					title: 'Erreur de validation',
					description: validationErrors.join(', '),
					variant: 'destructive',
				});
				return;
			}

			await apiClient.updateBookingStatus(
				selectedBooking.id.toString(),
				updateData
			);

			toast({
				title: 'Succès',
				description: 'Statut de la réservation mis à jour avec succès',
			});

			// Fermer le dialogue et actualiser
			setStatusUpdateDialog(false);
			setSelectedBooking(null);
			setNewStatus('pending');
			setStatusNotes('');
			await refreshData();
		} catch (error) {
			console.error('❌ Erreur mise à jour statut:', error);
			toast({
				title: 'Erreur',
				description: `Impossible de mettre à jour le statut: ${getErrorMessage(
					error
				)}`,
				variant: 'destructive',
			});
		}
	}, [
		selectedBooking,
		newStatus,
		statusNotes,
		apiClient,
		toast,
		refreshData,
	]);

	// ==========================================================================
	// FILTRAGE ET RECHERCHE
	// ==========================================================================

	/**
	 * Filtre les réservations selon les critères
	 */
	const filteredBookings = useCallback(() => {
		let filtered = [...bookings];

		// Recherche textuelle
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(booking) =>
					booking.client_name.toLowerCase().includes(term) ||
					booking.prestataire_name.toLowerCase().includes(term) ||
					booking.service_name.toLowerCase().includes(term) ||
					booking.location.toLowerCase().includes(term) ||
					booking.id.toString().includes(term)
			);
		}

		return filtered;
	}, [bookings, searchTerm]);

	/**
	 * Applique les filtres
	 */
	const applyFilters = useCallback(async () => {
		setShowFilters(false);
		await loadBookings(); // Recharge avec les nouveaux filtres
	}, [loadBookings]);

	/**
	 * Remet à zéro les filtres
	 */
	const resetFilters = useCallback(() => {
		setFilters({});
		setSearchTerm('');
		setShowFilters(false);
	}, []);

	// ==========================================================================
	// EFFETS
	// ==========================================================================

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	// ==========================================================================
	// UTILITAIRES UI
	// ==========================================================================

	const getStatusBadgeVariant = (
		status: BookingStatus
	): 'default' | 'secondary' | 'destructive' | 'outline' => {
		switch (status) {
			case 'pending':
				return 'outline';
			case 'confirmed':
				return 'default';
			case 'in_progress':
				return 'secondary';
			case 'completed':
				return 'default';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const getPaymentStatusBadgeVariant = (
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' => {
		switch (status) {
			case 'pending':
				return 'outline';
			case 'paid':
				return 'default';
			case 'refunded':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const formatDate = (dateString: string) => {
		if (!dateString || !Date.parse(dateString)) return 'Date invalide';
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatTime = (dateString: string) => {
		if (!dateString || !Date.parse(dateString)) return '';
		return new Date(dateString).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR',
		}).format(price);
	};

	// ==========================================================================
	// RENDU DU COMPOSANT
	// ==========================================================================

	if (loading && bookings.length === 0) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-green-500'></div>
			</div>
		);
	}

	// Ajout map transitions autorisées
	const allowedStatusMap: Record<BookingStatus, BookingStatus[]> = {
		pending: ['confirmed', 'cancelled'],
		confirmed: ['completed', 'cancelled'],
		in_progress: ['completed', 'cancelled'],
		completed: [],
		cancelled: [],
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						Gestion des Réservations
					</h1>
					<p className='text-muted-foreground'>
						Gérez toutes les réservations de services de la
						plateforme
					</p>
				</div>
				<div className='flex gap-2'>
					<Button
						onClick={openNewBookingDialog}
						className='flex items-center gap-2'
					>
						<Plus className='h-4 w-4' /> Nouvelle réservation
					</Button>
					<Button
						variant='outline'
						onClick={() => setShowFilters(!showFilters)}
						className='flex items-center gap-2'
					>
						<Filter className='h-4 w-4' />
						Filtres
					</Button>
					<Button
						onClick={refreshData}
						disabled={refreshing}
						className='flex items-center gap-2'
					>
						{refreshing ? (
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
							Total Réservations
						</CardTitle>
						<CalendarIcon className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.total}</div>
						<p className='text-xs text-muted-foreground'>
							{stats.growth_rate > 0 ? '+' : ''}
							{stats.growth_rate.toFixed(1)}% ce mois
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							En Attente
						</CardTitle>
						<Clock className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.pending}
						</div>
						<p className='text-xs text-muted-foreground'>
							À traiter
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Terminées
						</CardTitle>
						<Star className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.completed}
						</div>
						<p className='text-xs text-muted-foreground'>
							Avec succès
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Chiffre d'Affaires
						</CardTitle>
						<Euro className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{formatPrice(stats.total_revenue)}
						</div>
						<p className='text-xs text-muted-foreground'>
							Panier moyen:{' '}
							{formatPrice(stats.average_booking_value)}
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
							Filtrez les réservations selon vos critères
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid gap-4 md:grid-cols-3'>
							<div>
								<Label>Statut</Label>
								<Select
									value={filters.status?.[0] || ''}
									onValueChange={(value) =>
										setFilters({
											...filters,
											status:
												value && value !== 'all'
													? [value as BookingStatus]
													: undefined,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Tous les statuts' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>
											Tous
										</SelectItem>
										<SelectItem value='pending'>
											En attente
										</SelectItem>
										<SelectItem value='confirmed'>
											Confirmée
										</SelectItem>
										<SelectItem value='in_progress'>
											En cours
										</SelectItem>
										<SelectItem value='completed'>
											Terminée
										</SelectItem>
										<SelectItem value='cancelled'>
											Annulée
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Statut de paiement</Label>
								<Select
									value={filters.payment_status?.[0] || ''}
									onValueChange={(value) =>
										setFilters({
											...filters,
											payment_status:
												value && value !== 'all'
													? [value]
													: undefined,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Tous les paiements' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>
											Tous
										</SelectItem>
										<SelectItem value='pending'>
											En attente
										</SelectItem>
										<SelectItem value='paid'>
											Payé
										</SelectItem>
										<SelectItem value='refunded'>
											Remboursé
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Date de début</Label>
								<Input
									type='date'
									value={filters.date_start || ''}
									onChange={(e) =>
										setFilters({
											...filters,
											date_start:
												e.target.value || undefined,
										})
									}
								/>
							</div>
						</div>

						<div className='flex gap-2'>
							<Button onClick={applyFilters}>Appliquer</Button>
							<Button variant='outline' onClick={resetFilters}>
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
					placeholder='Rechercher par client, prestataire, service...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='max-w-sm'
				/>
			</div>

			{/* Tableau des réservations */}
			<Card>
				<CardHeader>
					<CardTitle>
						Réservations ({filteredBookings().length})
					</CardTitle>
					<CardDescription>
						Liste de toutes les réservations avec leurs détails
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Client</TableHead>
								<TableHead>Service</TableHead>
								<TableHead>Prestataire</TableHead>
								<TableHead>Date/Heure</TableHead>
								<TableHead>Lieu</TableHead>
								<TableHead>Prix</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead>Paiement</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredBookings().map((booking) => (
								<TableRow key={booking.id}>
									<TableCell className='font-medium'>
										#{booking.id}
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{booking.client_name}
											</div>
											<div className='text-sm text-muted-foreground'>
												{booking.client_email}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{booking.service_name}
											</div>
											{booking.service_type_name && (
												<div className='text-xs text-muted-foreground italic'>
													{booking.service_type_name}
												</div>
											)}
											<div className='text-sm text-muted-foreground'>
												{booking.service_description}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{booking.prestataire_name}
											</div>
											<div className='text-sm text-muted-foreground'>
												{booking.prestataire_email}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{formatDate(
													booking.booked_date
												)}
											</div>
											<div className='text-sm text-muted-foreground'>
												{formatTime(
													booking.booked_date
												)}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-1'>
											<MapPin className='h-3 w-3' />
											<span className='text-sm'>
												{booking.location}
											</span>
										</div>
									</TableCell>
									<TableCell className='font-medium'>
										{formatPrice(booking.total_price)}
									</TableCell>
									<TableCell>
										<Badge
											variant={getStatusBadgeVariant(
												booking.status
											)}
										>
											{booking.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={getPaymentStatusBadgeVariant(
												booking.payment_status
											)}
										>
											{booking.payment_status}
										</Badge>
									</TableCell>
									<TableCell>
										<div className='flex gap-1'>
											<Button
												variant='outline'
												size='sm'
												onClick={() => {
													setSelectedBooking(booking);
													setNewStatus(
														booking.status
													);
													setStatusNotes('');
													setStatusUpdateDialog(true);
												}}
											>
												<Edit className='h-3 w-3' />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{filteredBookings().length === 0 && (
						<div className='text-center py-8'>
							<p className='text-muted-foreground'>
								Aucune réservation trouvée
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog de mise à jour du statut */}
			<Dialog
				open={statusUpdateDialog}
				onOpenChange={setStatusUpdateDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Mettre à jour le statut</DialogTitle>
						<DialogDescription>
							Modifier le statut de la réservation #
							{selectedBooking?.id}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div>
							<Label>Nouveau statut</Label>
							<Select
								value={newStatus}
								onValueChange={(value) =>
									setNewStatus(value as BookingStatus)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{selectedBooking &&
										allowedStatusMap[
											selectedBooking.status
										].map((st) => (
											<SelectItem key={st} value={st}>
												{st === 'pending'
													? 'En attente'
													: st === 'confirmed'
													? 'Confirmée'
													: st === 'in_progress'
													? 'En cours'
													: st === 'completed'
													? 'Terminée'
													: 'Annulée'}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Notes (optionnel)</Label>
							<Textarea
								placeholder='Ajouter des notes sur ce changement de statut...'
								value={statusNotes}
								onChange={(e) => setStatusNotes(e.target.value)}
								rows={3}
							/>
						</div>

						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => setStatusUpdateDialog(false)}
							>
								Annuler
							</Button>
							<Button
								onClick={handleUpdateStatus}
								disabled={
									!selectedBooking ||
									newStatus === selectedBooking.status
								}
							>
								Mettre à jour
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* New Booking Dialog */}
			<Dialog
				open={newBookingDialogOpen}
				onOpenChange={setNewBookingDialogOpen}
			>
				<DialogContent className='max-w-lg'>
					<DialogHeader>
						<DialogTitle>Nouvelle Réservation</DialogTitle>
					</DialogHeader>
					<div className='space-y-4'>
						<div>
							<Label>Client *</Label>
							<Select
								value={bookingClientId}
								onValueChange={setBookingClientId}
							>
								<SelectTrigger className='mt-1'>
									<SelectValue placeholder='Choisir un client' />
								</SelectTrigger>
								<SelectContent>
									{bookingClients.map((c) => (
										<SelectItem
											key={c.id}
											value={c.id.toString()}
										>
											{c.first_name || c.firstName}{' '}
											{c.last_name || c.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Service *</Label>
							<Select
								value={bookingServiceId}
								onValueChange={setBookingServiceId}
							>
								<SelectTrigger className='mt-1'>
									<SelectValue placeholder='Choisir un service' />
								</SelectTrigger>
								<SelectContent>
									{bookingServices.map((s) => (
										<SelectItem
											key={s.id}
											value={s.id.toString()}
										>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Date / heure *</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={'outline'}
										className={cn(
											'w-full justify-start text-left font-normal mt-1',
											!bookingDate &&
												'text-muted-foreground'
										)}
									>
										<CalendarIcon className='mr-2 h-4 w-4' />
										{bookingDate ? (
											new Date(
												bookingDate
											).toLocaleDateString()
										) : (
											<span>Choisir une date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<Calendar
										mode='single'
										selected={
											bookingDate
												? new Date(bookingDate)
												: undefined
										}
										onSelect={(date) =>
											setBookingDate(
												date
													? format(date, 'yyyy-MM-dd')
													: ''
											)
										}
										fromDate={new Date()}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div>
							<Label>Notes</Label>
							<Textarea
								value={bookingNotes}
								onChange={(e) =>
									setBookingNotes(e.target.value)
								}
								rows={3}
							/>
						</div>
						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => setNewBookingDialogOpen(false)}
							>
								Annuler
							</Button>
							<Button
								onClick={handleCreateBooking}
								disabled={
									!bookingClientId ||
									!bookingServiceId ||
									!bookingDate
								}
							>
								Créer
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
