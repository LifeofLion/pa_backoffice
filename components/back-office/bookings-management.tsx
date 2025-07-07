'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Plus,
	Pencil,
	Trash2,
	Eye,
	Search,
	Filter,
	RefreshCw,
	Calendar,
	DollarSign,
	Clock,
	MapPin,
	User,
	CheckCircle,
	XCircle,
	AlertCircle,
	Phone,
	Mail,
	TrendingUp,
	Users,
	ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les bookings
interface BookingData {
	id: number;
	clientId: number;
	clientName: string;
	clientEmail: string;
	clientPhone?: string;
	serviceId: number;
	serviceName: string;
	serviceDescription?: string;
	prestataireId: number;
	prestataireName: string;
	prestataireEmail: string;
	bookingDate: string;
	status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
	notes?: string;
	totalPrice?: number;
	duration?: number;
	location?: string;
	createdAt: string;
	updatedAt: string;
}

interface ServiceData {
	id: number;
	name: string;
	description: string;
	price: number;
	pricingType: 'fixed' | 'hourly' | 'custom';
	hourlyRate?: number;
	prestataireId: number;
	prestataireName: string;
	isActive: boolean;
}

interface ClientData {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
}

interface BookingFormData {
	clientId: string;
	serviceId: string;
	bookingDate: string;
	notes?: string;
	duration?: number;
}

