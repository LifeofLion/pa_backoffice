'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-context';
import {
	Search,
	FileText,
	User,
	Calendar,
	Check,
	X,
	Eye,
	Download,
	Filter,
	RefreshCw,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/src/hooks/use-admin';
import {
	JustificationPieceTransformed,
	JustificationPiecesApiResponse,
	JustificationVerifyApiResponse,
	JustificationPieceData,
	JustificationReviewRequest,
	UserData,
	FrontendValidators,
} from '@/src/types/validators';

// Interface pour les commerçants
interface ShopkeeperData {
	id: number;
	user?: {
		first_name: string;
		last_name: string;
		email: string;
	};
	storeName: string;
	businessAddress: string;
	verificationState: 'pending' | 'verified' | 'rejected';
	createdAt: string;
	updatedAt: string;
}

export function ValidationsContent() {
	const { t } = useLanguage();
	const { toast } = useToast();
	const {
		getUnverifiedShopkeepers,
		verifyShopkeeper,
		rejectShopkeeper,
		loading: adminLoading,
	} = useAdmin();

	const [justifications, setJustifications] = useState<
		JustificationPieceTransformed[]
	>([]);
	const [filteredJustifications, setFilteredJustifications] = useState<
		JustificationPieceTransformed[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [selectedJustification, setSelectedJustification] =
		useState<JustificationPieceTransformed | null>(null);
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
	const [reviewAction, setReviewAction] = useState<'verify' | 'reject'>(
		'verify'
	);
	const [reviewComments, setReviewComments] = useState('');

	// États pour les commerçants
	const [shopkeepers, setShopkeepers] = useState<ShopkeeperData[]>([]);
	const [shopkeepersLoading, setShopkeepersLoading] = useState(true);
	const [selectedShopkeeper, setSelectedShopkeeper] =
		useState<ShopkeeperData | null>(null);
	const [shopkeeperDialogOpen, setShopkeeperDialogOpen] = useState(false);
	const [shopkeeperAction, setShopkeeperAction] = useState<
		'verify' | 'reject'
	>('verify');
	const [processing, setProcessing] = useState(false);

	// Charger toutes les justifications
	const loadJustifications = async (forceReload = false) => {
		console.log(
			'📊 [CHARGEMENT] Début du chargement des justifications, forceReload:',
			forceReload
		);
		setLoading(true);
		try {
			// 🚀 FORCE RELOAD: Ajouter timestamp pour éviter le cache
			const timestamp = forceReload ? `?_t=${Date.now()}` : '';
			const endpoint = `/justification-pieces/all${timestamp}`;
			console.log('🌐 [CHARGEMENT] Appel API vers:', endpoint);
			const response =
				await apiClient.get<JustificationPiecesApiResponse>(endpoint);

			console.log('📥 [CHARGEMENT] Réponse API reçue:', response);
			console.log(
				'📊 [CHARGEMENT] Type de réponse:',
				typeof response,
				'Array?',
				Array.isArray(response)
			);

			// Extraire les données selon le format de réponse
			let rawData: JustificationPieceData[] = [];
			console.log('🔍 [CHARGEMENT] Extraction des données...');
			if (Array.isArray(response)) {
				rawData = response;
				console.log(
					'📋 [CHARGEMENT] Données extraites directement (array):',
					rawData.length,
					'éléments'
				);
			} else if (response && Array.isArray(response.data)) {
				rawData = response.data;
				console.log(
					'📋 [CHARGEMENT] Données extraites de response.data:',
					rawData.length,
					'éléments'
				);
			} else {
				console.warn(
					'⚠️ [CHARGEMENT] Structure de données inattendue:',
					response
				);
				rawData = [];
			}

			console.log(
				'📊 [CHARGEMENT] Données brutes à transformer:',
				rawData.length,
				'justifications'
			);
			rawData.forEach((item, index) => {
				console.log(`📄 [CHARGEMENT] Item ${index + 1}:`, {
					id: item.id,
					utilisateur_id: item.utilisateur_id,
					document_type: item.document_type,
					account_type: item.account_type,
					verification_status: item.verification_status,
					user_email: item.utilisateur?.email,
				});
			});

			// Transformer les données pour correspondre à l'interface frontend
			const transformedData: JustificationPieceTransformed[] =
				rawData.map((item: JustificationPieceData) => {
					console.log('🔍 Item brut:', item);

					// Extraire les infos utilisateur de façon sûre
					const user: any = item.utilisateur; // any pour contourner les contraintes de type
					const firstName =
						user?.firstName || user?.first_name || 'N/A';
					const lastName = user?.lastName || user?.last_name || 'N/A';
					const email = user?.email || 'N/A';

					console.log('🔍 Extraction des noms utilisateur:', {
						user: user,
						firstName_extracted: firstName,
						lastName_extracted: lastName,
						user_firstName: user?.firstName,
						user_first_name: user?.first_name,
						user_lastName: user?.lastName,
						user_last_name: user?.last_name,
					});

					// 🔧 CORRECTION: Support des formats camelCase ET snake_case
					const utilisateur_id =
						item.utilisateur_id || (item as any).utilisateurId;
					const document_type =
						item.document_type || (item as any).documentType;
					const file_path = item.file_path || (item as any).filePath;
					const account_type =
						item.account_type ||
						(item as any).accountType ||
						'livreur';
					const verification_status =
						item.verification_status ||
						(item as any).verificationStatus ||
						'pending';
					const uploaded_at =
						item.uploaded_at || (item as any).uploadedAt;
					const verified_at =
						item.verified_at || (item as any).verifiedAt;
					const createdAt = item.createdAt || (item as any).createdAt;
					const updatedAt = item.updatedAt || (item as any).updatedAt;

					// Extraire le nom de fichier du chemin
					const fileName = file_path
						? file_path.split('/').pop() || file_path
						: 'Fichier inconnu';

					// Mapper les dates
					const submittedAt = uploaded_at || createdAt;
					const reviewedAt = verified_at || updatedAt;

					console.log('🔧 Propriétés extraites:', {
						utilisateur_id,
						document_type,
						account_type,
						verification_status,
						format_detected: item.utilisateur_id
							? 'snake_case'
							: 'camelCase',
					});

					// 🔍 DEBUGGING: Log des propriétés critiques
					console.log('🔍 account_type brut:', account_type);
					console.log(
						'🔍 verification_status brut:',
						verification_status
					);
					console.log('🔍 file_path brut:', file_path);
					console.log('🔍 fileName extrait:', fileName);
					console.log(
						'🔧 Format détecté:',
						item.utilisateur_id ? 'snake_case' : 'camelCase'
					);

					const transformed: JustificationPieceTransformed = {
						id: item.id,
						utilisateur_id,
						document_type,
						file_path,
						account_type,
						verification_status,
						uploaded_at,
						verified_at,
						createdAt,
						updatedAt,

						// Propriétés extraites et calculées
						firstName,
						lastName,
						email,
						fileName,
						submittedAt,
						reviewedAt,
						reviewComments: '', // Pas de champ review_comments pour l'instant
						reviewedBy: '', // Pas de champ reviewed_by pour l'instant
					};

					console.log('🔍 Item transformé:', transformed);
					console.log('🔍 account_type final:', account_type);
					console.log(
						'🔍 verification_status final:',
						verification_status
					);
					return transformed;
				});

			console.log(
				'✅ [CHARGEMENT] Transformation terminée:',
				transformedData.length,
				'justifications'
			);
			console.log('📊 [CHARGEMENT] Répartition par statut:', {
				pending: transformedData.filter(
					(j) => j.verification_status === 'pending'
				).length,
				verified: transformedData.filter(
					(j) => j.verification_status === 'verified'
				).length,
				rejected: transformedData.filter(
					(j) => j.verification_status === 'rejected'
				).length,
			});
			console.log('📊 [CHARGEMENT] Répartition par type de compte:', {
				livreur: transformedData.filter(
					(j) => j.account_type === 'livreur'
				).length,
				prestataire: transformedData.filter(
					(j) => j.account_type === 'prestataire'
				).length,
				commercant: transformedData.filter(
					(j) => j.account_type === 'commercant'
				).length,
			});

			setJustifications(transformedData);
			setFilteredJustifications(transformedData);
			console.log(
				'💾 [CHARGEMENT] État mis à jour avec',
				transformedData.length,
				'justifications'
			);
		} catch (error) {
			console.error(
				'❌ [CHARGEMENT] Erreur lors du chargement des justifications:',
				error
			);
			console.error("❌ [CHARGEMENT] Détails de l'erreur:", {
				message: error.message,
				stack: error.stack,
				response: error.response?.data,
			});
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: getErrorMessage(error),
			});
		} finally {
			console.log('🏁 [CHARGEMENT] Fin du chargement - Arrêt du loading');
			setLoading(false);
		}
	};

	// Charger les commerçants non vérifiés
	const loadShopkeepers = async () => {
		console.log(
			'🏪 [SHOPKEEPERS] Début du chargement des commerçants non vérifiés'
		);
		setShopkeepersLoading(true);
		try {
			const result = await getUnverifiedShopkeepers();
			console.log('🏪 [SHOPKEEPERS] Commerçants reçus:', result);

			if (result && result.length > 0) {
				console.log('🔍 [SHOPKEEPERS] Détail du premier commerçant:', {
					id: result[0]?.id,
					storeName: result[0]?.storeName,
					user: result[0]?.user,
					user_first_name: result[0]?.user?.first_name,
					user_last_name: result[0]?.user?.last_name,
					user_email: result[0]?.user?.email,
				});
				setShopkeepers(result);
				console.log(
					'💾 [SHOPKEEPERS] État mis à jour avec',
					result.length,
					'commerçants'
				);
			} else {
				console.log(
					'⚠️ [SHOPKEEPERS] Aucun commerçant reçu ou tableau vide'
				);
				setShopkeepers([]);
			}
		} catch (error) {
			console.error(
				'❌ [SHOPKEEPERS] Erreur lors du chargement des commerçants:',
				error
			);
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: 'Erreur lors du chargement des commerçants',
			});
		} finally {
			setShopkeepersLoading(false);
		}
	};

	// Filtrer les justifications
	useEffect(() => {
		let filtered = justifications;

		// Filtre par terme de recherche
		if (searchTerm) {
			filtered = filtered.filter(
				(item) =>
					item.firstName
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					item.lastName
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					item.email
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					item.fileName
						?.toLowerCase()
						.includes(searchTerm.toLowerCase())
			);
		}

		// Filtre par statut
		if (statusFilter !== 'all') {
			filtered = filtered.filter(
				(item) => item.verification_status === statusFilter
			);
		}

		// Filtre par type de compte
		if (typeFilter !== 'all') {
			filtered = filtered.filter(
				(item) => item.account_type === typeFilter
			);
		}

		setFilteredJustifications(filtered);
	}, [justifications, searchTerm, statusFilter, typeFilter]);

	// Traiter une justification (vérifier ou rejeter)
	const handleReviewSubmit = async () => {
		if (!selectedJustification) return;

		console.log('🚀 [FRONTEND] Début du processus de validation/rejet');
		console.log('📄 [FRONTEND] Document sélectionné:', {
			id: selectedJustification.id,
			utilisateur_id: selectedJustification.utilisateur_id,
			document_type: selectedJustification.document_type,
			account_type: selectedJustification.account_type,
			verification_status: selectedJustification.verification_status,
			user_name: selectedJustification.user_name,
			user_email: selectedJustification.user_email,
		});
		console.log('⚡ [FRONTEND] Action demandée:', reviewAction);
		console.log('💬 [FRONTEND] Commentaires:', reviewComments);

		// 🔍 VALIDATION FRONTEND avant envoi
		const reviewData: JustificationReviewRequest = {
			comments: reviewComments,
		};
		const validationErrors =
			FrontendValidators.validateJustificationReviewRequest(reviewData);

		if (validationErrors.length > 0) {
			console.log(
				'❌ [FRONTEND] Erreurs de validation:',
				validationErrors
			);
			toast({
				variant: 'destructive',
				title: 'Erreur de validation',
				description: validationErrors.join(', '),
			});
			return;
		}

		console.log('✅ [FRONTEND] Validation frontend réussie');
		setProcessing(true);
		try {
			const endpoint =
				reviewAction === 'verify'
					? `/justification-pieces/verify/${selectedJustification.id}`
					: `/justification-pieces/reject/${selectedJustification.id}`;

			console.log('🌐 [FRONTEND] Envoi requête vers endpoint:', endpoint);
			console.log('📤 [FRONTEND] Données envoyées:', reviewData);
			const response =
				await apiClient.put<JustificationVerifyApiResponse>(
					endpoint,
					reviewData
				);
			console.log('📥 [FRONTEND] Réponse backend reçue:', response);

			// Gérer différents types de réponses avec le bon typage
			let successMessage = `Document ${
				reviewAction === 'verify' ? 'approuvé' : 'rejeté'
			} avec succès`;

			console.log('🔍 [FRONTEND] Analyse de la réponse backend...');
			if (response && response.message) {
				successMessage = response.message;
				console.log(
					'📝 [FRONTEND] Message du backend:',
					response.message
				);
			}

			// Cas spécial : auto-validation multiple
			if (
				response.data &&
				typeof response.data === 'object' &&
				'validatedDocuments' in response.data
			) {
				successMessage = `${response.data.validatedDocuments} document(s) auto-validé(s) (rôle déjà existant)`;
				console.log(
					'🔄 [FRONTEND] Auto-validation détectée:',
					response.data.validatedDocuments,
					'documents'
				);
				console.log('💡 [FRONTEND] Raison:', response.data.reason);
			} else {
				console.log(
					'🆕 [FRONTEND] Validation normale - Nouveau rôle créé'
				);
			}

			console.log(
				'✅ [FRONTEND] Message de succès final:',
				successMessage
			);
			toast({
				title: 'Succès',
				description: successMessage,
				variant: 'default',
			});

			console.log('🔒 [FRONTEND] Fermeture de la boîte de dialogue');
			setReviewDialogOpen(false);
			setReviewComments('');

			// 🚀 IMPORTANT: Forcer le rechargement des données avec délai pour synchronisation
			console.log(
				'🔄 [FRONTEND] Démarrage du rechargement des données...'
			);

			// Attendre un délai pour que le backend se synchronise
			console.log(
				'⏳ [FRONTEND] Attente de 1 seconde pour synchronisation backend...'
			);
			setTimeout(async () => {
				console.log('🔄 [FRONTEND] Rechargement des justifications...');
				await loadJustifications(true);
				console.log('✅ [FRONTEND] Rechargement terminé');
			}, 1000);
		} catch (error) {
			console.error(
				'❌ [FRONTEND] Erreur lors du traitement de la justification:',
				error
			);
			console.error("❌ [FRONTEND] Détails de l'erreur:", {
				message: error.message,
				stack: error.stack,
				response: error.response?.data,
			});
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: getErrorMessage(error),
			});
		} finally {
			console.log('🏁 [FRONTEND] Fin du processus - Arrêt du loading');
			setProcessing(false);
		}
	};

	// Télécharger un document
	const handleDownload = (justificationId: number, fileName: string) => {
		try {
			const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/justification-pieces/${justificationId}/download`;
			console.log('🔍 Téléchargement:', downloadUrl);
			window.open(downloadUrl, '_blank');
		} catch (error) {
			console.error('❌ Erreur téléchargement:', error);
		}
	};

	// Traiter les actions de validation/rejet des commerçants
	const handleShopkeeperAction = async () => {
		if (!selectedShopkeeper) return;

		console.log('🏪 [SHOPKEEPER] Début du traitement:', {
			id: selectedShopkeeper.id,
			action: shopkeeperAction,
			storeName: selectedShopkeeper.storeName,
		});

		setProcessing(true);
		try {
			const result =
				shopkeeperAction === 'verify'
					? await verifyShopkeeper(selectedShopkeeper.id.toString())
					: await rejectShopkeeper(selectedShopkeeper.id.toString());

			if (result) {
				const successMessage = `Commerçant ${
					shopkeeperAction === 'verify' ? 'vérifié' : 'rejeté'
				} avec succès`;
				console.log('✅ [SHOPKEEPER] Succès:', successMessage);

				toast({
					title: 'Succès',
					description: successMessage,
					variant: 'default',
				});

				setShopkeeperDialogOpen(false);

				// Recharger les commerçants
				setTimeout(async () => {
					await loadShopkeepers();
				}, 1000);
			}
		} catch (error) {
			console.error('❌ [SHOPKEEPER] Erreur:', error);
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: `Erreur lors du ${
					shopkeeperAction === 'verify' ? 'vérification' : 'rejet'
				} du commerçant`,
			});
		} finally {
			setProcessing(false);
		}
	};

	// Ouvrir la boîte de dialogue pour les commerçants
	const openShopkeeperDialog = (
		shopkeeper: ShopkeeperData,
		action: 'verify' | 'reject'
	) => {
		setSelectedShopkeeper(shopkeeper);
		setShopkeeperAction(action);
		setShopkeeperDialogOpen(true);
	};

	// Ouvrir la boîte de dialogue de révision
	const openReviewDialog = (
		justification: JustificationPieceTransformed,
		action: 'verify' | 'reject'
	) => {
		setSelectedJustification(justification);
		setReviewAction(action);
		setReviewComments('');
		setReviewDialogOpen(true);
	};

	useEffect(() => {
		loadJustifications(false);
		loadShopkeepers();
	}, []);

	const getStatusBadge = (status: string) => {
		console.log('🔍 getStatusBadge appelé avec:', status);
		switch (status) {
			case 'pending':
				return (
					<Badge
						variant='secondary'
						className='bg-yellow-100 text-yellow-800'
					>
						En attente
					</Badge>
				);
			case 'verified':
				return (
					<Badge
						variant='default'
						className='bg-green-100 text-green-800'
					>
						Vérifié
					</Badge>
				);
			case 'rejected':
				return <Badge variant='destructive'>Rejeté</Badge>;
			default:
				console.log('🔍 Statut non reconnu:', status);
				return (
					<Badge variant='outline'>
						{status || 'Statut inconnu'}
					</Badge>
				);
		}
	};

	const getAccountTypeBadge = (type: string) => {
		console.log('🔍 getAccountTypeBadge appelé avec:', type);
		const types = {
			livreur: {
				label: 'Livreur',
				className: 'bg-blue-100 text-blue-800',
			},
			commercant: {
				label: 'Commerçant',
				className: 'bg-purple-100 text-purple-800',
			},
			prestataire: {
				label: 'Prestataire',
				className: 'bg-orange-100 text-orange-800',
			},
		};

		const typeInfo = types[type as keyof typeof types] || {
			label: type || 'Type inconnu',
			className: 'bg-gray-100 text-gray-800',
		};

		console.log('🔍 typeInfo calculé:', typeInfo);
		return (
			<Badge variant='outline' className={typeInfo.className}>
				{typeInfo.label}
			</Badge>
		);
	};

	// Fonction formatDate améliorée avec gestion d'erreurs
	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) {
			return 'Date non définie';
		}

		try {
			const date = new Date(dateString);

			// Vérifier si la date est valide
			if (isNaN(date.getTime())) {
				console.warn('🔍 Date invalide:', dateString);
				return 'Date invalide';
			}

			return date.toLocaleDateString('fr-FR', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch (error) {
			console.error(
				'🔍 Erreur formatage date:',
				error,
				'pour:',
				dateString
			);
			return 'Erreur de date';
		}
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<RefreshCw className='h-8 w-8 animate-spin' />
				<span className='ml-2'>Chargement des validations...</span>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* En-tête */}
			<div className='flex justify-between items-center'>
				<div>
					<h1 className='text-2xl font-bold'>
						{t('admin.validations')}
					</h1>
					<p className='text-gray-600'>
						Gestion des validations de documents
					</p>
				</div>
				<div className='flex gap-2'>
					<Button
						onClick={() => loadJustifications(true)}
						variant='outline'
					>
						<RefreshCw className='h-4 w-4 mr-2' />
						Actualiser documents
					</Button>
					<Button onClick={() => loadShopkeepers()} variant='outline'>
						<RefreshCw className='h-4 w-4 mr-2' />
						Actualiser commerçants
					</Button>
				</div>
			</div>

			{/* Statistiques */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>
									Documents
								</p>
								<p className='text-2xl font-bold'>
									{justifications.length}
								</p>
							</div>
							<FileText className='h-8 w-8 text-gray-400' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>
									Commerçants
								</p>
								<p className='text-2xl font-bold'>
									{shopkeepers.length}
								</p>
							</div>
							<User className='h-8 w-8 text-gray-400' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>
									En attente
								</p>
								<p className='text-2xl font-bold text-yellow-600'>
									{justifications.filter(
										(j) =>
											j.verification_status === 'pending'
									).length +
										shopkeepers.filter(
											(s) =>
												s.verificationState ===
												'pending'
										).length}
								</p>
							</div>
							<Calendar className='h-8 w-8 text-yellow-400' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>
									Vérifiés
								</p>
								<p className='text-2xl font-bold text-green-600'>
									{justifications.filter(
										(j) =>
											j.verification_status === 'verified'
									).length +
										shopkeepers.filter(
											(s) =>
												s.verificationState ===
												'verified'
										).length}
								</p>
							</div>
							<Check className='h-8 w-8 text-green-400' />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>Rejetés</p>
								<p className='text-2xl font-bold text-red-600'>
									{justifications.filter(
										(j) =>
											j.verification_status === 'rejected'
									).length +
										shopkeepers.filter(
											(s) =>
												s.verificationState ===
												'rejected'
										).length}
								</p>
							</div>
							<X className='h-8 w-8 text-red-400' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filtres */}
			<Card>
				<CardContent className='p-4'>
					<div className='flex flex-col md:flex-row gap-4'>
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
								<Input
									placeholder='Rechercher par nom, email ou fichier...'
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className='w-full pl-10'
								/>
							</div>
						</div>
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className='w-full md:w-48'>
								<SelectValue placeholder='Statut' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les statuts
								</SelectItem>
								<SelectItem value='pending'>
									En attente
								</SelectItem>
								<SelectItem value='verified'>
									Vérifiés
								</SelectItem>
								<SelectItem value='rejected'>
									Rejetés
								</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={typeFilter}
							onValueChange={setTypeFilter}
						>
							<SelectTrigger className='w-full md:w-48'>
								<SelectValue placeholder='Type de compte' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les types
								</SelectItem>
								<SelectItem value='livreur'>
									Livreurs
								</SelectItem>
								<SelectItem value='commercant'>
									Commerçants
								</SelectItem>
								<SelectItem value='prestataire'>
									Prestataires
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Onglets pour séparer les validations */}
			<Tabs defaultValue='documents' className='w-full'>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value='documents'>
						Documents justificatifs ({filteredJustifications.length}
						)
					</TabsTrigger>
					<TabsTrigger value='shopkeepers'>
						Comptes commerçants ({shopkeepers.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value='documents'>
					<Card>
						<CardHeader>
							<CardTitle>
								Documents à valider (
								{filteredJustifications.length})
							</CardTitle>
							<CardDescription>
								Cliquez sur un document pour le visualiser et le
								traiter
							</CardDescription>
						</CardHeader>
						<CardContent>
							{filteredJustifications.length === 0 ? (
								<div className='text-center py-8'>
									<FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
									<p className='text-gray-500'>
										Aucun document trouvé
									</p>
								</div>
							) : (
								<div className='space-y-3'>
									{filteredJustifications.map(
										(justification) => (
											<div
												key={justification.id}
												className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
											>
												<div className='flex items-center space-x-4'>
													<User className='h-8 w-8 text-gray-400' />
													<div>
														<p className='font-medium'>
															{
																justification.firstName
															}{' '}
															{
																justification.lastName
															}
														</p>
														<p className='text-sm text-gray-600'>
															{
																justification.email
															}
														</p>
														<div className='flex items-center space-x-2 mt-1'>
															{getAccountTypeBadge(
																justification.account_type
															)}
															{getStatusBadge(
																justification.verification_status
															)}
														</div>
													</div>
												</div>

												<div className='flex items-center space-x-4'>
													<div className='text-right text-sm text-gray-600'>
														<p>
															{justification.fileName ||
																'Fichier inconnu'}
														</p>
														<p>
															Soumis le{' '}
															{formatDate(
																justification.submittedAt
															)}
														</p>
														{justification.reviewedAt && (
															<p>
																Traité le{' '}
																{formatDate(
																	justification.reviewedAt
																)}
															</p>
														)}
													</div>

													<div className='flex space-x-2'>
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																handleDownload(
																	justification.id,
																	justification.fileName ||
																		''
																)
															}
														>
															<Download className='h-4 w-4' />
														</Button>

														{justification.verification_status ===
															'pending' && (
															<>
																<Button
																	variant='default'
																	size='sm'
																	onClick={() =>
																		openReviewDialog(
																			justification,
																			'verify'
																		)
																	}
																	className='bg-green-600 hover:bg-green-700'
																>
																	<Check className='h-4 w-4' />
																</Button>
																<Button
																	variant='destructive'
																	size='sm'
																	onClick={() =>
																		openReviewDialog(
																			justification,
																			'reject'
																		)
																	}
																>
																	<X className='h-4 w-4' />
																</Button>
															</>
														)}
													</div>
												</div>
											</div>
										)
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='shopkeepers'>
					<Card>
						<CardHeader>
							<CardTitle>
								Comptes commerçants à valider (
								{shopkeepers.length})
							</CardTitle>
							<CardDescription>
								Validez ou rejetez les demandes de création de
								comptes commerçants
							</CardDescription>
						</CardHeader>
						<CardContent>
							{shopkeepersLoading ? (
								<div className='flex items-center justify-center h-32'>
									<RefreshCw className='h-6 w-6 animate-spin' />
									<span className='ml-2'>
										Chargement des commerçants...
									</span>
								</div>
							) : shopkeepers.length === 0 ? (
								<div className='text-center py-8'>
									<User className='h-12 w-12 text-gray-400 mx-auto mb-4' />
									<p className='text-gray-500'>
										Aucun commerçant en attente de
										validation
									</p>
								</div>
							) : (
								<div className='space-y-4'>
									{shopkeepers.map((shopkeeper) => (
										<div
											key={shopkeeper.id}
											className='border rounded-lg p-4'
										>
											<div className='flex items-center justify-between'>
												<div className='flex-1'>
													<div className='flex items-center gap-3'>
														<User className='h-5 w-5 text-gray-400' />
														<div>
															<h3 className='font-medium'>
																{
																	shopkeeper
																		.user
																		?.first_name
																}{' '}
																{
																	shopkeeper
																		.user
																		?.last_name
																}
															</h3>
															<p className='text-sm text-gray-600'>
																{
																	shopkeeper
																		.user
																		?.email
																}
															</p>
														</div>
													</div>
													<div className='mt-2 grid grid-cols-2 gap-4 text-sm'>
														<div>
															<span className='font-medium'>
																Nom du magasin:
															</span>
															<p className='text-gray-600'>
																{
																	shopkeeper.storeName
																}
															</p>
														</div>
														<div>
															<span className='font-medium'>
																Adresse:
															</span>
															<p className='text-gray-600'>
																{
																	shopkeeper.businessAddress
																}
															</p>
														</div>
													</div>
													<div className='mt-2'>
														<Badge
															variant={
																shopkeeper.verificationState ===
																'pending'
																	? 'secondary'
																	: 'default'
															}
														>
															{shopkeeper.verificationState ===
															'pending'
																? 'En attente'
																: shopkeeper.verificationState}
														</Badge>
													</div>
												</div>
												<div className='flex gap-2'>
													{shopkeeper.verificationState ===
														'pending' && (
														<>
															<Button
																variant='default'
																size='sm'
																onClick={() =>
																	openShopkeeperDialog(
																		shopkeeper,
																		'verify'
																	)
																}
																className='bg-green-600 hover:bg-green-700'
															>
																<Check className='h-4 w-4' />
															</Button>
															<Button
																variant='destructive'
																size='sm'
																onClick={() =>
																	openShopkeeperDialog(
																		shopkeeper,
																		'reject'
																	)
																}
															>
																<X className='h-4 w-4' />
															</Button>
														</>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialog de révision */}
			<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>
							{reviewAction === 'verify'
								? 'Approuver le document'
								: 'Rejeter le document'}
						</DialogTitle>
						<DialogDescription>
							{selectedJustification && (
								<>
									Document de{' '}
									{selectedJustification.firstName}{' '}
									{selectedJustification.lastName}
									<br />
									Fichier: {selectedJustification.fileName}
								</>
							)}
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div>
							<label className='text-sm font-medium'>
								Commentaires{' '}
								{reviewAction === 'reject'
									? '(obligatoire)'
									: '(optionnel)'}
							</label>
							<Textarea
								value={reviewComments}
								onChange={(e) =>
									setReviewComments(e.target.value)
								}
								placeholder={
									reviewAction === 'verify'
										? "Commentaires sur l'approbation..."
										: 'Raison du refus...'
								}
								className='mt-1'
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setReviewDialogOpen(false)}
							disabled={processing}
						>
							Annuler
						</Button>
						<Button
							onClick={handleReviewSubmit}
							disabled={
								processing ||
								(reviewAction === 'reject' &&
									!reviewComments.trim())
							}
							className={
								reviewAction === 'verify'
									? 'bg-green-600 hover:bg-green-700'
									: ''
							}
							variant={
								reviewAction === 'verify'
									? 'default'
									: 'destructive'
							}
						>
							{processing && (
								<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
							)}
							{reviewAction === 'verify'
								? 'Approuver'
								: 'Rejeter'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog de validation des commerçants */}
			<Dialog
				open={shopkeeperDialogOpen}
				onOpenChange={setShopkeeperDialogOpen}
			>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>
							{shopkeeperAction === 'verify'
								? 'Approuver le commerçant'
								: 'Rejeter le commerçant'}
						</DialogTitle>
						<DialogDescription>
							{selectedShopkeeper && (
								<>
									Commerçant:{' '}
									{selectedShopkeeper.user?.firstName}{' '}
									{selectedShopkeeper.user?.lastName}
									<br />
									Magasin: {selectedShopkeeper.storeName}
								</>
							)}
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div>
							<label className='text-sm font-medium'>
								Commentaires{' '}
								{shopkeeperAction === 'reject'
									? '(obligatoire)'
									: '(optionnel)'}
							</label>
							<Textarea
								value={reviewComments}
								onChange={(e) =>
									setReviewComments(e.target.value)
								}
								placeholder={
									shopkeeperAction === 'verify'
										? "Commentaires sur l'approbation..."
										: 'Raison du refus...'
								}
								className='mt-1'
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShopkeeperDialogOpen(false)}
							disabled={processing}
						>
							Annuler
						</Button>
						<Button
							onClick={() => handleShopkeeperAction()}
							disabled={
								processing ||
								(shopkeeperAction === 'reject' &&
									!reviewComments.trim())
							}
							className={
								shopkeeperAction === 'verify'
									? 'bg-green-600 hover:bg-green-700'
									: ''
							}
							variant={
								shopkeeperAction === 'verify'
									? 'default'
									: 'destructive'
							}
						>
							{processing && (
								<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
							)}
							{shopkeeperAction === 'verify'
								? 'Approuver'
								: 'Rejeter'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
