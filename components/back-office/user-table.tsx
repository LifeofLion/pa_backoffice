'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/language-context';
import { useUser, useAuth } from '@/src/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

interface User {
	id: number;
	name: string;
	firstName: string;
	email: string;
	phone: string;
	status: string;
	statusColor: string;
	roles?: string[];
}

interface UserTableProps {
	data: User[];
	onStatusClick: (user: User) => void;
	onToggleStatus: (userId: number) => void;
	currentUserId?: number; // ID de l'utilisateur connecté pour empêcher l'auto-désactivation
}

const getRoleLabel = (role: string): string => {
	const roleLabels: { [key: string]: string } = {
		admin: 'Administrateur',
		client: 'Client',
		delivery_man: 'Livreur',
		service_provider: 'Prestataire',
		shopkeeper: 'Commerçant',
		guest: 'Invité',
	};
	return roleLabels[role] || role;
};

const getRoleBadgeVariant = (role: string) => {
	const roleColors: {
		[key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
	} = {
		admin: 'destructive',
		client: 'default',
		delivery_man: 'secondary',
		service_provider: 'outline',
		shopkeeper: 'default',
		guest: 'secondary',
	};
	return roleColors[role] || 'outline';
};

export function UserTable({
	data,
	onStatusClick,
	onToggleStatus,
	currentUserId,
}: UserTableProps) {
	const { t } = useLanguage();
	const { isAuthenticated } = useUser();
	const { getUserRole } = useAuth();
	const { toast } = useToast();

	const handleEditClick = (userId: number) => {
		console.log('🔍 Debug édition utilisateur:', {
			userId,
			isAuthenticated,
			userRole: getUserRole(),
			localStorageToken: localStorage.getItem('authToken'),
			sessionStorageToken: sessionStorage.getItem('authToken'),
			zustandStorage: localStorage.getItem('ecodeli-auth-storage'),
		});

		if (!isAuthenticated) {
			toast({
				variant: 'destructive',
				title: 'Non authentifié',
				description:
					'Vous devez être connecté pour éditer un utilisateur.',
			});
			return;
		}

		const userRole = getUserRole();
		if (userRole !== 'admin') {
			toast({
				variant: 'destructive',
				title: 'Accès refusé',
				description: `Vous devez être administrateur pour éditer un utilisateur. Rôle actuel: ${userRole}`,
			});
			return;
		}

		window.location.href = `/admin/users/edit/${userId}`;
	};

	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							{t('admin.userName')}
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							{t('admin.userFirstName')}
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							{t('admin.userEmail')}
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							{t('admin.userPhone')}
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							Rôles
						</th>
						<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
							{t('admin.userStatus')}
						</th>

						<th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
							{t('admin.action')}
						</th>
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200'>
					{data.map((user) => (
						<tr key={user.id} className='hover:bg-gray-50'>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
								{user.name}
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
								{user.firstName}
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
								{user.email}
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
								{user.phone || '-'}
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
								<div className='flex flex-wrap gap-1'>
									{user.roles && user.roles.length > 0 ? (
										user.roles.map((role) => (
											<Badge
												key={role}
												variant={getRoleBadgeVariant(
													role
												)}
												className='text-xs'
											>
												{getRoleLabel(role)}
											</Badge>
										))
									) : (
										<Badge
											variant='secondary'
											className='text-xs'
										>
											Aucun rôle
										</Badge>
									)}
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm'>
								<div className='flex items-center gap-2'>
									<Badge
										variant={
											user.status === 'Actif'
												? 'default'
												: 'secondary'
										}
										className='text-xs'
									>
										{user.status}
									</Badge>
									{onToggleStatus && (
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												onToggleStatus(user.id)
											}
											disabled={currentUserId === user.id}
											className={`px-3 py-1 text-xs ${
												currentUserId === user.id
													? 'text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
													: user.status === 'Actif'
													? 'text-red-600 border-red-600 hover:bg-red-50'
													: 'text-green-600 border-green-600 hover:bg-green-50'
											}`}
											title={
												currentUserId === user.id
													? 'Vous ne pouvez pas modifier votre propre statut'
													: `${
															user.status ===
															'Actif'
																? 'Désactiver'
																: 'Activer'
													  } l'utilisateur`
											}
										>
											{currentUserId === user.id
												? '🔒 Vous'
												: user.status === 'Actif'
												? 'Désactiver'
												: 'Activer'}
										</Button>
									)}
								</div>
							</td>

							<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => handleEditClick(user.id)}
									className='text-blue-600 border-blue-600 hover:bg-blue-50'
								>
									{t('admin.edit')}
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{data.length === 0 && (
				<div className='text-center py-8 text-gray-500'>
					<p>Aucun utilisateur à afficher dans cette catégorie</p>
				</div>
			)}
		</div>
	);
}