export function BookingsManagement() {
	const { t } = useLanguage();
	const { toast } = useToast();

	const BACKEND_URL =
		process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

	// États pour les données
	const [bookings, setBookings] = useState<BookingData[]>([]);
	const [services, setServices] = useState<ServiceData[]>([]);
	const [clients, setClients] = useState<ClientData[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	// États pour les filtres
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [dateFilter, setDateFilter] = useState<string>('all');

	// États pour les dialogues
	const [showCreateBooking, setShowCreateBooking] = useState(false);
	const [editingBooking, setEditingBooking] = useState<BookingData | null>(
		null
	);
	const [viewingBooking, setViewingBooking] = useState<BookingData | null>(
		null
	);

	// États pour les formulaires
	const [bookingForm, setBookingForm] = useState<BookingFormData>({
		clientId: '',
		serviceId: '',
		bookingDate: '',
		notes: '',
		duration: undefined,
	});

	// ================================================================
	// CHARGEMENT DES DONNÉES
	// ================================================================

	const loadAllData = async () => {
		setRefreshing(true);
		try {
			await Promise.all([loadBookings(), loadServices(), loadClients()]);
			toast({
				title: 'Données actualisées',
				description:
					'Toutes les données ont été rechargées avec succès.',
			});
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Erreur de chargement',
				description: 'Impossible de charger certaines données.',
			});
		} finally {
			setRefreshing(false);
		}
	};

	const loadBookings = async () => {
		try {
			const response = await fetch(`${BACKEND_URL}/bookings`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem(
						'auth_token'
					)}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setBookings(Array.isArray(data.bookings) ? data.bookings : []);
			}
		} catch (error) {
			console.error('Erreur chargement bookings:', error);
			setBookings([]);
		}
	};

	const loadServices = async () => {
		try {
			const response = await fetch(
				`${BACKEND_URL}/services?active_only=true`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem(
							'auth_token'
						)}`,
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				setServices(Array.isArray(data.services) ? data.services : []);
			}
		} catch (error) {
			console.error('Erreur chargement services:', error);
			setServices([]);
		}
	};

	const loadClients = async () => {
		try {
			const response = await fetch(`${BACKEND_URL}/clients`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem(
						'auth_token'
					)}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setClients(Array.isArray(data.clients) ? data.clients : []);
			}
		} catch (error) {
			console.error('Erreur chargement clients:', error);
			setClients([]);
		}
	};

	// ================================================================
	// GESTION DES BOOKINGS
	// ================================================================

	const handleCreateBooking = async () => {
		setLoading(true);
		try {
			const selectedService = services.find(
				(s) => s.id === parseInt(bookingForm.serviceId)
			);
			if (!selectedService) {
				throw new Error('Service non trouvé');
			}

			// Calculer le prix total
			let totalPrice = selectedService.price;
			if (
				selectedService.pricingType === 'hourly' &&
				bookingForm.duration &&
				selectedService.hourlyRate
			) {
				totalPrice =
					selectedService.hourlyRate * (bookingForm.duration / 60); // durée en minutes → heures
			} else if (
				selectedService.pricingType === 'hourly' &&
				selectedService.hourlyRate
			) {
				// Durée par défaut de 1 heure si non spécifiée
				totalPrice = selectedService.hourlyRate;
			}

			const response = await fetch(`${BACKEND_URL}/bookings`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem(
						'auth_token'
					)}`,
				},
				body: JSON.stringify({
					client_id: parseInt(bookingForm.clientId),
					service_id: parseInt(bookingForm.serviceId),
					booking_date: bookingForm.bookingDate,
					notes: bookingForm.notes,
					total_price: totalPrice,
					status: 'pending',
				}),
			});

			if (response.ok) {
				toast({
					title: 'Réservation créée',
					description: 'La réservation a été créée avec succès.',
				});
				setShowCreateBooking(false);
				resetBookingForm();
				loadBookings();
			} else {
				const errorData = await response.json();
				throw new Error(
					errorData.message || 'Erreur lors de la création'
				);
			}
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description:
					error instanceof Error
						? error.message
						: 'Impossible de créer la réservation.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateBookingStatus = async (
		bookingId: number,
		newStatus: string
	) => {
		try {
			const response = await fetch(
				`${BACKEND_URL}/bookings/${bookingId}/status`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem(
							'auth_token'
						)}`,
					},
					body: JSON.stringify({ status: newStatus }),
				}
			);

			if (response.ok) {
				toast({
					title: 'Statut mis à jour',
					description: `La réservation est maintenant ${getStatusLabel(
						newStatus
					)}.`,
				});
				loadBookings();
			} else {
				throw new Error('Erreur lors de la mise à jour');
			}
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: 'Impossible de mettre à jour le statut.',
			});
		}
	};

	const handleDeleteBooking = async (id: number) => {
		if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?'))
			return;

		try {
			const response = await fetch(`${BACKEND_URL}/bookings/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${localStorage.getItem(
						'auth_token'
					)}`,
				},
			});

			if (response.ok) {
				toast({
					title: 'Réservation supprimée',
					description: 'La réservation a été supprimée avec succès.',
				});
				loadBookings();
			}
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: 'Impossible de supprimer la réservation.',
			});
		}
	};

	// ================================================================
	// UTILITAIRES
	// ================================================================

	const resetBookingForm = () => {
		setBookingForm({
			clientId: '',
			serviceId: '',
			bookingDate: '',
			notes: '',
			duration: undefined,
		});
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'pending':
				return 'En attente';
			case 'confirmed':
				return 'Confirmée';
			case 'completed':
				return 'Terminée';
			case 'cancelled':
				return 'Annulée';
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'confirmed':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'completed':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), 'dd/MM/yyyy à HH:mm', {
				locale: fr,
			});
		} catch {
			return dateString;
		}
	};

	const filteredBookings = bookings.filter((booking) => {
		const matchesSearch =
			booking.clientName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			booking.serviceName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			booking.prestataireName
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === 'all' || booking.status === statusFilter;

		const matchesDate =
			dateFilter === 'all' ||
			(dateFilter === 'today' &&
				new Date(booking.bookingDate).toDateString() ===
					new Date().toDateString()) ||
			(dateFilter === 'week' &&
				new Date(booking.bookingDate) >=
					new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

		return matchesSearch && matchesStatus && matchesDate;
	});

	// Statistiques
	const stats = {
		total: bookings.length,
		pending: bookings.filter((b) => b.status === 'pending').length,
		confirmed: bookings.filter((b) => b.status === 'confirmed').length,
		completed: bookings.filter((b) => b.status === 'completed').length,
		cancelled: bookings.filter((b) => b.status === 'cancelled').length,
		totalRevenue: bookings
			.filter((b) => b.status === 'completed' && b.totalPrice)
			.reduce((acc, b) => acc + (b.totalPrice || 0), 0),
	};

	// ================================================================
	// EFFETS
	// ================================================================

	useEffect(() => {
		loadAllData();
	}, []);

	// ================================================================
	// RENDU
	// ================================================================

	return (
		<div className='space-y-6'>
			{/* En-tête */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h1 className='text-2xl font-bold'>
						Gestion des Réservations
					</h1>
					<p className='text-gray-600'>
						Gérez les réservations de services EcoDeli
					</p>
				</div>
				<div className='flex gap-2'>
					<Button
						onClick={loadAllData}
						variant='outline'
						disabled={refreshing}
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${
								refreshing ? 'animate-spin' : ''
							}`}
						/>
						Actualiser
					</Button>
				</div>
			</div>

			{/* Statistiques */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total
						</CardTitle>
						<ClipboardList className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.total}</div>
						<p className='text-xs text-muted-foreground'>
							Réservations
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							En attente
						</CardTitle>
						<Clock className='h-4 w-4 text-yellow-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-yellow-600'>
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
							Confirmées
						</CardTitle>
						<CheckCircle className='h-4 w-4 text-blue-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-blue-600'>
							{stats.confirmed}
						</div>
						<p className='text-xs text-muted-foreground'>
							Programmées
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Terminées
						</CardTitle>
						<CheckCircle className='h-4 w-4 text-green-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>
							{stats.completed}
						</div>
						<p className='text-xs text-muted-foreground'>
							Complétées
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Annulées
						</CardTitle>
						<XCircle className='h-4 w-4 text-red-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>
							{stats.cancelled}
						</div>
						<p className='text-xs text-muted-foreground'>
							Annulations
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Revenus
						</CardTitle>
						<DollarSign className='h-4 w-4 text-green-500' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>
							{stats.totalRevenue}€
						</div>
						<p className='text-xs text-muted-foreground'>Générés</p>
					</CardContent>
				</Card>
			</div>

			{/* Contrôles de filtrage */}
			<div className='flex flex-col sm:flex-row gap-4'>
				<div className='flex-1'>
					<div className='relative'>
						<Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
						<Input
							placeholder='Rechercher une réservation...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-10'
						/>
					</div>
				</div>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className='w-[140px]'>
						<SelectValue placeholder='Statut' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Tous</SelectItem>
						<SelectItem value='pending'>En attente</SelectItem>
						<SelectItem value='confirmed'>Confirmées</SelectItem>
						<SelectItem value='completed'>Terminées</SelectItem>
						<SelectItem value='cancelled'>Annulées</SelectItem>
					</SelectContent>
				</Select>

				<Select value={dateFilter} onValueChange={setDateFilter}>
					<SelectTrigger className='w-[160px]'>
						<SelectValue placeholder='Période' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Toutes les dates</SelectItem>
						<SelectItem value='today'>Aujourd'hui</SelectItem>
						<SelectItem value='week'>Cette semaine</SelectItem>
					</SelectContent>
				</Select>

				<Dialog
					open={showCreateBooking}
					onOpenChange={setShowCreateBooking}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className='h-4 w-4 mr-2' />
							Nouvelle Réservation
						</Button>
					</DialogTrigger>
					<DialogContent className='max-w-2xl'>
						<DialogHeader>
							<DialogTitle>
								Créer une nouvelle réservation
							</DialogTitle>
							<DialogDescription>
								Sélectionnez un client et un service pour créer
								une réservation
							</DialogDescription>
						</DialogHeader>

						<div className='grid grid-cols-1 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='client'>Client</Label>
								<Select
									value={bookingForm.clientId}
									onValueChange={(value) =>
										setBookingForm((prev) => ({
											...prev,
											clientId: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Sélectionner un client' />
									</SelectTrigger>
									<SelectContent>
										{clients.map((client) => (
											<SelectItem
												key={client.id}
												value={client.id.toString()}
											>
												{client.firstName}{' '}
												{client.lastName} (
												{client.email})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='service'>Service</Label>
								<Select
									value={bookingForm.serviceId}
									onValueChange={(value) =>
										setBookingForm((prev) => ({
											...prev,
											serviceId: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Sélectionner un service' />
									</SelectTrigger>
									<SelectContent>
										{services.map((service) => (
											<SelectItem
												key={service.id}
												value={service.id.toString()}
											>
												<div className='flex flex-col'>
													<span>{service.name}</span>
													<span className='text-sm text-gray-500'>
														{
															service.prestataireName
														}{' '}
														-{' '}
														{service.pricingType ===
														'hourly'
															? `${service.hourlyRate}€/h`
															: `${service.price}€`}
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='bookingDate'>
									Date et heure
								</Label>
								<Input
									id='bookingDate'
									type='datetime-local'
									value={bookingForm.bookingDate}
									onChange={(e) =>
										setBookingForm((prev) => ({
											...prev,
											bookingDate: e.target.value,
										}))
									}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='duration'>
									Durée (minutes - optionnel)
								</Label>
								<Input
									id='duration'
									type='number'
									min='15'
									step='15'
									value={bookingForm.duration || ''}
									onChange={(e) =>
										setBookingForm((prev) => ({
											...prev,
											duration:
												parseInt(e.target.value) ||
												undefined,
										}))
									}
									placeholder='ex: 60 pour 1 heure'
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='notes'>Notes (optionnel)</Label>
								<Textarea
									id='notes'
									value={bookingForm.notes || ''}
									onChange={(e) =>
										setBookingForm((prev) => ({
											...prev,
											notes: e.target.value,
										}))
									}
									placeholder='Informations complémentaires...'
									rows={3}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant='outline'
								onClick={() => setShowCreateBooking(false)}
							>
								Annuler
							</Button>
							<Button
								onClick={handleCreateBooking}
								disabled={loading}
							>
								{loading
									? 'Création...'
									: 'Créer la réservation'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Table des réservations */}
			<Card>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Client</TableHead>
								<TableHead>Service</TableHead>
								<TableHead>Prestataire</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Prix</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredBookings.map((booking) => (
								<TableRow key={booking.id}>
									<TableCell>
										<div>
											<div className='font-medium'>
												{booking.clientName}
											</div>
											<div className='text-sm text-gray-500'>
												{booking.clientEmail}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{booking.serviceName}
											</div>
											<div className='text-sm text-gray-500 truncate max-w-[200px]'>
												{booking.serviceDescription}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div>
											<div className='font-medium'>
												{booking.prestataireName}
											</div>
											<div className='text-sm text-gray-500'>
												{booking.prestataireEmail}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center'>
											<Calendar className='h-4 w-4 mr-1 text-gray-400' />
											{formatDate(booking.bookingDate)}
										</div>
									</TableCell>
									<TableCell>
										<div className='font-medium'>
											{booking.totalPrice
												? `${booking.totalPrice}€`
												: 'À calculer'}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											className={getStatusColor(
												booking.status
											)}
										>
											{getStatusLabel(booking.status)}
										</Badge>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-2'>
											<Button
												variant='ghost'
												size='sm'
												onClick={() =>
													setViewingBooking(booking)
												}
											>
												<Eye className='h-4 w-4' />
											</Button>

											{booking.status === 'pending' && (
												<>
													<Button
														variant='ghost'
														size='sm'
														onClick={() =>
															handleUpdateBookingStatus(
																booking.id,
																'confirmed'
															)
														}
													>
														<CheckCircle className='h-4 w-4 text-green-500' />
													</Button>
													<Button
														variant='ghost'
														size='sm'
														onClick={() =>
															handleUpdateBookingStatus(
																booking.id,
																'cancelled'
															)
														}
													>
														<XCircle className='h-4 w-4 text-red-500' />
													</Button>
												</>
											)}

											{booking.status === 'confirmed' && (
												<Button
													variant='ghost'
													size='sm'
													onClick={() =>
														handleUpdateBookingStatus(
															booking.id,
															'completed'
														)
													}
												>
													<CheckCircle className='h-4 w-4 text-blue-500' />
												</Button>
											)}

											<Button
												variant='ghost'
												size='sm'
												onClick={() =>
													handleDeleteBooking(
														booking.id
													)
												}
											>
												<Trash2 className='h-4 w-4 text-red-500' />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Dialog de visualisation détaillée */}
			<Dialog
				open={!!viewingBooking}
				onOpenChange={(open) => !open && setViewingBooking(null)}
			>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>
							Détails de la réservation #{viewingBooking?.id}
						</DialogTitle>
					</DialogHeader>

					{viewingBooking && (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* Informations client */}
								<Card>
									<CardHeader>
										<CardTitle className='text-lg flex items-center'>
											<User className='h-5 w-5 mr-2' />
											Client
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-2'>
										<div>
											<span className='font-medium'>
												Nom:
											</span>{' '}
											{viewingBooking.clientName}
										</div>
										<div className='flex items-center'>
											<Mail className='h-4 w-4 mr-2 text-gray-400' />
											{viewingBooking.clientEmail}
										</div>
										{viewingBooking.clientPhone && (
											<div className='flex items-center'>
												<Phone className='h-4 w-4 mr-2 text-gray-400' />
												{viewingBooking.clientPhone}
											</div>
										)}
									</CardContent>
								</Card>

								{/* Informations service */}
								<Card>
									<CardHeader>
										<CardTitle className='text-lg flex items-center'>
											<ClipboardList className='h-5 w-5 mr-2' />
											Service
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-2'>
										<div>
											<span className='font-medium'>
												Service:
											</span>{' '}
											{viewingBooking.serviceName}
										</div>
										<div>
											<span className='font-medium'>
												Prestataire:
											</span>{' '}
											{viewingBooking.prestataireName}
										</div>
										<div className='flex items-center'>
											<Mail className='h-4 w-4 mr-2 text-gray-400' />
											{viewingBooking.prestataireEmail}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Détails de la réservation */}
							<Card>
								<CardHeader>
									<CardTitle className='text-lg flex items-center'>
										<Calendar className='h-5 w-5 mr-2' />
										Détails de la réservation
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<div>
											<span className='font-medium'>
												Date:
											</span>{' '}
											{formatDate(
												viewingBooking.bookingDate
											)}
										</div>
										<div>
											<span className='font-medium'>
												Statut:
											</span>{' '}
											<Badge
												className={getStatusColor(
													viewingBooking.status
												)}
											>
												{getStatusLabel(
													viewingBooking.status
												)}
											</Badge>
										</div>
										<div>
											<span className='font-medium'>
												Prix:
											</span>{' '}
											{viewingBooking.totalPrice
												? `${viewingBooking.totalPrice}€`
												: 'À calculer'}
										</div>
										<div>
											<span className='font-medium'>
												Durée:
											</span>{' '}
											{viewingBooking.duration
												? `${viewingBooking.duration} min`
												: 'Non spécifiée'}
										</div>
									</div>

									{viewingBooking.notes && (
										<div>
											<span className='font-medium'>
												Notes:
											</span>
											<p className='mt-1 text-gray-600'>
												{viewingBooking.notes}
											</p>
										</div>
									)}

									<div className='text-sm text-gray-500'>
										<div>
											Créée le:{' '}
											{formatDate(
												viewingBooking.createdAt
											)}
										</div>
										<div>
											Modifiée le:{' '}
											{formatDate(
												viewingBooking.updatedAt
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setViewingBooking(null)}
						>
							Fermer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
 