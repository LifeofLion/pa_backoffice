'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import {
	ServiceData,
	ServiceStats,
	ServiceTypeData,
	ServiceFilters,
	ServiceValidators,
	ServiceRequest,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
	RefreshCw,
	Plus,
	Search,
	Filter,
	Eye,
	Edit,
	Trash2,
	CheckCircle,
	XCircle,
	Clock,
	DollarSign,
	Users,
	TrendingUp,
	Settings,
	User,
	Star,
	Calendar,
	MessageSquare,
} from 'lucide-react';
import { BookingsManagement } from './bookings-management';
import { RatingsManagement } from './ratings-management';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/src/hooks/use-auth';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserRole } from '@/src/types';

// =============================================================================
// COMPOSANT CARTES STATISTIQUES
// =============================================================================

function StatsCards({ stats }: { stats: ServiceStats }) {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
			<Card>
				<CardContent className='p-6'>
					<div className='flex items-center'>
						<div className='flex-1'>
							<p className='text-sm font-medium text-gray-600'>
								Total Services
							</p>
							<p className='text-2xl font-bold'>{stats.total}</p>
						</div>
						<Users className='h-8 w-8 text-blue-600' />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className='p-6'>
					<div className='flex items-center'>
						<div className='flex-1'>
							<p className='text-sm font-medium text-gray-600'>
								Services Actifs
							</p>
							<p className='text-2xl font-bold text-green-600'>
								{stats.active}
							</p>
						</div>
						<CheckCircle className='h-8 w-8 text-green-600' />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className='p-6'>
					<div className='flex items-center'>
						<div className='flex-1'>
							<p className='text-sm font-medium text-gray-600'>
								Chiffre d'Affaires
							</p>
							<p className='text-2xl font-bold text-blue-600'>
								{stats.total_revenue.toFixed(2)}€
							</p>
						</div>
						<DollarSign className='h-8 w-8 text-blue-600' />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className='p-6'>
					<div className='flex items-center'>
						<div className='flex-1'>
							<p className='text-sm font-medium text-gray-600'>
								Note Moyenne
							</p>
							<p className='text-2xl font-bold text-yellow-600'>
								{stats.average_rating > 0
									? stats.average_rating.toFixed(1)
									: 'N/A'}
							</p>
						</div>
						<Star className='h-8 w-8 text-yellow-600' />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// =============================================================================
// COMPOSANT TABLEAU DES SERVICES
// =============================================================================

function ServicesTable({
	services,
	searchTerm,
	onToggleStatus,
	onDelete,
	onEdit,
}: {
	services: ServiceData[];
	searchTerm: string;
	onToggleStatus: (id: number, currentStatus: boolean) => void;
	onDelete: (id: number) => void;
	onEdit: (service: ServiceData) => void;
}) {
	// Filtrer les services selon le terme de recherche
	const filteredServices = services.filter((service) => {
		if (!searchTerm.trim()) return true;

		const term = searchTerm.toLowerCase();
		return (
			service.name.toLowerCase().includes(term) ||
			service.description.toLowerCase().includes(term) ||
			service.location.toLowerCase().includes(term) ||
			service.prestataire_name.toLowerCase().includes(term) ||
			service.prestataire_email.toLowerCase().includes(term) ||
			(service.service_type_name &&
				service.service_type_name.toLowerCase().includes(term))
		);
	});

	const getStatusBadge = (status: string, isActive: boolean) => {
		// Si le service est désactivé manuellement
		if (!isActive) return <Badge variant='secondary'>Inactif</Badge>;

		// Normaliser le statut en respectant la nomenclature cahier des charges
		const map: Record<
			string,
			{ label: string; variant?: 'default' | 'secondary' | 'destructive' }
		> = {
			pending: { label: 'À valider', variant: 'secondary' },
			available: { label: 'Disponible', variant: 'default' },
			active: { label: 'Disponible', variant: 'default' },
			scheduled: { label: 'Disponible', variant: 'default' }, // Éviter la confusion
			in_progress: { label: 'En cours', variant: 'default' },
			paid: { label: 'Payé', variant: 'default' },
			completed: { label: 'Terminé' },
			cancelled: { label: 'Annulé', variant: 'destructive' },
			refused: { label: 'Refusé', variant: 'destructive' },
		};

		const conf = map[status] || { label: status, variant: 'outline' };
		return <Badge variant={conf.variant as any}>{conf.label}</Badge>;
	};

	const formatPrice = (price: number, pricingType: string) => {
		const formatted = price.toFixed(2);
		switch (pricingType) {
			case 'hourly':
				return `${formatted}€/h`;
			case 'custom':
				return `${formatted}€ (sur mesure)`;
			default:
				return `${formatted}€`;
		}
	};

	return (
		<div className='overflow-x-auto'>
			<table className='w-full'>
				<thead>
					<tr className='border-b'>
						<th className='text-left p-4 font-medium'>Service</th>
						<th className='text-left p-4 font-medium'>
							Prestataire
						</th>
						<th className='text-left p-4 font-medium'>Type</th>
						<th className='text-left p-4 font-medium'>Prix</th>
						<th className='text-left p-4 font-medium'>
							Localisation
						</th>
						<th className='text-left p-4 font-medium'>Statut</th>
						<th className='text-left p-4 font-medium'>Note</th>
						<th className='text-left p-4 font-medium'>Actions</th>
					</tr>
				</thead>
				<tbody>
					{filteredServices.map((service) => (
						<tr
							key={service.id}
							className='border-b hover:bg-gray-50'
						>
							<td className='p-4'>
								<div>
									<p className='font-medium'>
										{service.name}
									</p>
									<p className='text-sm text-gray-600 truncate max-w-xs'>
										{service.description}
									</p>
									{service.home_service && (
										<Badge
											variant='outline'
											className='mt-1'
										>
											À domicile
										</Badge>
									)}
								</div>
							</td>
							<td className='p-4'>
								<div>
									<p className='font-medium'>
										{service.prestataire_name}
									</p>
									<p className='text-sm text-gray-600'>
										{service.prestataire_email}
									</p>
								</div>
							</td>
							<td className='p-4'>
								<span className='text-sm'>
									{service.service_type_name || 'Non défini'}
								</span>
							</td>
							<td className='p-4'>
								<span className='font-medium'>
									{formatPrice(
										service.price,
										service.pricing_type
									)}
								</span>
							</td>
							<td className='p-4'>
								<span className='text-sm'>
									{service.location}
								</span>
							</td>
							<td className='p-4'>
								{getStatusBadge(
									service.status,
									service.is_active
								)}
							</td>
							<td className='p-4'>
								{service.prestataire_rating ? (
									<div className='flex items-center'>
										<Star className='h-4 w-4 text-yellow-400 mr-1' />
										<span>
											{service.prestataire_rating.toFixed(
												1
											)}
										</span>
									</div>
								) : (
									<span className='text-gray-400'>N/A</span>
								)}
							</td>
							<td className='p-4'>
								<div className='flex space-x-2'>
									<Button
										size='sm'
										variant='outline'
										onClick={() =>
											onToggleStatus(
												service.id,
												service.is_active
											)
										}
										title={
											service.is_active
												? 'Désactiver'
												: 'Activer'
										}
									>
										{service.is_active ? (
											<XCircle className='h-4 w-4' />
										) : (
											<CheckCircle className='h-4 w-4' />
										)}
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => onEdit(service)}
										title='Modifier'
									>
										<Edit className='h-4 w-4' />
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => onDelete(service.id)}
										title='Supprimer'
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{filteredServices.length === 0 && (
				<div className='text-center py-8 text-gray-500'>
					{searchTerm
						? 'Aucun service trouvé pour cette recherche'
						: 'Aucun service trouvé'}
				</div>
			)}
		</div>
	);
}

// Tableau pour les services en attente de validation
function PendingServicesTable({
	pending,
	onValidate,
}: {
	pending: ServiceData[];
	onValidate: (id: number, approve: boolean) => void;
}) {
	return (
		<div className='overflow-x-auto'>
			<table className='w-full'>
				<thead>
					<tr className='border-b'>
						<th className='p-4 text-left'>Service</th>
						<th className='p-4 text-left'>Prestataire</th>
						<th className='p-4 text-left'>Type</th>
						<th className='p-4 text-left'>Prix</th>
						<th className='p-4 text-left'>Actions</th>
					</tr>
				</thead>
				<tbody>
					{pending.map((s) => (
						<tr key={s.id} className='border-b'>
							<td className='p-4'>{s.name}</td>
							<td className='p-4'>{s.prestataire_name}</td>
							<td className='p-4'>{s.service_type_name}</td>
							<td className='p-4'>{s.price.toFixed(2)}€</td>
							<td className='p-4 space-x-2'>
								<Button
									size='sm'
									onClick={() => onValidate(s.id, true)}
								>
									<CheckCircle className='h-4 w-4 mr-1' />
									Approuver
								</Button>
								<Button
									size='sm'
									variant='destructive'
									onClick={() => onValidate(s.id, false)}
								>
									<XCircle className='h-4 w-4 mr-1' />
									Refuser
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{pending.length === 0 && (
				<div className='text-center py-8 text-gray-500'>
					Aucun service en attente
				</div>
			)}
		</div>
	);
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function ServicesManagement() {
	const { t } = useLanguage();
	const { toast } = useToast();
	const { user } = useAuth(); // Infos utilisateur connecté

	// Déterminer si l'utilisateur est admin, en tenant compte
	// soit de la propriété user.role, soit des relations renvoyées par l'API.
	const isAdmin = user
		? user.role === 'admin' || getUserRole(user) === 'admin'
		: false;

	// État
	const [services, setServices] = useState<ServiceData[]>([]);
	const [serviceTypes, setServiceTypes] = useState<ServiceTypeData[]>([]);
	const [stats, setStats] = useState<ServiceStats>({
		total: 0,
		active: 0,
		pending: 0,
		completed: 0,
		cancelled: 0,
		total_revenue: 0,
		average_rating: 0,
		average_duration: 0,
	});

	// Validation
	const [pendingServices, setPendingServices] = useState<ServiceData[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [activeTab, setActiveTab] = useState('services');

	// États pour les dialogues
	const [showFilters, setShowFilters] = useState(false);
	const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
	const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);

	// États pour le formulaire de création de type
	const [newTypeName, setNewTypeName] = useState('');
	const [newTypeDescription, setNewTypeDescription] = useState('');
	const [newTypeActive, setNewTypeActive] = useState(true);

	// === États pour l'édition d'un type existant ===
	const [editTypeDialogOpen, setEditTypeDialogOpen] = useState(false);
	const [editTypeId, setEditTypeId] = useState<number | null>(null);
	const [editTypeName, setEditTypeName] = useState('');
	const [editTypeDescription, setEditTypeDescription] = useState('');
	const [editTypeActive, setEditTypeActive] = useState(true);

	// État simple pour empêcher plusieurs clics rapides
	const [typeActionLoading, setTypeActionLoading] = useState(false);

	// === États pour le formulaire de création de service ===
	const [newServiceName, setNewServiceName] = useState('');
	const [newServiceDescription, setNewServiceDescription] = useState('');
	const [newServicePrice, setNewServicePrice] = useState('');
	const [newServicePricingType, setNewServicePricingType] = useState<
		'fixed' | 'hourly' | 'custom'
	>('fixed');
	const [newServiceLocation, setNewServiceLocation] = useState('');
	const [newServiceTypeId, setNewServiceTypeId] = useState('');
	const [newServiceHomeService, setNewServiceHomeService] = useState(true);
	const [newServiceRequiresMaterials, setNewServiceRequiresMaterials] =
		useState(false);
	const [newServiceDuration, setNewServiceDuration] = useState('');

	// === États pour l’édition d’un service ===
	const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
	const [editServiceId, setEditServiceId] = useState<number | null>(null);
	const [editServiceName, setEditServiceName] = useState('');
	const [editServiceDescription, setEditServiceDescription] = useState('');
	const [editServicePrice, setEditServicePrice] = useState('');
	const [editServicePricingType, setEditServicePricingType] = useState<
		'fixed' | 'hourly' | 'custom'
	>('fixed');
	const [editServiceLocation, setEditServiceLocation] = useState('');
	const [editServiceTypeId, setEditServiceTypeId] = useState('');
	const [editServiceHomeService, setEditServiceHomeService] = useState(true);
	const [editServiceRequiresMaterials, setEditServiceRequiresMaterials] =
		useState(false);
	const [editServiceDuration, setEditServiceDuration] = useState('');

	// Nouveaux états pour la sélection du prestataire
	const [prestataires, setPrestataires] = useState<any[]>([]);
	const [selectedPrestataireId, setSelectedPrestataireId] = useState('');

	// Charger les prestataires si l'utilisateur est un admin
	useEffect(() => {
		const loadPrestataires = async () => {
			if (isAdmin) {
				try {
					const prestatairesList = await apiClient.getPrestataires();
					setPrestataires(
						Array.isArray(prestatairesList) ? prestatairesList : []
					);
				} catch (error) {
					console.error('Erreur chargement prestataires', error);
					toast({
						title: 'Erreur',
						description: 'Impossible de charger les prestataires.',
						variant: 'destructive',
					});
				}
			}
		};
		loadPrestataires();
	}, [isAdmin, toast]);

	// ==========================================================================
	// FONCTIONS DE CHARGEMENT DES DONNÉES
	// ==========================================================================

	/**
	 * Transforme les données brutes de l'API en ServiceData typé
	 */
	const transformServiceData = useCallback((rawService: any): ServiceData => {
		return {
			id: rawService.id,
			name: rawService.name || '',
			description: rawService.description || '',
			price:
				rawService.pricing_type === 'hourly'
					? typeof rawService.hourly_rate === 'string'
						? parseFloat(rawService.hourly_rate)
						: rawService.hourly_rate || 0
					: typeof rawService.price === 'string'
					? parseFloat(rawService.price)
					: rawService.price || 0,
			pricing_type:
				rawService.pricing_type || rawService.pricingType || 'fixed',
			location: rawService.location || '',
			status: rawService.status || 'pending',
			is_active: rawService.is_active ?? rawService.isActive ?? true,
			prestataire_name:
				rawService.prestataire_name ||
				rawService.prestataireName ||
				'N/A',
			prestataire_email:
				rawService.prestataire_email ||
				rawService.prestataireEmail ||
				'',
			prestataire_rating: rawService.prestataire_rating
				? typeof rawService.prestataire_rating === 'string'
					? parseFloat(rawService.prestataire_rating)
					: rawService.prestataire_rating
				: null,
			service_type_name:
				rawService.service_type_name ||
				rawService.serviceTypeName ||
				null,
			service_type_id:
				rawService.service_type_id || rawService.serviceTypeId || null,
			created_at:
				rawService.created_at ||
				rawService.createdAt ||
				new Date().toISOString(),
			updated_at:
				rawService.updated_at ||
				rawService.updatedAt ||
				new Date().toISOString(),
			home_service:
				rawService.home_service ?? rawService.homeService ?? false,
			requires_materials:
				rawService.requires_materials ??
				rawService.requiresMaterials ??
				false,
			duration: rawService.duration || null,
		};
	}, []);

	const calculateStats = useCallback((servicesData: ServiceData[]) => {
		const total = servicesData.length;
		// Un service est actif s'il est disponible, en cours ou payé
		const active = servicesData.filter(
			(s) =>
				s.is_active &&
				[
					'available',
					'active',
					'scheduled',
					'in_progress',
					'paid',
				].includes(s.status)
		).length;
		const pending = servicesData.filter(
			(s) => s.status === 'pending'
		).length;
		const completedServices = servicesData.filter(
			(s) => s.status === 'completed'
		);
		const total_revenue = completedServices.reduce(
			(sum, s) => sum + s.price,
			0
		);
		const ratingsServices = servicesData.filter(
			(s) => s.prestataire_rating !== null && s.prestataire_rating > 0
		);
		const average_rating =
			ratingsServices.length > 0
				? ratingsServices.reduce(
						(sum, s) => sum + (s.prestataire_rating || 0),
						0
				  ) / ratingsServices.length
				: 0;

		setStats((prev) => ({
			...prev,
			total,
			active,
			pending,
			total_revenue,
			average_rating,
		}));
	}, []);

	const loadServices = useCallback(
		async (filters?: ServiceFilters) => {
			try {
				setLoading(true);
				console.log('🔄 Chargement des services...');

				// Utiliser l'API client existant
				const response = await apiClient.getAdminServices(filters);
				console.log('📦 Réponse API services:', response);

				// Traitement de la réponse selon sa structure
				let rawServicesData: any[] = [];

				if (Array.isArray(response)) {
					rawServicesData = response;
				} else if (
					response &&
					response.data &&
					Array.isArray(response.data)
				) {
					rawServicesData = response.data;
				} else if (
					response &&
					response.services &&
					Array.isArray(response.services)
				) {
					rawServicesData = response.services;
				} else {
					console.warn(
						'⚠️ Structure de réponse inattendue:',
						response
					);
					rawServicesData = [];
				}

				// Transformer les données brutes en ServiceData typé
				const transformedServices = rawServicesData
					.map((rawService) => {
						try {
							return transformServiceData(rawService);
						} catch (error) {
							console.error(
								'❌ Erreur transformation service:',
								error,
								rawService
							);
							return null;
						}
					})
					.filter(
						(service): service is ServiceData => service !== null
					);

				setServices(transformedServices);
				calculateStats(transformedServices);

				console.log(
					`✅ ${transformedServices.length} services chargés`
				);
			} catch (error) {
				console.error('❌ Erreur chargement services:', error);
				toast({
					title: 'Erreur',
					description:
						getErrorMessage(error) ||
						'Impossible de charger les services',
					variant: 'destructive',
				});
				setServices([]);
			} finally {
				setLoading(false);
			}
		},
		[toast, calculateStats]
	);

	const loadServiceTypes = useCallback(async () => {
		try {
			console.log('🔄 Chargement des types de services...');

			// Utiliser l'API client existant
			const response = await apiClient.getAdminServiceTypes();
			console.log('📦 Réponse API types services:', response);

			// Traitement de la réponse selon sa structure
			let typesData: ServiceTypeData[] = [];

			if (Array.isArray(response)) {
				typesData = response;
			} else if (
				response &&
				response.serviceTypes &&
				Array.isArray(response.serviceTypes)
			) {
				typesData = response.serviceTypes;
			} else if (
				response &&
				response.service_types &&
				Array.isArray(response.service_types)
			) {
				typesData = response.service_types;
			} else if (
				response &&
				response.data &&
				Array.isArray(response.data)
			) {
				typesData = response.data;
			} else {
				console.warn(
					'⚠️ Structure de réponse types services inattendue:',
					response
				);
				typesData = [];
			}

			setServiceTypes(typesData);
			console.log(`✅ ${typesData.length} types de services chargés`);
		} catch (error) {
			console.error('❌ Erreur chargement types de services:', error);
			toast({
				title: 'Erreur',
				description:
					getErrorMessage(error) ||
					'Impossible de charger les types de services',
				variant: 'destructive',
			});
		}
	}, [toast]);

	const loadPendingValidation = useCallback(async () => {
		try {
			const resp = await apiClient.getPendingServices();
			const rawList = resp?.pending_services || resp?.data || resp || [];
			const transformed = rawList
				.map(transformServiceData)
				.filter(Boolean);
			setPendingServices(transformed);
		} catch (e) {
			console.error(e);
		}
	}, [transformServiceData]);

	const handleValidateAction = async (id: number, approve: boolean) => {
		try {
			await apiClient.validateService(
				id.toString(),
				approve ? 'approved' : 'rejected',
				undefined,
				false
			);
			toast({
				title: 'Succès',
				description: `Service ${approve ? 'approuvé' : 'refusé'}`,
			});
			setPendingServices((prev) => prev.filter((s) => s.id !== id));
			await loadServices();
		} catch (err) {
			toast({
				title: 'Erreur',
				description: getErrorMessage(err),
				variant: 'destructive',
			});
		}
	};

	// ==========================================================================
	// FONCTIONS D'ACTIONS
	// ==========================================================================

	const handleCreateNewService = useCallback(async () => {
		const prestataireId = isAdmin ? selectedPrestataireId : user?.id;

		if (!prestataireId) {
			toast({
				title: 'Erreur de validation',
				description: 'Veuillez sélectionner un prestataire.',
				variant: 'destructive',
			});
			return;
		}

		try {
			// Validation
			if (!newServiceName.trim()) {
				toast({
					title: 'Erreur de validation',
					description: 'Le nom du service est requis',
					variant: 'destructive',
				});
				return;
			}

			if (!newServiceDescription.trim()) {
				toast({
					title: 'Erreur de validation',
					description: 'La description du service est requise',
					variant: 'destructive',
				});
				return;
			}

			if (!newServicePrice || parseFloat(newServicePrice) <= 0) {
				toast({
					title: 'Erreur de validation',
					description: 'Le prix doit être supérieur à 0',
					variant: 'destructive',
				});
				return;
			}

			if (!newServiceLocation.trim()) {
				toast({
					title: 'Erreur de validation',
					description: 'La localisation est requise',
					variant: 'destructive',
				});
				return;
			}

			if (!newServiceTypeId) {
				toast({
					title: 'Erreur de validation',
					description: 'Le type de service est requis',
					variant: 'destructive',
				});
				return;
			}

			const serviceData = {
				prestataireId: parseInt(prestataireId.toString(), 10),
				name: newServiceName.trim(),
				description: newServiceDescription.trim(),
				price: parseFloat(newServicePrice),
				pricing_type: newServicePricingType,
				location: newServiceLocation.trim(),
				service_type_id: parseInt(newServiceTypeId),
				home_service: newServiceHomeService,
				requires_materials: newServiceRequiresMaterials,
				duration: newServiceDuration
					? parseInt(newServiceDuration)
					: null,
				status: 'pending', // Nouveau service en attente de validation
				is_active: false, // Inactif jusqu'à validation admin
			};

			await apiClient.createService(serviceData);

			toast({
				title: 'Succès',
				description:
					'Service créé avec succès. Il sera visible après validation.',
			});

			// Réinitialiser le formulaire
			setNewServiceName('');
			setNewServiceDescription('');
			setNewServicePrice('');
			setNewServicePricingType('fixed');
			setNewServiceLocation('');
			setNewServiceTypeId('');
			setNewServiceHomeService(true);
			setNewServiceRequiresMaterials(false);
			setNewServiceDuration('');
			setShowNewServiceDialog(false);

			await loadServices(); // Recharger la liste
		} catch (error) {
			console.error('❌ Erreur création service:', error);
			toast({
				title: 'Erreur',
				description:
					getErrorMessage(error) || 'Impossible de créer le service',
				variant: 'destructive',
			});
		}
	}, [
		toast,
		loadServices,
		newServiceName,
		newServiceDescription,
		newServicePrice,
		newServicePricingType,
		newServiceLocation,
		newServiceTypeId,
		newServiceHomeService,
		newServiceRequiresMaterials,
		newServiceDuration,
		user,
		selectedPrestataireId,
		isAdmin,
	]);

	const handleCreateNewType = useCallback(async () => {
		try {
			// Validation
			if (!newTypeName.trim()) {
				toast({
					title: 'Erreur de validation',
					description: 'Le nom du type de service est requis',
					variant: 'destructive',
				});
				return;
			}

			const newTypeData = {
				name: newTypeName.trim(),
				description: newTypeDescription.trim() || undefined,
				is_active: newTypeActive,
			};

			await apiClient.createServiceType(newTypeData);

			toast({
				title: 'Succès',
				description: 'Type de service créé avec succès',
			});

			// Réinitialiser le formulaire
			setNewTypeName('');
			setNewTypeDescription('');
			setNewTypeActive(true);
			setShowNewTypeDialog(false);

			await loadServiceTypes(); // Recharger la liste
		} catch (error) {
			console.error('❌ Erreur création type de service:', error);
			toast({
				title: 'Erreur',
				description:
					getErrorMessage(error) ||
					'Impossible de créer le type de service',
				variant: 'destructive',
			});
		}
	}, [
		toast,
		loadServiceTypes,
		newTypeName,
		newTypeDescription,
		newTypeActive,
	]);

	// ========================================================================
	// ÉDITION TYPE DE SERVICE
	// ========================================================================

	const openEditTypeDialog = (type: ServiceTypeData) => {
		setEditTypeId(type.id);
		setEditTypeName(type.name);
		setEditTypeDescription(type.description ?? '');
		setEditTypeActive(type.is_active);
		setEditTypeDialogOpen(true);
	};

	const handleUpdateType = async () => {
		if (!editTypeId) return;

		if (!editTypeName.trim()) {
			toast({
				title: 'Erreur',
				description: 'Le nom du type est requis',
				variant: 'destructive',
			});
			return;
		}

		try {
			await apiClient.updateServiceType(editTypeId.toString(), {
				name: editTypeName.trim(),
				description: editTypeDescription.trim() || undefined,
				is_active: editTypeActive,
			});

			toast({
				title: 'Succès',
				description: 'Type de service mis à jour',
			});

			setEditTypeDialogOpen(false);
			setEditTypeId(null);
			setEditTypeName('');
			setEditTypeDescription('');
			setEditTypeActive(true);

			await loadServiceTypes();
		} catch (error) {
			console.error('❌ Erreur update type service:', error);
			toast({
				title: 'Erreur',
				description:
					getErrorMessage(error) || 'Impossible de mettre à jour',
				variant: 'destructive',
			});
		}
	};

	// Toggle status type de service
	const handleToggleTypeStatus = async (type: ServiceTypeData) => {
		if (typeActionLoading) return;
		setTypeActionLoading(true);
		try {
			// Utiliser l'endpoint dédié si dispo, sinon update
			if (apiClient.toggleServiceTypeStatus) {
				await apiClient.toggleServiceTypeStatus(type.id.toString());
			} else {
				await apiClient.updateServiceType(type.id.toString(), {
					is_active: !type.is_active,
				});
			}

			toast({
				title: 'Succès',
				description: `Type ${!type.is_active ? 'activé' : 'désactivé'}`,
			});

			// Mise à jour locale rapide
			setServiceTypes((prev) =>
				prev.map((t) =>
					t.id === type.id ? { ...t, is_active: !t.is_active } : t
				)
			);
		} catch (error) {
			console.error('toggle type status error', error);
			toast({
				title: 'Erreur',
				description:
					getErrorMessage(error) ||
					'Impossible de modifier le statut',
				variant: 'destructive',
			});
		} finally {
			setTypeActionLoading(false);
		}
	};

	const handleToggleServiceStatus = useCallback(
		async (serviceId: number, currentStatus: boolean) => {
			try {
				console.log(
					`🔄 Changement statut service ${serviceId}: ${!currentStatus}`
				);

				// Utiliser l'API client existant
				await apiClient.updateServiceStatus(
					serviceId.toString(),
					!currentStatus
				);

				// Mise à jour locale
				setServices((prev) =>
					prev.map((service) =>
						service.id === serviceId
							? { ...service, is_active: !currentStatus }
							: service
					)
				);

				toast({
					title: 'Succès',
					description: `Service ${
						!currentStatus ? 'activé' : 'désactivé'
					} avec succès`,
				});
			} catch (error) {
				console.error('❌ Erreur changement statut service:', error);
				toast({
					title: 'Erreur',
					description:
						getErrorMessage(error) ||
						'Impossible de modifier le statut du service',
					variant: 'destructive',
				});
			}
		},
		[toast]
	);

	const handleDeleteService = useCallback(
		async (serviceId: number) => {
			if (
				!window.confirm(
					'Êtes-vous sûr de vouloir supprimer ce service ?'
				)
			) {
				return;
			}

			try {
				console.log(`🔄 Suppression service ${serviceId}`);

				await apiClient.deleteService(serviceId.toString());

				toast({
					title: 'Succès',
					description: 'Service supprimé avec succès',
				});

				// Recharger les données pour refléter la suppression
				await loadServices();
			} catch (error) {
				console.error('❌ Erreur suppression service:', error);

				// Même en cas d'erreur de parsing de réponse, si le service
				// a été supprimé, il est bon de rafraîchir la liste.
				await loadServices();

				toast({
					title: 'Erreur',
					description:
						getErrorMessage(error) ||
						'Impossible de supprimer le service',
					variant: 'destructive',
				});
			}
		},
		[toast, loadServices]
	);

	// === Fonction pour ouvrir le dialog d’édition ===
	const openEditServiceDialog = (service: ServiceData) => {
		setEditServiceId(service.id);
		setEditServiceName(service.name);
		setEditServiceDescription(service.description);
		setEditServicePrice(service.price.toString());
		setEditServicePricingType(service.pricing_type);
		setEditServiceLocation(service.location);
		setEditServiceTypeId(
			service.service_type_id ? service.service_type_id.toString() : ''
		);
		setEditServiceHomeService(service.home_service);
		setEditServiceRequiresMaterials(service.requires_materials);
		setEditServiceDuration(
			service.duration ? service.duration.toString() : ''
		);
		setEditServiceDialogOpen(true);
	};

	// === Handler update ===
	const handleUpdateService = async () => {
		if (!editServiceId) return;
		try {
			const payload: Partial<ServiceRequest> = {
				name: editServiceName.trim(),
				description: editServiceDescription.trim(),
				price: parseFloat(editServicePrice),
				pricing_type: editServicePricingType,
				location: editServiceLocation.trim(),
				service_type_id: parseInt(editServiceTypeId),
				home_service: editServiceHomeService,
				requires_materials: editServiceRequiresMaterials,
				duration: editServiceDuration
					? parseInt(editServiceDuration)
					: undefined,
			};
			await apiClient.updateService(editServiceId.toString(), payload);
			toast({ title: 'Succès', description: 'Service mis à jour' });
			setEditServiceDialogOpen(false);
			await loadServices();
		} catch (err) {
			toast({
				title: 'Erreur',
				description: getErrorMessage(err),
				variant: 'destructive',
			});
		}
	};

	const refreshData = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([
			loadServices(),
			loadServiceTypes(),
			loadPendingValidation(),
		]);
		setRefreshing(false);
	}, [loadServices, loadServiceTypes, loadPendingValidation]);

	// ==========================================================================
	// EFFETS
	// ==========================================================================

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	// ==========================================================================
	// RENDU
	// ==========================================================================

	if (loading) {
		return (
			<div className='flex justify-center items-center h-64'>
				<RefreshCw className='h-8 w-8 animate-spin' />
				<span className='ml-2'>Chargement des services...</span>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* En-tête */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-2xl font-bold'>Gestion des Services</h1>
					<p className='text-gray-600'>
						Administration des services EcoDeli ({services.length}{' '}
						services)
					</p>
				</div>
				<Button
					onClick={refreshData}
					disabled={refreshing}
					variant='outline'
				>
					<RefreshCw
						className={`h-4 w-4 mr-2 ${
							refreshing ? 'animate-spin' : ''
						}`}
					/>
					Actualiser
				</Button>
			</div>

			{/* Statistiques */}
			<StatsCards stats={stats} />

			{/* Onglets principaux */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className='grid w-full grid-cols-5'>
					<TabsTrigger
						value='services'
						className='flex items-center gap-2'
					>
						<Settings className='h-4 w-4' />
						Services ({services.length})
					</TabsTrigger>
					<TabsTrigger
						value='types'
						className='flex items-center gap-2'
					>
						<Filter className='h-4 w-4' />
						Types ({serviceTypes.length})
					</TabsTrigger>
					<TabsTrigger
						value='bookings'
						className='flex items-center gap-2'
					>
						<Calendar className='h-4 w-4' />
						Réservations
					</TabsTrigger>
					<TabsTrigger
						value='ratings'
						className='flex items-center gap-2'
					>
						<MessageSquare className='h-4 w-4' />
						Avis
					</TabsTrigger>
					<TabsTrigger
						value='validation'
						className='flex items-center gap-2'
					>
						<CheckCircle className='h-4 w-4' />
						Validation
					</TabsTrigger>
				</TabsList>

				<TabsContent value='services' className='space-y-4'>
					{/* Barre de recherche et filtres */}
					<div className='flex flex-col sm:flex-row gap-4'>
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
								<Input
									placeholder='Rechercher un service, prestataire, localisation...'
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className='pl-9'
								/>
							</div>
						</div>
						<Button
							variant='outline'
							onClick={() => setShowFilters(!showFilters)}
						>
							<Filter className='h-4 w-4 mr-2' />
							Filtres
						</Button>
						<Button onClick={() => setShowNewServiceDialog(true)}>
							<Plus className='h-4 w-4 mr-2' />
							Nouveau Service
						</Button>
					</div>

					{/* Filtres conditionnels */}
					{showFilters && (
						<Card>
							<CardHeader>
								<CardTitle>Filtres</CardTitle>
								<CardDescription>
									Filtrez les services selon vos critères
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid gap-4 md:grid-cols-3'>
									<div>
										<Label>Statut</Label>
										<select className='w-full p-2 border rounded'>
											<option value=''>
												Tous les statuts
											</option>
											<option value='active'>
												Actif
											</option>
											<option value='pending'>
												En attente
											</option>
											<option value='completed'>
												Terminé
											</option>
											<option value='cancelled'>
												Annulé
											</option>
										</select>
									</div>
									<div>
										<Label>Type de service</Label>
										<select className='w-full p-2 border rounded'>
											<option value=''>
												Tous les types
											</option>
											{serviceTypes.map((type) => (
												<option
													key={type.id}
													value={type.id}
												>
													{type.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<Label>Localisation</Label>
										<Input placeholder='Filtrer par ville...' />
									</div>
								</div>
								<div className='flex gap-2'>
									<Button size='sm'>Appliquer</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => setShowFilters(false)}
									>
										Fermer
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Tableau des services */}
					<Card>
						<CardContent className='p-0'>
							<ServicesTable
								services={services}
								searchTerm={searchTerm}
								onToggleStatus={handleToggleServiceStatus}
								onDelete={handleDeleteService}
								onEdit={openEditServiceDialog}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='types' className='space-y-4'>
					<div className='flex justify-between items-center'>
						<div>
							<h2 className='text-xl font-semibold'>
								Types de Services
							</h2>
							<p className='text-gray-600'>
								Gestion des catégories de services disponibles
							</p>
						</div>
						<Button onClick={() => setShowNewTypeDialog(true)}>
							<Plus className='h-4 w-4 mr-2' />
							Nouveau Type
						</Button>
					</div>

					<Card>
						<CardContent className='p-6'>
							<div className='space-y-4'>
								{serviceTypes.map((type) => (
									<div
										key={type.id}
										className='flex items-center justify-between p-4 border rounded-lg'
									>
										<div>
											<h3 className='font-medium'>
												{type.name}
											</h3>
											{type.description && (
												<p className='text-sm text-gray-600'>
													{type.description}
												</p>
											)}
											<p className='text-sm text-gray-500'>
												{type.service_count || 0}{' '}
												service(s)
											</p>
										</div>
										<div className='flex items-center space-x-2'>
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
											<Button
												size='sm'
												variant='outline'
												onClick={() =>
													handleToggleTypeStatus(type)
												}
												title={
													type.is_active
														? 'Désactiver'
														: 'Activer'
												}
												disabled={typeActionLoading}
											>
												{type.is_active ? (
													<XCircle className='h-4 w-4' />
												) : (
													<CheckCircle className='h-4 w-4' />
												)}
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() =>
													openEditTypeDialog(type)
												}
												title='Modifier'
											>
												<Edit className='h-4 w-4' />
											</Button>
										</div>
									</div>
								))}

								{serviceTypes.length === 0 && (
									<div className='text-center py-8 text-gray-500'>
										Aucun type de service trouvé
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='bookings' className='space-y-4'>
					<BookingsManagement />
				</TabsContent>

				<TabsContent value='ratings' className='space-y-4'>
					<RatingsManagement />
				</TabsContent>

				<TabsContent value='validation' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>
								Services en Attente de Validation
							</CardTitle>
							<CardDescription>
								Services soumis par les prestataires en attente
								d'approbation
							</CardDescription>
						</CardHeader>
						<CardContent className='p-0'>
							<PendingServicesTable
								pending={pendingServices}
								onValidate={handleValidateAction}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialogues */}
			<Dialog
				open={showNewServiceDialog}
				onOpenChange={setShowNewServiceDialog}
			>
				<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Nouveau Service</DialogTitle>
						<DialogDescription>
							Créer un nouveau service sur la plateforme
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						{/* Champ de sélection du prestataire pour l'admin */}
						{isAdmin && (
							<div>
								<Label htmlFor='prestataire'>
									Prestataire *
								</Label>
								<Select
									value={selectedPrestataireId}
									onValueChange={setSelectedPrestataireId}
								>
									<SelectTrigger className='mt-1'>
										<SelectValue placeholder='Sélectionner un prestataire' />
									</SelectTrigger>
									<SelectContent>
										{prestataires.map((p) => {
											const firstName =
												p.user?.first_name ??
												p.user?.firstName ??
												p.user?.first ??
												'Prénom';
											const lastName =
												p.user?.last_name ??
												p.user?.lastName ??
												p.user?.last ??
												'Nom';
											return (
												<SelectItem
													key={p.id}
													value={p.id.toString()}
												>
													{firstName} {lastName} (ID:{' '}
													{p.id})
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className='grid gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='serviceName'>
									Nom du service *
								</Label>
								<Input
									id='serviceName'
									value={newServiceName}
									onChange={(e) =>
										setNewServiceName(e.target.value)
									}
									placeholder='Ex: Cours de piano, Ménage à domicile...'
									className='mt-1'
								/>
							</div>

							<div>
								<Label htmlFor='serviceLocation'>
									Localisation *
								</Label>
								<Input
									id='serviceLocation'
									value={newServiceLocation}
									onChange={(e) =>
										setNewServiceLocation(e.target.value)
									}
									placeholder='Ex: Paris, Lyon, Marseille...'
									className='mt-1'
								/>
							</div>
						</div>

						<div>
							<Label htmlFor='serviceDescription'>
								Description *
							</Label>
							<Textarea
								id='serviceDescription'
								value={newServiceDescription}
								onChange={(e) =>
									setNewServiceDescription(e.target.value)
								}
								placeholder='Décrivez en détail le service proposé...'
								className='mt-1'
								rows={3}
							/>
						</div>

						<div className='grid gap-4 md:grid-cols-3'>
							<div>
								<Label htmlFor='servicePrice'>
									{newServicePricingType === 'hourly'
										? 'Taux horaire (€) *'
										: 'Prix fixe (€) *'}
								</Label>
								<Input
									id='servicePrice'
									type='number'
									step='0.01'
									min='0'
									value={newServicePrice}
									onChange={(e) =>
										setNewServicePrice(e.target.value)
									}
									placeholder='0.00'
									className='mt-1'
								/>
							</div>

							<div>
								<Label htmlFor='servicePricingType'>
									Type de tarification
								</Label>
								<Select
									value={newServicePricingType}
									onValueChange={(value) =>
										setNewServicePricingType(
											value as
												| 'fixed'
												| 'hourly'
												| 'custom'
										)
									}
								>
									<SelectTrigger className='mt-1'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='fixed'>
											Prix fixe
										</SelectItem>
										<SelectItem value='hourly'>
											Horaire
										</SelectItem>
										<SelectItem value='custom'>
											Personnalisé
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor='serviceDuration'>
									Durée (min)
								</Label>
								<Input
									id='serviceDuration'
									type='number'
									min='0'
									value={newServiceDuration}
									onChange={(e) =>
										setNewServiceDuration(e.target.value)
									}
									placeholder='60'
									className='mt-1'
								/>
							</div>
						</div>

						<div>
							<Label htmlFor='serviceType'>
								Type de service *
							</Label>
							<Select
								value={newServiceTypeId}
								onValueChange={setNewServiceTypeId}
							>
								<SelectTrigger className='mt-1'>
									<SelectValue placeholder='Sélectionner un type' />
								</SelectTrigger>
								<SelectContent>
									{serviceTypes.map((type) => (
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

						<div className='grid gap-4 md:grid-cols-2'>
							<div className='flex items-center space-x-2'>
								<input
									type='checkbox'
									id='serviceHomeService'
									checked={newServiceHomeService}
									onChange={(e) =>
										setNewServiceHomeService(
											e.target.checked
										)
									}
									className='rounded'
								/>
								<Label htmlFor='serviceHomeService'>
									Service à domicile
								</Label>
							</div>

							<div className='flex items-center space-x-2'>
								<input
									type='checkbox'
									id='serviceRequiresMaterials'
									checked={newServiceRequiresMaterials}
									onChange={(e) =>
										setNewServiceRequiresMaterials(
											e.target.checked
										)
									}
									className='rounded'
								/>
								<Label htmlFor='serviceRequiresMaterials'>
									Matériel requis
								</Label>
							</div>
						</div>

						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => {
									setShowNewServiceDialog(false);
									setNewServiceName('');
									setNewServiceDescription('');
									setNewServicePrice('');
									setNewServicePricingType('fixed');
									setNewServiceLocation('');
									setNewServiceTypeId('');
									setNewServiceHomeService(true);
									setNewServiceRequiresMaterials(false);
									setNewServiceDuration('');
									setSelectedPrestataireId(''); // Reset prestataire selection
								}}
							>
								Annuler
							</Button>
							<Button
								onClick={handleCreateNewService}
								disabled={
									!newServiceName.trim() ||
									!newServiceDescription.trim() ||
									!newServicePrice ||
									!newServiceLocation.trim() ||
									!newServiceTypeId ||
									(isAdmin && !selectedPrestataireId)
								}
							>
								Créer
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={showNewTypeDialog}
				onOpenChange={setShowNewTypeDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nouveau Type de Service</DialogTitle>
						<DialogDescription>
							Créer une nouvelle catégorie de services
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div>
							<Label htmlFor='typeName'>Nom du type *</Label>
							<Input
								id='typeName'
								value={newTypeName}
								onChange={(e) => setNewTypeName(e.target.value)}
								placeholder='Ex: Ménage, Jardinage, Bricolage...'
								className='mt-1'
							/>
						</div>

						<div>
							<Label htmlFor='typeDescription'>Description</Label>
							<Input
								id='typeDescription'
								value={newTypeDescription}
								onChange={(e) =>
									setNewTypeDescription(e.target.value)
								}
								placeholder='Description du type de service...'
								className='mt-1'
							/>
						</div>

						<div className='flex items-center space-x-2'>
							<input
								type='checkbox'
								id='typeActive'
								checked={newTypeActive}
								onChange={(e) =>
									setNewTypeActive(e.target.checked)
								}
								className='rounded'
							/>
							<Label htmlFor='typeActive'>Type actif</Label>
						</div>

						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => {
									setShowNewTypeDialog(false);
									setNewTypeName('');
									setNewTypeDescription('');
									setNewTypeActive(true);
								}}
							>
								Annuler
							</Button>
							<Button
								onClick={handleCreateNewType}
								disabled={!newTypeName.trim()}
							>
								Créer
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog Édition Type */}
			<Dialog
				open={editTypeDialogOpen}
				onOpenChange={setEditTypeDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Modifier le Type de Service</DialogTitle>
						<DialogDescription>
							Mettre à jour les informations du type
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div>
							<Label htmlFor='editTypeName'>Nom *</Label>
							<Input
								id='editTypeName'
								value={editTypeName}
								onChange={(e) =>
									setEditTypeName(e.target.value)
								}
								className='mt-1'
							/>
						</div>
						<div>
							<Label htmlFor='editTypeDescription'>
								Description
							</Label>
							<Input
								id='editTypeDescription'
								value={editTypeDescription}
								onChange={(e) =>
									setEditTypeDescription(e.target.value)
								}
								className='mt-1'
							/>
						</div>
						<div className='flex items-center space-x-2'>
							<input
								type='checkbox'
								id='editTypeActive'
								checked={editTypeActive}
								onChange={(e) =>
									setEditTypeActive(e.target.checked)
								}
								className='rounded'
							/>
							<Label htmlFor='editTypeActive'>Type actif</Label>
						</div>
						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => setEditTypeDialogOpen(false)}
							>
								Annuler
							</Button>
							<Button
								onClick={handleUpdateType}
								disabled={!editTypeName.trim()}
							>
								Enregistrer
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog Édition Service */}
			<Dialog
				open={editServiceDialogOpen}
				onOpenChange={setEditServiceDialogOpen}
			>
				<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Modifier le Service</DialogTitle>
						<DialogDescription>
							Mettre à jour les informations du service
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='grid gap-4 md:grid-cols-2'>
							<div>
								<Label>Nom *</Label>
								<Input
									value={editServiceName}
									onChange={(e) =>
										setEditServiceName(e.target.value)
									}
								/>
							</div>
							<div>
								<Label>Localisation *</Label>
								<Input
									value={editServiceLocation}
									onChange={(e) =>
										setEditServiceLocation(e.target.value)
									}
								/>
							</div>
						</div>
						<div>
							<Label>Description *</Label>
							<Textarea
								rows={3}
								value={editServiceDescription}
								onChange={(e) =>
									setEditServiceDescription(e.target.value)
								}
							/>
						</div>
						<div className='grid gap-4 md:grid-cols-3'>
							<div>
								<Label>
									Prix{' '}
									{editServicePricingType === 'hourly'
										? '(€/h)*'
										: '(€)*'}
								</Label>
								<Input
									type='number'
									step='0.01'
									value={editServicePrice}
									onChange={(e) =>
										setEditServicePrice(e.target.value)
									}
								/>
							</div>
							<div>
								<Label>Type de tarification</Label>
								<Select
									value={editServicePricingType}
									onValueChange={(v) =>
										setEditServicePricingType(v as any)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='fixed'>
											Fixe
										</SelectItem>
										<SelectItem value='hourly'>
											Horaire
										</SelectItem>
										<SelectItem value='custom'>
											Personnalisé
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Durée (min)</Label>
								<Input
									type='number'
									value={editServiceDuration}
									onChange={(e) =>
										setEditServiceDuration(e.target.value)
									}
								/>
							</div>
						</div>
						<div>
							<Label>Type de service *</Label>
							<Select
								value={editServiceTypeId}
								onValueChange={setEditServiceTypeId}
							>
								<SelectTrigger>
									<SelectValue placeholder='Choisir' />
								</SelectTrigger>
								<SelectContent>
									{serviceTypes.map((t) => (
										<SelectItem
											key={t.id}
											value={t.id.toString()}
										>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='grid gap-4 md:grid-cols-2'>
							<div className='flex items-center space-x-2'>
								<input
									type='checkbox'
									checked={editServiceHomeService}
									onChange={(e) =>
										setEditServiceHomeService(
											e.target.checked
										)
									}
									className='rounded'
								/>
								<Label>Service à domicile</Label>
							</div>
							<div className='flex items-center space-x-2'>
								<input
									type='checkbox'
									checked={editServiceRequiresMaterials}
									onChange={(e) =>
										setEditServiceRequiresMaterials(
											e.target.checked
										)
									}
									className='rounded'
								/>
								<Label>Matériel requis</Label>
							</div>
						</div>
						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => setEditServiceDialogOpen(false)}
							>
								Annuler
							</Button>
							<Button
								onClick={handleUpdateService}
								disabled={
									!editServiceName.trim() ||
									!editServiceLocation.trim() ||
									!editServiceDescription.trim() ||
									!editServicePrice
								}
							>
								Enregistrer
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
