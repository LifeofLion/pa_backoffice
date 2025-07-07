'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
	Plus,
	Pencil,
	Trash2,
	Eye,
	Search,
	Filter,
	RefreshCw,
	Settings,
	DollarSign,
	Clock,
	MapPin,
	User,
	Calendar,
	CheckCircle,
	XCircle,
	AlertCircle,
	Mail,
	Phone,
	Edit,
	Star,
	Award,
	MessageCircle,
	TrendingUp,
} from 'lucide-react';
import { useServices } from '@/hooks/use-services';
import { apiClient } from '@/src/lib/api';
import type {
	ServiceData,
	ServiceTypeData,
	PrestataireData,
	ServiceFormData,
	ServiceTypeFormData,
	BookingData,
	BookingStats,
} from '@/hooks/use-services';
import {
	formatRating,
	calculateDetailedAverages,
	calculateSatisfactionRate,
	formatReviewDate,
	getInitials,
	type RatingData,
	type RatingAverages,
} from '@/lib/rating-utils';
import PendingServicesWithJustifications from './pending-services-with-justifications';

// Interface pour les suggestions d'adresse
interface AddressSuggestion {
	label: string;
	value: string;
}

export function ServicesManagement() {
	const { t } = useLanguage();
	const { toast } = useToast();

	// Hook centralisé pour la gestion des services
	const {
		services,
		serviceTypes,
		prestataires,
		bookings,
		bookingStats,
		loading,
		refreshing,
		loadAllData,
		createService,
		updateService,
		toggleServiceStatus,
		deleteService,
		createServiceType,
		updateServiceType,
		toggleServiceTypeStatus,
		deleteServiceType,
		loadPrestataireReviews,
		loadBookings,
		loadBookingStats,
		updateBookingStatus,
		getBookingDetails,
	} = useServices();

	const calculateSafeAverage = (
		values: (number | string | null | undefined)[],
		defaultValue: number = 0
	): number => {
		const validValues = values
			.map((v) => {
				if (v === null || v === undefined || v === '') return null;
				const num = typeof v === 'string' ? parseFloat(v) : v;
				return !isNaN(num) && num > 0 ? num : null;
			})
			.filter((v) => v !== null) as number[];

		return validValues.length > 0
			? validValues.reduce((sum, val) => sum + val, 0) /
					validValues.length
			: defaultValue;
	};

	const formatSafeAverage = (
		values: (number | string | null | undefined)[],
		decimals: number = 1
	): string => {
		const average = calculateSafeAverage(values, 0);
		return average > 0 ? average.toFixed(decimals) : '0.0';
	};

	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
	const [activeFilter, setActiveFilter] = useState<string>('all');

	const [showCreateService, setShowCreateService] = useState(false);
	const [showCreateServiceType, setShowCreateServiceType] = useState(false);
	const [showServiceDetails, setShowServiceDetails] = useState(false);
	const [editingService, setEditingService] = useState<ServiceData | null>(
		null
	);
	const [editingServiceType, setEditingServiceType] =
		useState<ServiceTypeData | null>(null);
	const [showEditServiceType, setShowEditServiceType] = useState(false);

	const [showPrestataireProfile, setShowPrestataireProfile] = useState(false);
	const [showPrestataireReviews, setShowPrestataireReviews] = useState(false);
	const [selectedPrestataire, setSelectedPrestataire] =
		useState<PrestataireData | null>(null);
	const [selectedService, setSelectedService] = useState<ServiceData | null>(
		null
	);
	const [prestataireReviews, setPrestataireReviews] = useState<RatingData[]>(
		[]
	);
	const [detailedAverages, setDetailedAverages] = useState<RatingAverages>({
		overall: 0,
		punctuality: null,
		quality: null,
		communication: null,
		value: null,
	});
	const [showAllReviews, setShowAllReviews] = useState(false);

	const defaultServiceForm: ServiceFormData = {
		name: '',
		description: '',
		price: 0,
		pricing_type: 'fixed',
		hourly_rate: null,
		prestataire_id: '',
		service_type_id: '',
		location: '',
		duration: null,
		home_service: false,
		requires_materials: false,
		availability_description: null,
	};

	const [serviceForm, setServiceForm] =
		useState<ServiceFormData>(defaultServiceForm);

	const [serviceTypeForm, setServiceTypeForm] = useState<ServiceTypeFormData>(
		{
			name: '',
			description: '',
			isActive: true,
		}
	);

	const [addressSuggestions, setAddressSuggestions] = useState<
		AddressSuggestion[]
	>([]);
	const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
	const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] =
		useState(false);
	const addressSuggestionsRef = useRef<HTMLDivElement>(null);

	const handleCreateService = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createService({
				name: serviceForm.name,
				description: serviceForm.description,
				price: serviceForm.price,
				pricing_type: serviceForm.pricing_type,
				hourly_rate: serviceForm.hourly_rate,
				prestataire_id: serviceForm.prestataire_id,
				service_type_id: serviceForm.service_type_id,
				location: serviceForm.location,
				duration: serviceForm.duration,
				home_service: serviceForm.home_service,
				requires_materials: serviceForm.requires_materials,
				availability_description: serviceForm.availability_description,
			});
			setShowCreateService(false);
			loadAllData();
		} catch (error) {
			console.error('Erreur lors de la création du service:', error);
		}
	};

	const handleUpdateService = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingService) return;

		try {
			await updateService(editingService.id, {
				name: serviceForm.name,
				description: serviceForm.description,
				price: serviceForm.price,
				pricing_type: serviceForm.pricing_type,
				hourly_rate: serviceForm.hourly_rate,
				prestataire_id: serviceForm.prestataire_id,
				service_type_id: serviceForm.service_type_id,
				location: serviceForm.location,
				duration: serviceForm.duration,
				home_service: serviceForm.home_service,
				requires_materials: serviceForm.requires_materials,
				availability_description: serviceForm.availability_description,
			});
			setEditingService(null);
			loadAllData();
		} catch (error) {
			console.error('Erreur lors de la mise à jour du service:', error);
		}
	};

	const handleToggleServiceStatus = async (
		id: number,
		currentStatus: boolean
	) => {
		await toggleServiceStatus(id, currentStatus);
	};

	const handleDeleteService = async (id: number) => {
		if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
		await deleteService(id);
	};

	const handleViewPrestataireProfile = (prestataireId: number) => {
		const prestataire = prestataires.find(
			(p: PrestataireData) => p.id === prestataireId
		);
		if (prestataire) {
			setSelectedPrestataire(prestataire);
			setShowPrestataireProfile(true);
		}
	};

	const handleViewPrestataireReviews = async (prestataireId: number) => {
		const prestataire = prestataires.find(
			(p: PrestataireData) => p.id === prestataireId
		);
		if (prestataire) {
			setSelectedPrestataire(prestataire);
			try {
				const reviews = await loadPrestataireReviews(prestataireId);
				setPrestataireReviews(reviews);
				const averages = calculateDetailedAverages(reviews);
				setDetailedAverages(averages);
				setShowPrestataireReviews(true);
			} catch (error) {
				console.error('Erreur chargement avis:', error);
				toast({
					title: 'Erreur',
					description: 'Impossible de charger les avis.',
					variant: 'destructive',
				});
			}
		}
	};

	const handleViewServiceDetails = (service: ServiceData) => {
		setSelectedService(service);
		setShowServiceDetails(true);
	};

	const handleCreateServiceType = async () => {
		const success = await createServiceType(serviceTypeForm);
		if (success) {
			setShowCreateServiceType(false);
			setServiceTypeForm({
				name: '',
				description: '',
				isActive: true,
			});
		}
	};

	const handleUpdateServiceType = async () => {
		if (!editingServiceType) return;
		const success = await updateServiceType(
			editingServiceType.id,
			serviceTypeForm
		);
		if (success) {
			setShowEditServiceType(false);
			setEditingServiceType(null);
			setServiceTypeForm({
				name: '',
				description: '',
				isActive: true,
			});
		}
	};

	const handleToggleServiceType = async (id: number) => {
		await toggleServiceTypeStatus(id);
	};

	const handleDeleteServiceType = async (id: number) => {
		if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de service ?'))
			return;
		await deleteServiceType(id);
	};

	const openEditServiceType = (serviceType: ServiceTypeData) => {
		setServiceTypeForm({
			name: serviceType.name,
			description: serviceType.description || '',
			isActive: serviceType.is_active,
		});
		setEditingServiceType(serviceType);
		setShowEditServiceType(true);
	};

	const resetServiceForm = () => {
		setServiceForm(defaultServiceForm);
		setAddressSuggestions([]);
		setShowAddressSuggestions(false);
	};

	const openEditService = (service: ServiceData) => {
		console.log('Service à éditer:', service);

		setServiceForm({
			name: service.name,
			description: service.description,
			price: service.price,
			pricing_type: service.pricing_type,
			hourly_rate: service.hourly_rate,
			prestataire_id: service.prestataire_id?.toString() || '',
			service_type_id: service.service_type_id?.toString() || '',
			location: service.location,
			duration: service.duration,
			home_service: service.home_service,
			requires_materials: service.requires_materials,
			availability_description: service.availability_description,
		});

		setEditingService(service);
	};

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchTerm(e.target.value);
		},
		[]
	);

	const filteredServices = useMemo(() => {
		return services.filter((service) => {
			if (statusFilter !== 'all' && service.status !== statusFilter) {
				return false;
			}
			if (
				typeFilter !== 'all' &&
				service.service_type_id?.toString() !== typeFilter
			) {
				return false;
			}
			if (activeFilter === 'active' && !service.is_active) {
				return false;
			}
			if (activeFilter === 'inactive' && service.is_active) {
				return false;
			}
			return true;
		});
	}, [services, statusFilter, typeFilter, activeFilter]);

	const searchAddresses = async (query: string) => {
		if (query.length < 4) {
			setAddressSuggestions([]);
			setShowAddressSuggestions(false);
			return;
		}

		try {
			setIsLoadingAddressSuggestions(true);

			const response = await fetch(
				`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
					query
				)}&limit=5`
			);
			const data = await response.json();

			const suggestions = data.features.map((feature: any) => ({
				label: feature.properties.label,
				value: feature.properties.label,
			}));

			setAddressSuggestions(suggestions);
			setShowAddressSuggestions(true);
			setIsLoadingAddressSuggestions(false);
		} catch (error) {
			console.error("Erreur lors de la recherche d'adresse:", error);
			setIsLoadingAddressSuggestions(false);
		}
	};

	const selectAddress = (suggestion: AddressSuggestion) => {
		setServiceForm((prev) => ({
			...prev,
			location: suggestion.value,
		}));
		setShowAddressSuggestions(false);
	};

	const formatDuration = (minutes: number): string => {
		if (minutes === 0) return '0 min';

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours === 0) return `${remainingMinutes} min`;
		if (remainingMinutes === 0) return `${hours}h`;
		return `${hours}h ${remainingMinutes}min`;
	};

	useEffect(() => {
		loadAllData();
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (serviceForm.location) {
				searchAddresses(serviceForm.location);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [serviceForm.location]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				addressSuggestionsRef.current &&
				!addressSuggestionsRef.current.contains(event.target as Node)
			) {
				setShowAddressSuggestions(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleServiceTypeChange = (value: string) => {
		setServiceForm((prev) => ({
			...prev,
			service_type_id: value,
		}));
	};

	const handlePrestataireChange = (value: string) => {
		setServiceForm((prev) => ({
			...prev,
			prestataire_id: value,
		}));
	};

	const handleHourlyRateChange = (e) => {
		const value = e.target.value ? parseFloat(e.target.value) : null;
		setServiceForm((prev) => ({
			...prev,
			hourly_rate: value,
		}));
	};

	const handleDurationChange = (e) => {
		const value = e.target.value ? parseFloat(e.target.value) : null;
		setServiceForm((prev) => ({
			...prev,
			duration: value,
		}));
	};

	return (
		<div className='space-y-6'>
			{/* En-tête */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h1 className='text-2xl font-bold'>Gestion des Services</h1>
					<p className='text-gray-600'>
						Gérez les services et types de services EcoDeli
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

			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Services Total
						</CardTitle>
						<Settings className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{services.length}
						</div>
						<p className='text-xs text-muted-foreground'>
							{
								services.filter((s: ServiceData) => s.is_active)
									.length
							}{' '}
							actifs
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Types
						</CardTitle>
						<Filter className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{serviceTypes.length}
						</div>
						<p className='text-xs text-muted-foreground'>
							{
								serviceTypes.filter(
									(t: ServiceTypeData) => t.is_active
								).length
							}{' '}
							actifs
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Prestataires
						</CardTitle>
						<User className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{prestataires.length}
						</div>
						<p className='text-xs text-muted-foreground'>
							{
								prestataires.filter(
									(p: PrestataireData) => p.is_validated
								).length
							}{' '}
							validés
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Prix Moyen
						</CardTitle>
						<DollarSign className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{Math.round(
								calculateSafeAverage(
									services.map((s: ServiceData) => s.price)
								)
							)}
							€
						</div>
						<p className='text-xs text-muted-foreground'>
							Par service
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue='services' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='services'>
						Services ({filteredServices.length})
					</TabsTrigger>
					<TabsTrigger value='types'>
						Types ({serviceTypes.length})
					</TabsTrigger>
					<TabsTrigger value='prestataires'>
						Prestataires ({prestataires.length})
					</TabsTrigger>

					<TabsTrigger value='validations'>
						Validations (
						{
							services.filter(
								(s: ServiceData) =>
									s.status === 'pending' || !s.is_active
							).length
						}
						)
					</TabsTrigger>
					<TabsTrigger value='reservations'>
						Réservations ({bookings.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value='services' className='space-y-4'>
					<div className='flex flex-col sm:flex-row gap-4'>
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
								<Input
									placeholder='Rechercher un service...'
									value={searchTerm}
									onChange={handleSearchChange}
									className='pl-10'
								/>
							</div>
						</div>

						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder='Filtrer par statut' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les statuts
								</SelectItem>
								<SelectItem value='available'>
									Disponible
								</SelectItem>
								<SelectItem value='unavailable'>
									Indisponible
								</SelectItem>
								<SelectItem value='suspended'>
									Suspendu
								</SelectItem>
							</SelectContent>
						</Select>

						<Select
							value={typeFilter}
							onValueChange={setTypeFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder='Filtrer par type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les types
								</SelectItem>
								{serviceTypes
									.filter(
										(type: ServiceTypeData) =>
											type.is_active
									)
									.map((type: ServiceTypeData) => (
										<SelectItem
											key={type.id}
											value={type.id.toString()}
										>
											{type.name}
										</SelectItem>
									))}
							</SelectContent>
						</Select>

						<Select
							value={serviceTypeFilter}
							onValueChange={setServiceTypeFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder='Filtrer par type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les types
								</SelectItem>
								{serviceTypes
									.filter((type) => type.is_active)
									.map((type) => (
										<SelectItem
											key={type.id}
											value={type.id.toString()}
										>
											{type.name}
											{!type.is_active && ' (Inactif)'}
										</SelectItem>
									))}
							</SelectContent>
						</Select>

						<Select
							value={activeFilter}
							onValueChange={setActiveFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder='Filtrer par statut' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Tous</SelectItem>
								<SelectItem value='active'>Actifs</SelectItem>
								<SelectItem value='inactive'>
									Inactifs
								</SelectItem>
							</SelectContent>
						</Select>

						<Dialog
							open={showCreateService}
							onOpenChange={setShowCreateService}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className='h-4 w-4 mr-2' />
									Nouveau Service
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
								<DialogHeader>
									<DialogTitle>
										Créer un nouveau service
									</DialogTitle>
									<DialogDescription>
										Remplissez les informations pour créer
										un nouveau service
									</DialogDescription>
								</DialogHeader>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label htmlFor='create-name'>
											Nom du service
										</Label>
										<Input
											id='create-name'
											value={serviceForm.name}
											onChange={(e) =>
												setServiceForm((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
											placeholder="ex: Garde d'enfants"
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='create-type'>
											Type de service
										</Label>
										<Select
											value={serviceForm.service_type_id}
											onValueChange={
												handleServiceTypeChange
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Sélectionner un type' />
											</SelectTrigger>
											<SelectContent>
												{serviceTypes
													.filter(
														(type) => type.is_active
													)
													.map((type) => (
														<SelectItem
															key={type.id}
															value={type.id.toString()}
														>
															{type.name}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='create-prestataire'>
											Prestataire
										</Label>
										<Select
											value={serviceForm.prestataire_id}
											onValueChange={
												handlePrestataireChange
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Sélectionner un prestataire' />
											</SelectTrigger>
											<SelectContent>
												{prestataires
													.filter(
														(prestataire) =>
															prestataire.is_validated
													)
													.map((prestataire) => (
														<SelectItem
															key={prestataire.id}
															value={prestataire.id.toString()}
														>
															{
																prestataire.first_name
															}{' '}
															{
																prestataire.last_name
															}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='create-pricing'>
											Type de tarification
										</Label>
										<Select
											value={serviceForm.pricing_type}
											onValueChange={(
												value:
													| 'fixed'
													| 'hourly'
													| 'custom'
											) =>
												setServiceForm((prev) => ({
													...prev,
													pricing_type: value,
												}))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='fixed'>
													Prix fixe
												</SelectItem>
												<SelectItem value='hourly'>
													Tarif horaire
												</SelectItem>
												<SelectItem value='custom'>
													Sur mesure
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='create-price'>
											{serviceForm.pricing_type ===
											'hourly'
												? 'Tarif horaire (€)'
												: 'Prix (€)'}
										</Label>
										<Input
											id='create-price'
											type='number'
											min='0'
											step='0.01'
											value={serviceForm.price}
											onChange={(e) =>
												setServiceForm((prev) => ({
													...prev,
													price:
														parseFloat(
															e.target.value
														) || 0,
												}))
											}
										/>
									</div>

									{serviceForm.pricing_type === 'hourly' && (
										<div className='space-y-2'>
											<Label htmlFor='create-hourlyRate'>
												Tarif horaire (€)
											</Label>
											<Input
												id='create-hourlyRate'
												type='number'
												min='0'
												step='0.01'
												value={
													serviceForm.hourly_rate ||
													''
												}
												onChange={(e) =>
													setServiceForm((prev) => ({
														...prev,
														hourly_rate:
															parseFloat(
																e.target.value
															) || undefined,
													}))
												}
											/>
										</div>
									)}

									<div className='space-y-2'>
										<Label htmlFor='create-location'>
											Localisation
										</Label>
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<MapPin className='h-5 w-5 text-gray-400' />
											</div>
											<Input
												id='create-location'
												value={serviceForm.location}
												onChange={(e) =>
													setServiceForm((prev) => ({
														...prev,
														location:
															e.target.value,
													}))
												}
												onFocus={() =>
													serviceForm.location
														.length >= 3 &&
													setShowAddressSuggestions(
														true
													)
												}
												className='pl-10 pr-10'
												placeholder='Rechercher une adresse...'
											/>
											{isLoadingAddressSuggestions && (
												<div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
													<div className='animate-spin h-5 w-5 border-2 border-gray-300 border-t-green-500 rounded-full' />
												</div>
											)}
										</div>

										{/* Suggestions d'adresses */}
										{showAddressSuggestions &&
											addressSuggestions.length > 0 && (
												<div
													ref={addressSuggestionsRef}
													className='absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto'
												>
													{addressSuggestions.map(
														(suggestion, index) => (
															<div
																key={index}
																className='px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center'
																onClick={() =>
																	selectAddress(
																		suggestion
																	)
																}
															>
																<MapPin className='h-4 w-4 text-gray-400 mr-2 flex-shrink-0' />
																<span className='text-sm'>
																	{
																		suggestion.label
																	}
																</span>
															</div>
														)
													)}
												</div>
											)}
									</div>

									{serviceForm.pricing_type !== 'hourly' && (
										<div className='space-y-2'>
											<Label htmlFor='create-duration'>
												Durée estimée (minutes)
											</Label>
											<Input
												id='create-duration'
												type='number'
												min='0'
												value={
													serviceForm.duration || ''
												}
												onChange={(e) =>
													setServiceForm((prev) => ({
														...prev,
														duration:
															parseInt(
																e.target.value
															) || undefined,
													}))
												}
												placeholder='ex: 60 pour 1 heure'
											/>
										</div>
									)}

									<div className='col-span-2 space-y-2'>
										<Label htmlFor='create-description'>
											Description
										</Label>
										<Textarea
											id='create-description'
											value={serviceForm.description}
											onChange={(e) =>
												setServiceForm((prev) => ({
													...prev,
													description: e.target.value,
												}))
											}
											placeholder='Décrivez le service en détail...'
											rows={3}
										/>
									</div>
								</div>

								<DialogFooter>
									<Button
										variant='outline'
										onClick={() =>
											setShowCreateService(false)
										}
									>
										Annuler
									</Button>
									<Button
										onClick={handleCreateService}
										disabled={loading}
									>
										{loading
											? 'Création...'
											: 'Créer le service'}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					<Card>
						<CardContent className='p-0'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t('services.name')}
										</TableHead>
										<TableHead>
											{t('services.prestataire')}
										</TableHead>
										<TableHead>
											{t('services.type')}
										</TableHead>
										<TableHead>
											{t('services.price')}
										</TableHead>
										<TableHead>
											{t('services.status')}
										</TableHead>
										<TableHead>
											{t('common.actions')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredServices.map(
										(service: ServiceData) => (
											<TableRow key={service.id}>
												<TableCell className='font-medium'>
													{service.name}
													<Badge
														variant={
															service.is_active
																? 'default'
																: 'secondary'
														}
														className='ml-2'
													>
														{service.is_active
															? 'Actif'
															: 'Inactif'}
													</Badge>
												</TableCell>
												<TableCell>
													<div className='flex flex-col'>
														<span>
															{
																service.prestataireName
															}
														</span>
														<span className='text-sm text-gray-500'>
															{
																service.prestataireEmail
															}
														</span>
														{service.prestataireRating && (
															<span className='flex items-center text-sm text-yellow-500'>
																<Star className='h-4 w-4 mr-1' />
																{service.prestataireRating.toFixed(
																	1
																)}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													{service.serviceTypeName ||
														t(
															'common.notAvailable'
														)}
												</TableCell>
												<TableCell>
													{service.pricing_type ===
													'hourly' ? (
														<span>
															{
																service.hourly_rate
															}
															€/h
														</span>
													) : (
														<span>
															{parseFloat(
																service.price.toString()
															).toFixed(2)}
															€
														</span>
													)}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															service.status ===
															'available'
																? 'default'
																: service.status ===
																  'suspended'
																? 'destructive'
																: 'secondary'
														}
													>
														{t(
															`services.status.${service.status}`
														)}
													</Badge>
												</TableCell>
												<TableCell>
													<div className='flex space-x-2'>
														<Button
															variant='outline'
															size='icon'
															onClick={() =>
																handleViewServiceDetails(
																	service
																)
															}
														>
															<Eye className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															size='icon'
															onClick={() =>
																openEditService(
																	service
																)
															}
														>
															<Pencil className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															size='icon'
															onClick={() =>
																handleToggleServiceStatus(
																	service.id,
																	service.is_active
																)
															}
														>
															{service.is_active ? (
																<XCircle className='h-4 w-4' />
															) : (
																<CheckCircle className='h-4 w-4' />
															)}
														</Button>
														<Button
															variant='outline'
															size='icon'
															onClick={() =>
																handleDeleteService(
																	service.id
																)
															}
														>
															<Trash2 className='h-4 w-4' />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										)
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='types' className='space-y-4'>
					<div className='flex justify-between items-center'>
						<h3 className='text-lg font-medium'>
							Types de services
						</h3>
						<Dialog
							open={showCreateServiceType}
							onOpenChange={setShowCreateServiceType}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className='h-4 w-4 mr-2' />
									Nouveau Type
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>
										Créer un type de service
									</DialogTitle>
								</DialogHeader>

								<div className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='typeName'>
											Nom du type
										</Label>
										<Input
											id='typeName'
											value={serviceTypeForm.name}
											onChange={(e) =>
												setServiceTypeForm((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
											placeholder='ex: Services à domicile'
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='typeDescription'>
											Description
										</Label>
										<Textarea
											id='typeDescription'
											value={serviceTypeForm.description}
											onChange={(e) =>
												setServiceTypeForm((prev) => ({
													...prev,
													description: e.target.value,
												}))
											}
											placeholder='Description du type de service...'
										/>
									</div>
								</div>

								<DialogFooter>
									<Button
										variant='outline'
										onClick={() =>
											setShowCreateServiceType(false)
										}
									>
										Annuler
									</Button>
									<Button
										onClick={handleCreateServiceType}
										disabled={loading}
									>
										{loading
											? 'Création...'
											: 'Créer le type'}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{serviceTypes.map((type: ServiceTypeData) => (
							<Card key={type.id}>
								<CardHeader>
									<div className='flex items-center justify-between'>
										<CardTitle className='text-lg'>
											{type.name}
										</CardTitle>
										<Badge
											variant={
												type.is_active
													? 'default'
													: 'secondary'
											}
										>
											{type.is_active
												? 'Actif'
												: 'Inactif'}
										</Badge>
									</div>
									<CardDescription>
										{type.description}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='flex items-center justify-between mb-3'>
										<span className='text-sm text-gray-500'>
											{type.service_count} service(s)
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												openEditServiceType(type)
											}
										>
											<Pencil className='h-4 w-4 mr-1' />
											Modifier
										</Button>
										<Button
											variant={
												type.is_active
													? 'outline'
													: 'default'
											}
											size='sm'
											className={
												type.is_active
													? 'text-red-600 border-red-200 hover:bg-red-50'
													: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
											}
											onClick={() =>
												handleToggleServiceType(type.id)
											}
										>
											{type.is_active ? (
												<>
													<XCircle className='h-4 w-4 mr-1' />
													Désactiver
												</>
											) : (
												<>
													<CheckCircle className='h-4 w-4 mr-1' />
													Activer
												</>
											)}
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												handleDeleteServiceType(type.id)
											}
										>
											<Trash2 className='h-4 w-4 text-red-500' />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value='prestataires' className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{prestataires.map((prestataire: PrestataireData) => {
							const getStatusInfo = (state: string) => {
								switch (state) {
									case 'active':
										return {
											label: 'Actif',
											variant: 'default' as const,
											color: 'text-green-600',
										};
									case 'inactive':
										return {
											label: 'Inactif',
											variant: 'secondary' as const,
											color: 'text-gray-600',
										};
									case 'closed':
										return {
											label: 'Compte suspendu',
											variant: 'destructive' as const,
											color: 'text-red-600',
										};
									default:
										return {
											label: state,
											variant: 'secondary' as const,
											color: 'text-gray-600',
										};
								}
							};

							const statusInfo = getStatusInfo(prestataire.state);
							const createdDate = prestataire.created_at
								? new Date(
										prestataire.created_at
								  ).toLocaleDateString('fr-FR')
								: 'Date inconnue';

							return (
								<Card
									key={prestataire.id}
									className='hover:shadow-md transition-shadow'
								>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<CardTitle className='text-lg'>
												{prestataire.first_name}{' '}
												{prestataire.last_name}
											</CardTitle>
											<Badge variant={statusInfo.variant}>
												{statusInfo.label}
											</Badge>
										</div>
										<CardDescription className='space-y-1'>
											<div className='flex items-center gap-1'>
												<Mail className='h-3 w-3' />
												<span className='text-xs'>
													{prestataire.email}
												</span>
											</div>
											{prestataire.phone_number && (
												<div className='flex items-center gap-1'>
													<Phone className='h-3 w-3' />
													<span className='text-xs'>
														{
															prestataire.phone_number
														}
													</span>
												</div>
											)}
											{prestataire.city && (
												<div className='flex items-center gap-1'>
													<MapPin className='h-3 w-3' />
													<span className='text-xs'>
														{prestataire.city}
													</span>
												</div>
											)}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className='space-y-2'>
											<div className='flex items-center justify-between text-sm'>
												<span>
													Domaine d'expertise:
												</span>
												<span className='font-medium'>
													{prestataire.service_type ||
														'Non spécifié'}
												</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span>Note moyenne:</span>
												<span className='font-medium'>
													{prestataire.rating &&
													!isNaN(
														prestataire.rating
													) &&
													prestataire.rating > 0
														? `${prestataire.rating.toFixed(
																1
														  )}/5 ⭐`
														: 'Aucune note'}
												</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span>Inscrit le:</span>
												<span className='text-xs text-gray-600'>
													{createdDate}
												</span>
											</div>
										</div>
										<div className='mt-4 flex gap-2'>
											<Button
												variant='outline'
												size='sm'
												onClick={() =>
													handleViewPrestataireProfile(
														prestataire.id
													)
												}
											>
												<User className='h-4 w-4 mr-1' />
												Profil
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() =>
													handleViewPrestataireReviews(
														prestataire.id
													)
												}
											>
												<Star className='h-4 w-4 mr-1' />
												Avis
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</TabsContent>

				<TabsContent value='validations' className='space-y-4'>
					<div className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<AlertCircle className='h-5 w-5 text-orange-500' />
									Services en attente de validation
								</CardTitle>
								<CardDescription>
									Examinez et validez les nouveaux services
									proposés par les prestataires avec
									vérification des pièces justificatives
								</CardDescription>
							</CardHeader>
							<CardContent>
								<PendingServicesWithJustifications />
							</CardContent>
						</Card>

						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<Card>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm font-medium'>
										Services validés ce mois
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold text-green-600'>
										{
											services.filter(
												(s: ServiceData) =>
													s.status === 'scheduled' &&
													s.is_active
											).length
										}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm font-medium'>
										Services rejetés
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold text-red-600'>
										{
											services.filter(
												(s: ServiceData) =>
													s.status === 'cancelled'
											).length
										}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm font-medium'>
										Taux de validation
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold text-blue-600'>
										{services.length > 0
											? Math.round(
													(services.filter(
														(s: ServiceData) =>
															s.status ===
															'scheduled'
													).length /
														services.length) *
														100
											  )
											: 0}
										%
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='reservations' className='space-y-4'>
					<div className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Calendar className='h-5 w-5 text-blue-500' />
									Réservations des services
								</CardTitle>
								<CardDescription>
									Consultez toutes les réservations effectuées
									pour les services
								</CardDescription>
							</CardHeader>
							<CardContent>
								{bookings.length > 0 ? (
									<div className='space-y-4'>
										{bookings.map(
											(booking: BookingData) => (
												<Card
													key={booking.id}
													className='border-l-4 border-l-blue-400'
												>
													<CardContent className='p-4'>
														<div className='flex items-center justify-between mb-2'>
															<div>
																<h4 className='font-semibold text-lg'>
																	{
																		booking.service_name
																	}
																</h4>
																<p className='text-sm text-gray-600'>
																	Client:{' '}
																	{
																		booking.client_first_name
																	}{' '}
																	{
																		booking.client_last_name
																	}
																</p>
															</div>
															<div className='flex items-center gap-2'>
																<Badge
																	variant={
																		booking.status ===
																		'confirmed'
																			? 'default'
																			: booking.status ===
																			  'pending'
																			? 'secondary'
																			: booking.status ===
																			  'completed'
																			? 'outline'
																			: 'destructive'
																	}
																>
																	{
																		booking.status
																	}
																</Badge>
															</div>
														</div>
														<div className='grid grid-cols-2 gap-4 text-sm'>
															<div>
																<span className='font-medium'>
																	Date de
																	réservation:
																</span>{' '}
																{new Date(
																	booking.booking_date
																).toLocaleDateString(
																	'fr-FR'
																)}
															</div>
															<div>
																<span className='font-medium'>
																	Prix total:
																</span>{' '}
																{
																	booking.total_price
																}
																€
															</div>
															<div>
																<span className='font-medium'>
																	Email
																	client:
																</span>{' '}
																{
																	booking.client_email
																}
															</div>
															<div>
																<span className='font-medium'>
																	Créé le:
																</span>{' '}
																{new Date(
																	booking.created_at
																).toLocaleDateString(
																	'fr-FR'
																)}
															</div>
														</div>
														{booking.notes && (
															<div className='mt-3 p-3 bg-gray-50 rounded'>
																<span className='font-medium'>
																	Notes:
																</span>{' '}
																{booking.notes}
															</div>
														)}
														<div className='flex gap-2 mt-4'>
															<Button
																size='sm'
																variant='outline'
																onClick={() =>
																	getBookingDetails(
																		booking.id
																	)
																}
															>
																<Eye className='h-4 w-4 mr-1' />
																Détails
															</Button>
															{booking.status ===
																'pending' && (
																<>
																	<Button
																		size='sm'
																		variant='outline'
																		className='text-green-600 border-green-200 hover:bg-green-50'
																		onClick={() =>
																			updateBookingStatus(
																				booking.id,
																				'confirmed'
																			)
																		}
																	>
																		<CheckCircle className='h-4 w-4 mr-1' />
																		Confirmer
																	</Button>
																	<Button
																		size='sm'
																		variant='outline'
																		className='text-red-600 border-red-200 hover:bg-red-50'
																		onClick={() =>
																			updateBookingStatus(
																				booking.id,
																				'cancelled'
																			)
																		}
																	>
																		<XCircle className='h-4 w-4 mr-1' />
																		Annuler
																	</Button>
																</>
															)}
														</div>
													</CardContent>
												</Card>
											)
										)}
									</div>
								) : (
									<div className='text-center py-8'>
										<Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
										<h3 className='text-lg font-medium text-gray-900 mb-2'>
											Aucune réservation
										</h3>
										<p className='text-gray-500'>
											Aucune réservation n'a été effectuée
											pour le moment.
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{bookingStats && (
							<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Réservations
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{bookingStats.total}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											En Attente
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-orange-600'>
											{bookingStats.pending}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Confirmées
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-green-600'>
											{bookingStats.confirmed}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Terminées
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-blue-600'>
											{bookingStats.completed}
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			{/* Dialog pour afficher les détails du service */}
			<Dialog
				open={showServiceDetails}
				onOpenChange={setShowServiceDetails}
			>
				<DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Détails du service</DialogTitle>
					</DialogHeader>
					{selectedService && (
						<div className='space-y-6'>
							{/* Informations principales */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<Label>Nom du service</Label>
									<p className='font-medium text-lg'>
										{selectedService.name}
									</p>
								</div>
								<div>
									<Label>Type de service</Label>
									<p className='font-medium'>
										{selectedService.serviceTypeName ||
											'Non spécifié'}
									</p>
								</div>
								<div>
									<Label>Statut</Label>
									<div className='flex items-center gap-2'>
										<Badge
											variant={
												selectedService.status ===
												'available'
													? 'default'
													: selectedService.status ===
													  'suspended'
													? 'destructive'
													: 'secondary'
											}
										>
											{selectedService.status}
										</Badge>
										<Badge
											variant={
												selectedService.is_active
													? 'default'
													: 'secondary'
											}
										>
											{selectedService.is_active
												? 'Actif'
												: 'Inactif'}
										</Badge>
									</div>
								</div>
								<div>
									<Label>Localisation</Label>
									<p className='font-medium flex items-center gap-1'>
										<MapPin className='h-4 w-4 text-gray-500' />
										{selectedService.location}
									</p>
								</div>
							</div>

							{/* Description */}
							<div>
								<Label>Description</Label>
								<div className='mt-2 p-3 bg-gray-50 rounded-md border'>
									<p className='text-sm leading-relaxed'>
										{selectedService.description}
									</p>
								</div>
							</div>

							{/* Tarification */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								<div>
									<Label>Type de tarification</Label>
									<p className='font-medium'>
										{selectedService.pricing_type ===
										'fixed'
											? 'Prix fixe'
											: selectedService.pricing_type ===
											  'hourly'
											? 'Tarif horaire'
											: 'Sur mesure'}
									</p>
								</div>
								<div>
									<Label>Prix</Label>
									<p className='font-medium text-lg text-green-600'>
										{selectedService.pricing_type ===
											'hourly' &&
										selectedService.hourly_rate
											? `${selectedService.hourly_rate}€/h`
											: `${parseFloat(
													selectedService.price.toString()
											  ).toFixed(2)}€`}
									</p>
								</div>
								{selectedService.duration && (
									<div>
										<Label>Durée</Label>
										<p className='font-medium flex items-center gap-1'>
											<Clock className='h-4 w-4 text-gray-500' />
											{formatDuration(
												selectedService.duration
											)}
										</p>
									</div>
								)}
							</div>

							{/* Informations prestataire */}
							<div className='border-t pt-4'>
								<h4 className='font-semibold text-lg mb-3'>
									Prestataire
								</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<Label>Nom</Label>
										<p className='font-medium'>
											{selectedService.prestataireName}
										</p>
									</div>
									<div>
										<Label>Email</Label>
										<p className='font-medium'>
											{selectedService.prestataireEmail}
										</p>
									</div>
									<div>
										<Label>Note moyenne</Label>
										<p className='font-medium flex items-center gap-1'>
											<Star className='h-4 w-4 text-yellow-400 fill-current' />
											{selectedService.prestataireRating !==
												null &&
											selectedService.prestataireRating >
												0
												? `${selectedService.prestataireRating.toFixed(
														1
												  )}/5`
												: 'Aucune note'}
										</p>
									</div>
								</div>
							</div>

							{/* Détails supplémentaires */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4'>
								<div className='flex items-center gap-2'>
									<div
										className={`w-3 h-3 rounded-full ${
											selectedService.home_service
												? 'bg-green-500'
												: 'bg-gray-300'
										}`}
									></div>
									<span className='text-sm'>
										Service à domicile
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<div
										className={`w-3 h-3 rounded-full ${
											selectedService.requires_materials
												? 'bg-blue-500'
												: 'bg-gray-300'
										}`}
									></div>
									<span className='text-sm'>
										Matériel requis
									</span>
								</div>
								{selectedService.availability_description && (
									<div>
										<Label>Disponibilité</Label>
										<p className='text-sm text-gray-600'>
											{
												selectedService.availability_description
											}
										</p>
									</div>
								)}
							</div>

							{/* Dates */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4'>
								<div>
									<Label>Créé le</Label>
									<p className='text-sm text-gray-600'>
										{new Date(
											selectedService.created_at
										).toLocaleDateString('fr-FR')}
									</p>
								</div>
								<div>
									<Label>Mis à jour le</Label>
									<p className='text-sm text-gray-600'>
										{new Date(
											selectedService.updated_at
										).toLocaleDateString('fr-FR')}
									</p>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={showPrestataireProfile}
				onOpenChange={setShowPrestataireProfile}
			>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>Profil du prestataire</DialogTitle>
					</DialogHeader>
					{selectedPrestataire && (
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<Label>Nom</Label>
									<p className='font-medium'>
										{selectedPrestataire.first_name}{' '}
										{selectedPrestataire.last_name}
									</p>
								</div>
								<div>
									<Label>Email</Label>
									<p className='font-medium'>
										{selectedPrestataire.email}
									</p>
								</div>
								<div>
									<Label>Téléphone</Label>
									<p className='font-medium'>
										{selectedPrestataire.phone_number ||
											'Non renseigné'}
									</p>
								</div>
								<div>
									<Label>Ville</Label>
									<p className='font-medium'>
										{selectedPrestataire.city ||
											'Non renseignée'}
									</p>
								</div>
								<div>
									<Label>Type de service</Label>
									<p className='font-medium'>
										{selectedPrestataire.service_type}
									</p>
								</div>
								<div>
									<Label>Note moyenne</Label>
									<p className='font-medium'>
										{selectedPrestataire.rating &&
										selectedPrestataire.rating > 0
											? `${selectedPrestataire.rating.toFixed(
													1
											  )}/5 ⭐`
											: 'Aucune note'}
									</p>
								</div>
							</div>
							{selectedPrestataire.address && (
								<div>
									<Label>Adresse</Label>
									<p className='font-medium'>
										{selectedPrestataire.address}
									</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={showPrestataireReviews}
				onOpenChange={setShowPrestataireReviews}
			>
				<DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
					<DialogHeader>
						<DialogTitle>
							Avis - {selectedPrestataire?.first_name}{' '}
							{selectedPrestataire?.last_name}
						</DialogTitle>
					</DialogHeader>
					<div className='flex-1 overflow-y-auto space-y-4 pr-2'>
						{prestataireReviews.length > 0 ? (
							<>
								<div className='bg-gray-50 p-4 rounded-lg'>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
										<div>
											<div className='text-2xl font-bold text-blue-600'>
												{detailedAverages.overall.toFixed(
													1
												)}
											</div>
											<div className='text-sm text-gray-600'>
												Note moyenne
											</div>
										</div>
										<div>
											<div className='text-2xl font-bold text-green-600'>
												{prestataireReviews.length}
											</div>
											<div className='text-sm text-gray-600'>
												Total avis
											</div>
										</div>
										<div>
											<div className='text-2xl font-bold text-orange-600'>
												{
													prestataireReviews.filter(
														(r) =>
															r.is_verified_purchase
													).length
												}
											</div>
											<div className='text-sm text-gray-600'>
												Achats vérifiés
											</div>
										</div>
										<div>
											<div className='text-2xl font-bold text-purple-600'>
												{calculateSatisfactionRate(
													prestataireReviews
												)}
												%
											</div>
											<div className='text-sm text-gray-600'>
												Satisfaction
											</div>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									{(showAllReviews
										? prestataireReviews
										: prestataireReviews.slice(0, 5)
									).map((review) => (
										<Card
											key={review.id}
											className='border-l-4 border-l-blue-400'
										>
											<CardHeader className='pb-3'>
												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-3'>
														<div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
															<span className='text-sm font-medium text-blue-600'>
																{getInitials(
																	review.client_name
																)}
															</span>
														</div>
														<div>
															<div className='font-medium'>
																{
																	review.client_name
																}
															</div>
															<div className='text-sm text-gray-500'>
																{formatReviewDate(
																	review.created_at
																)}
															</div>
														</div>
													</div>
													<div className='flex items-center gap-2'>
														{review.is_verified_purchase && (
															<Badge
																variant='outline'
																className='text-green-600 border-green-200'
															>
																<CheckCircle className='h-3 w-3 mr-1' />
																Vérifié
															</Badge>
														)}
														<div className='flex items-center gap-1'>
															<Star className='h-4 w-4 text-yellow-400 fill-current' />
															<span className='font-medium'>
																{formatRating(
																	review.overall_rating
																)}
															</span>
														</div>
													</div>
												</div>
											</CardHeader>
											<CardContent>
												<div className='space-y-3'>
													{/* Notes détaillées */}
													<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
														<div className='flex items-center gap-2'>
															<Clock className='h-4 w-4 text-gray-400' />
															<span>
																Ponctualité:{' '}
																{formatRating(
																	review.punctuality_rating
																)}
																/5
															</span>
														</div>
														<div className='flex items-center gap-2'>
															<Award className='h-4 w-4 text-gray-400' />
															<span>
																Qualité:{' '}
																{formatRating(
																	review.quality_rating
																)}
																/5
															</span>
														</div>
														<div className='flex items-center gap-2'>
															<MessageCircle className='h-4 w-4 text-gray-400' />
															<span>
																Communication:{' '}
																{formatRating(
																	review.communication_rating
																)}
																/5
															</span>
														</div>
														<div className='flex items-center gap-2'>
															<TrendingUp className='h-4 w-4 text-gray-400' />
															<span>
																Rapport Q/P:{' '}
																{formatRating(
																	review.value_rating
																)}
																/5
															</span>
														</div>
													</div>
													{review.comment && (
														<div className='bg-gray-50 p-3 rounded'>
															<p className='text-sm'>
																{review.comment}
															</p>
														</div>
													)}
												</div>
											</CardContent>
										</Card>
									))}
								</div>

								{prestataireReviews.length > 5 && (
									<div className='text-center'>
										<Button
											variant='outline'
											onClick={() =>
												setShowAllReviews(
													!showAllReviews
												)
											}
										>
											{showAllReviews
												? 'Voir moins'
												: `Voir tous les avis (${prestataireReviews.length})`}
										</Button>
									</div>
								)}
							</>
						) : (
							<div className='text-center py-8'>
								<Star className='h-12 w-12 text-gray-400 mx-auto mb-4' />
								<h3 className='text-lg font-medium text-gray-900 mb-2'>
									Aucun avis
								</h3>
								<p className='text-gray-500'>
									Ce prestataire n'a pas encore reçu d'avis.
								</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!editingService}
				onOpenChange={(open) => !open && setEditingService(null)}
			>
				<DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Modifier le service</DialogTitle>
						<DialogDescription>
							Modifiez les informations du service
						</DialogDescription>
					</DialogHeader>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='edit-name'>Nom du service</Label>
							<Input
								id='edit-name'
								value={serviceForm.name}
								onChange={(e) =>
									setServiceForm((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								placeholder="ex: Garde d'enfants"
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-type'>Type de service</Label>
							<Select
								value={serviceForm.service_type_id}
								onValueChange={handleServiceTypeChange}
							>
								<SelectTrigger>
									<SelectValue placeholder='Sélectionner un type' />
								</SelectTrigger>
								<SelectContent>
									{serviceTypes
										.filter((type) => type.is_active)
										.map((type) => (
											<SelectItem
												key={type.id}
												value={type.id.toString()}
											>
												{type.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-prestataire'>
								Prestataire
							</Label>
							<Select
								value={serviceForm.prestataire_id}
								onValueChange={handlePrestataireChange}
							>
								<SelectTrigger>
									<SelectValue placeholder='Sélectionner un prestataire' />
								</SelectTrigger>
								<SelectContent>
									{prestataires
										.filter(
											(prestataire) =>
												prestataire.is_validated
										)
										.map((prestataire) => (
											<SelectItem
												key={prestataire.id}
												value={prestataire.id.toString()}
											>
												{prestataire.first_name}{' '}
												{prestataire.last_name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-pricing'>
								Type de tarification
							</Label>
							<Select
								value={serviceForm.pricing_type}
								onValueChange={(
									value: 'fixed' | 'hourly' | 'custom'
								) =>
									setServiceForm((prev) => ({
										...prev,
										pricing_type: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='fixed'>
										Prix fixe
									</SelectItem>
									<SelectItem value='hourly'>
										Tarif horaire
									</SelectItem>
									<SelectItem value='custom'>
										Sur mesure
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-price'>
								{serviceForm.pricing_type === 'hourly'
									? 'Tarif horaire (€)'
									: 'Prix (€)'}
							</Label>
							<Input
								id='edit-price'
								type='number'
								min='0'
								step='0.01'
								value={serviceForm.price}
								onChange={(e) =>
									setServiceForm((prev) => ({
										...prev,
										price: parseFloat(e.target.value) || 0,
									}))
								}
							/>
						</div>

						{serviceForm.pricing_type === 'hourly' && (
							<div className='space-y-2'>
								<Label htmlFor='edit-hourlyRate'>
									Tarif horaire (€)
								</Label>
								<Input
									id='edit-hourlyRate'
									type='number'
									min='0'
									step='0.01'
									value={serviceForm.hourly_rate ?? ''}
									onChange={handleHourlyRateChange}
								/>
							</div>
						)}

						<div className='space-y-2'>
							<Label htmlFor='edit-location'>Localisation</Label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<MapPin className='h-5 w-5 text-gray-400' />
								</div>
								<Input
									id='edit-location'
									value={serviceForm.location}
									onChange={(e) =>
										setServiceForm((prev) => ({
											...prev,
											location: e.target.value,
										}))
									}
									onFocus={() =>
										serviceForm.location.length >= 3 &&
										setShowAddressSuggestions(true)
									}
									className='pl-10 pr-10'
									placeholder='Rechercher une adresse...'
								/>
								{isLoadingAddressSuggestions && (
									<div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
										<div className='animate-spin h-5 w-5 border-2 border-gray-300 border-t-green-500 rounded-full' />
									</div>
								)}
							</div>

							{showAddressSuggestions &&
								addressSuggestions.length > 0 && (
									<div
										ref={addressSuggestionsRef}
										className='absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto'
									>
										{addressSuggestions.map(
											(suggestion, index) => (
												<div
													key={index}
													className='px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center'
													onClick={() =>
														selectAddress(
															suggestion
														)
													}
												>
													<MapPin className='h-4 w-4 text-gray-400 mr-2 flex-shrink-0' />
													<span className='text-sm'>
														{suggestion.label}
													</span>
												</div>
											)
										)}
									</div>
								)}
						</div>

						{serviceForm.pricing_type !== 'hourly' && (
							<div className='space-y-2'>
								<Label htmlFor='edit-duration'>
									Durée estimée (minutes)
								</Label>
								<Input
									id='edit-duration'
									type='number'
									min='0'
									step='1'
									value={serviceForm.duration ?? ''}
									onChange={handleDurationChange}
									placeholder='ex: 60 pour 1 heure'
								/>
							</div>
						)}

						<div className='col-span-2 space-y-2'>
							<Label htmlFor='edit-description'>
								Description
							</Label>
							<Textarea
								id='edit-description'
								value={serviceForm.description}
								onChange={(e) =>
									setServiceForm((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								placeholder='Décrivez le service en détail...'
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setEditingService(null)}
						>
							Annuler
						</Button>
						<Button
							onClick={handleUpdateService}
							disabled={loading}
						>
							{loading ? 'Sauvegarde...' : 'Sauvegarder'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={showEditServiceType}
				onOpenChange={setShowEditServiceType}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Modifier le type de service</DialogTitle>
						<DialogDescription>
							Modifiez les informations du type de service
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='edit-typeName'>Nom du type</Label>
							<Input
								id='edit-typeName'
								value={serviceTypeForm.name}
								onChange={(e) =>
									setServiceTypeForm((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								placeholder='ex: Services à domicile'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='edit-typeDescription'>
								Description
							</Label>
							<Textarea
								id='edit-typeDescription'
								value={serviceTypeForm.description}
								onChange={(e) =>
									setServiceTypeForm((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								placeholder='Description du type de service...'
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowEditServiceType(false)}
						>
							Annuler
						</Button>
						<Button
							onClick={handleUpdateServiceType}
							disabled={loading}
						>
							{loading ? 'Sauvegarde...' : 'Sauvegarder'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
