'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/back-office/user-table';
import { Plus, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/src/hooks/use-admin';
import { useUser } from '@/src/stores/auth-store';
import {
	User,
	getUserRole,
	getUserFullName,
	JustificationPiece,
} from '@/src/types';

export function UsersContent() {
	const { t } = useLanguage();
	const { toast } = useToast();
	const { user: currentUser } = useUser(); // Utilisateur connecté
	const [selectedUser, setSelectedUser] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [justifications, setJustifications] = useState<JustificationPiece[]>(
		[]
	);
	const modalRef = useRef<HTMLDivElement>(null);

	// États pour la popup de confirmation
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [userToToggle, setUserToToggle] = useState<User | null>(null);

	// États pour la recherche et le filtrage
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

	// Utiliser le hook admin centralisé
	const { getAllUsers, toggleUserStatus, loading, error, clearError } =
		useAdmin();

	// États locaux
	const [users, setUsers] = useState<User[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	// Charger tous les utilisateurs avec l'architecture /src
	const loadUsers = async () => {
		try {
			clearError();
			const userData = await getAllUsers();
			setUsers(userData);
		} catch (error) {
			console.error('Error loading users:', error);
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: 'Erreur lors du chargement des utilisateurs',
			});
		}
	};

	// Charger les pièces justificatives (à implémenter dans useAdmin si nécessaire)
	const loadJustifications = async () => {
		try {
			// TODO: Ajouter cette méthode au hook useAdmin
			// const justifs = await getJustifications()
			// setJustifications(justifs)
		} catch (error) {
			console.error('Error loading justifications:', error);
		}
	};

	// Fonction de suppression supprimée - utilisation de la désactivation à la place

	// Ouvrir la popup de confirmation
	const handleToggleUserStatus = async (userId: number) => {
		// 🛡️ PROTECTION : Empêcher l'auto-désactivation
		if (currentUser && currentUser.id === userId) {
			toast({
				variant: 'destructive',
				title: '🚫 Action interdite',
				description:
					'Vous ne pouvez pas désactiver votre propre compte. Demandez à un autre administrateur de le faire.',
				duration: 6000,
			});
			return;
		}

		// Trouver l'utilisateur et ouvrir la popup
		const user = users.find((u) => u.id === userId);
		if (!user) {
			toast({
				variant: 'destructive',
				title: '❌ Erreur',
				description: 'Utilisateur non trouvé',
			});
			return;
		}

		setUserToToggle(user);
		setShowConfirmDialog(true);
	};

	// Confirmer le changement de statut
	const confirmToggleUserStatus = async () => {
		if (!userToToggle) return;

		try {
			const isCurrentlyActive = userToToggle.state === 'open';
			const actionPast = isCurrentlyActive ? 'désactivé' : 'activé';

			await toggleUserStatus(userToToggle.id);
			toast({
				title: '✅ Succès',
				description: `L'utilisateur "${userToToggle.firstName} ${userToToggle.lastName}" a été ${actionPast} avec succès`,
				variant: 'default',
				duration: 3000,
			});
			await loadUsers(); // Recharger les données
		} catch (error) {
			console.error('Error toggling user status:', error);
			toast({
				variant: 'destructive',
				title: '❌ Erreur',
				description:
					"Erreur lors de la modification du statut de l'utilisateur",
				duration: 5000,
			});
		} finally {
			setShowConfirmDialog(false);
			setUserToToggle(null);
		}
	};

	const handleStatusClick = (user: any) => {
		setSelectedUser(user);
		setIsModalOpen(true);
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadUsers();
		await loadJustifications();
		setRefreshing(false);
	};

	useEffect(() => {
		loadUsers();
		loadJustifications();
	}, []);

	// Debug après chargement des utilisateurs
	useEffect(() => {
		if (users.length > 0) {
			debugCounts();
		}
	}, [users]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				setIsModalOpen(false);
			}
		}

		if (isModalOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isModalOpen]);

	// Transformation utilisateur pour l'affichage table (utilise l'architecture /src)
	const transformUserForTable = (user: User) => {
		const userJustifications = justifications.filter(
			(j) => j.utilisateur_id === user.id
		);

		return {
			id: user.id,
			name: user.lastName || '',
			firstName: user.firstName || '',
			email: user.email,
			phone: user.phoneNumber || '',
			status: user.state === 'open' ? 'Actif' : 'Inactif',
			statusColor:
				user.state === 'open'
					? 'bg-[#8CD790] text-white'
					: 'bg-[#E57373] text-white',
			justificatives: userJustifications.map((j) => j.document_type), // Convertir en tableau de strings
			roles: getAllUserRoles(user), // Nouveau : tous les rôles de l'utilisateur
		};
	};

	// Nouvelle fonction pour récupérer tous les rôles d'un utilisateur
	const getAllUserRoles = (user: User): string[] => {
		const roles: string[] = [];

		if (user.admin) roles.push('admin');
		if (user.client) roles.push('client');
		if (user.livreur) roles.push('delivery_man');
		if (user.prestataire) roles.push('service_provider');
		if (user.commercant) roles.push('shopkeeper');

		// Si aucun rôle spécifique, considérer comme guest
		if (roles.length === 0) roles.push('guest');

		return roles;
	};

	// Fonction de recherche améliorée
	const searchUsers = useMemo(() => {
		return users.filter((user) => {
			const searchLower = searchTerm.toLowerCase();
			const matchesSearch =
				searchTerm === '' ||
				user.firstName?.toLowerCase().includes(searchLower) ||
				user.lastName?.toLowerCase().includes(searchLower) ||
				user.email?.toLowerCase().includes(searchLower) ||
				user.phoneNumber?.toLowerCase().includes(searchLower);

			const userRoles = getAllUserRoles(user);
			const matchesRoleFilter =
				selectedRoleFilter === 'all' ||
				userRoles.includes(selectedRoleFilter);

			return matchesSearch && matchesRoleFilter;
		});
	}, [users, searchTerm, selectedRoleFilter]);

	// Filtrer les utilisateurs par rôle - NOUVELLE VERSION qui permet les multi-rôles
	const getUsersByRole = (
		role: string,
		filteredUsers: User[] = searchUsers
	) => {
		return filteredUsers
			.filter((user) => {
				const userRoles = getAllUserRoles(user);
				switch (role) {
					case 'livreur':
						return userRoles.includes('delivery_man');
					case 'prestataire':
						return userRoles.includes('service_provider');
					case 'commercant':
						return userRoles.includes('shopkeeper');
					case 'admin':
						return userRoles.includes('admin');
					case 'client':
						return (
							userRoles.includes('client') ||
							userRoles.includes('guest')
						);
					default:
						return false;
				}
			})
			.map(transformUserForTable);
	};

	// Debug: compter les utilisateurs par catégorie (utilise l'architecture /src)
	const debugCounts = () => {
		const livreurs = users.filter((user) =>
			getAllUserRoles(user).includes('delivery_man')
		).length;
		const prestataires = users.filter((user) =>
			getAllUserRoles(user).includes('service_provider')
		).length;
		const commercants = users.filter((user) =>
			getAllUserRoles(user).includes('shopkeeper')
		).length;
		const admins = users.filter((user) =>
			getAllUserRoles(user).includes('admin')
		).length;
		const clients = users.filter(
			(user) =>
				getAllUserRoles(user).includes('client') ||
				getAllUserRoles(user).includes('guest')
		).length;

		console.log('🔍 Debug comptage utilisateurs (multi-rôles):', {
			total: users.length,
			livreurs,
			prestataires,
			commercants,
			admins,
			clients,
			Note: 'Les utilisateurs peuvent apparaître dans plusieurs catégories',
		});

		// Debug des utilisateurs multi-rôles
		const multiRoleUsers = users.filter(
			(user) => getAllUserRoles(user).length > 1
		);
		console.log(
			'👥 Utilisateurs avec plusieurs rôles:',
			multiRoleUsers.map((user) => ({
				id: user.id,
				email: user.email,
				nom: getUserFullName(user),
				roles: getAllUserRoles(user),
			}))
		);
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<RefreshCw className='h-8 w-8 animate-spin' />
				<span className='ml-2'>Chargement des utilisateurs...</span>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
				<div>
					<h1 className='text-2xl font-bold'>
						{t('admin.usersTitle')}
					</h1>
					<p className='text-gray-600'>
						Gestion de tous les utilisateurs ({users.length} total)
					</p>
				</div>
				<div className='flex gap-2'>
					<Button
						onClick={handleRefresh}
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
					<Link href='/admin/users/add'>
						<Button className='bg-[#8CD790] hover:bg-[#7ac57e] text-white'>
							<Plus className='mr-2 h-4 w-4' />
							{t('admin.newAccount')}
						</Button>
					</Link>
				</div>
			</div>

			{/* Barre de recherche et filtres */}
			<div className='bg-white p-4 rounded-lg border shadow-sm'>
				<div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
					<div className='flex-1 relative'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
						<Input
							placeholder='Rechercher par nom, prénom, email ou téléphone...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-10'
						/>
					</div>
					<div className='w-full sm:w-auto'>
						<Select
							value={selectedRoleFilter}
							onValueChange={setSelectedRoleFilter}
						>
							<SelectTrigger className='w-full sm:w-[200px]'>
								<SelectValue placeholder='Filtrer par type' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>
									Tous les types
								</SelectItem>
								<SelectItem value='admin'>
									Administrateurs
								</SelectItem>
								<SelectItem value='delivery_man'>
									Livreurs
								</SelectItem>
								<SelectItem value='service_provider'>
									Prestataires
								</SelectItem>
								<SelectItem value='shopkeeper'>
									Commerçants
								</SelectItem>
								<SelectItem value='client'>Clients</SelectItem>
								<SelectItem value='guest'>Invités</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				{searchTerm && (
					<div className='mt-2 text-sm text-gray-600'>
						{searchUsers.length} résultat(s) trouvé(s) pour "
						{searchTerm}"
					</div>
				)}
			</div>

			{/* Users Table - Sections séparées */}
			<div className='space-y-6'>
				{/* Administrateurs */}
				{getUsersByRole('admin').length > 0 && (
					<div>
						<h2 className='text-xl font-semibold mb-4'>
							{t('admin.administrators')} (
							{getUsersByRole('admin').length})
						</h2>
						<UserTable
							data={getUsersByRole('admin')}
							onStatusClick={() => {}}
							onToggleStatus={handleToggleUserStatus}
							currentUserId={currentUser?.id}
						/>
					</div>
				)}

				{/* Livreurs */}
				{getUsersByRole('livreur').length > 0 && (
					<div>
						<h2 className='text-xl font-semibold mb-4'>
							{t('admin.deliveryMan')} (
							{getUsersByRole('livreur').length})
						</h2>
						<UserTable
							data={getUsersByRole('livreur')}
							onStatusClick={handleStatusClick}
							onToggleStatus={handleToggleUserStatus}
							currentUserId={currentUser?.id}
						/>
					</div>
				)}

				{/* Prestataires de services */}
				{getUsersByRole('prestataire').length > 0 && (
					<div>
						<h2 className='text-xl font-semibold mb-4'>
							{t('admin.serviceProviders')} (
							{getUsersByRole('prestataire').length})
						</h2>
						<UserTable
							data={getUsersByRole('prestataire')}
							onStatusClick={handleStatusClick}
							onToggleStatus={handleToggleUserStatus}
							currentUserId={currentUser?.id}
						/>
					</div>
				)}

				{/* Commerçants */}
				{getUsersByRole('commercant').length > 0 && (
					<div>
						<h2 className='text-xl font-semibold mb-4'>
							{t('admin.shopkeepers')} (
							{getUsersByRole('commercant').length})
						</h2>
						<UserTable
							data={getUsersByRole('commercant')}
							onStatusClick={handleStatusClick}
							onToggleStatus={handleToggleUserStatus}
							currentUserId={currentUser?.id}
						/>
					</div>
				)}

				{/* Clients et utilisateurs réguliers */}
				{getUsersByRole('client').length > 0 && (
					<div>
						<div className='flex items-center gap-2 mb-4'>
							<h2 className='text-xl font-semibold'>
								{t('admin.users')} (
								{getUsersByRole('client').length})
							</h2>
							<span className='text-sm text-gray-500'>
								(Clients et utilisateurs sans rôle spécifique)
							</span>
						</div>
						<UserTable
							data={getUsersByRole('client')}
							onStatusClick={() => {}}
							onToggleStatus={handleToggleUserStatus}
							currentUserId={currentUser?.id}
						/>
					</div>
				)}

				{/* Message si aucun résultat */}
				{searchUsers.length === 0 && (
					<div className='text-center py-8'>
						<p className='text-gray-500'>
							{searchTerm
								? `Aucun utilisateur trouvé pour "${searchTerm}"`
								: 'Aucun utilisateur à afficher'}
						</p>
					</div>
				)}
			</div>

			{/* Popup de confirmation pour changement de statut */}
			<Dialog
				open={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5 text-orange-500' />
							{userToToggle?.state === 'open'
								? 'Désactiver'
								: 'Activer'}{' '}
							l'utilisateur
						</DialogTitle>
						<DialogDescription>
							{userToToggle?.state === 'open' ? (
								<>
									Êtes-vous sûr de vouloir désactiver
									l'utilisateur{' '}
									<span className='font-semibold'>
										{userToToggle?.firstName}{' '}
										{userToToggle?.lastName}
									</span>{' '}
									?
									<br />
									<br />
									<span className='text-red-600 text-sm'>
										⚠️ L'utilisateur ne pourra plus se
										connecter à son compte.
									</span>
								</>
							) : (
								<>
									Voulez-vous réactiver l'utilisateur{' '}
									<span className='font-semibold'>
										{userToToggle?.firstName}{' '}
										{userToToggle?.lastName}
									</span>{' '}
									?
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className='flex gap-2 sm:gap-0'>
						<Button
							variant='outline'
							onClick={() => {
								setShowConfirmDialog(false);
								setUserToToggle(null);
							}}
						>
							Annuler
						</Button>
						<Button
							onClick={confirmToggleUserStatus}
							className={
								userToToggle?.state === 'open'
									? 'bg-red-600 hover:bg-red-700 text-white'
									: 'bg-green-600 hover:bg-green-700 text-white'
							}
						>
							{userToToggle?.state === 'open'
								? 'Désactiver'
								: 'Activer'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
