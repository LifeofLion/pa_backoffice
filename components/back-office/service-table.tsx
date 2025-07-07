'use client';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { ResponsiveTableWrapper } from '@/components/back-office/responsive-table-wrapper';
import { useLanguage } from '@/components/language-context';
import { useState } from 'react';
import {
	Star,
	MoreHorizontal,
	CheckCircle,
	XCircle,
	Trash2,
	Eye,
	MapPin,
	Calendar,
	Euro,
	User,
	Clock,
	Edit,
	ToggleLeft,
	ToggleRight,
} from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminServiceData } from '@/src/types/admin';

interface ServiceTableProps {
	data: AdminServiceData[];
	onValidate?: (
		id: number,
		status: 'approved' | 'rejected',
		comments?: string
	) => void;
	onToggleStatus?: (id: number) => void;
	onDelete?: (id: number) => void;
	onEdit?: (id: number) => void;
}

export function ServiceTable({
	data = [],
	onValidate,
	onToggleStatus,
	onDelete,
	onEdit,
}: ServiceTableProps) {
	const { t } = useLanguage();
	const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>(
		{}
	);
	const [validationDialog, setValidationDialog] = useState<{
		open: boolean;
		serviceId: number | null;
		action: 'approve' | 'reject' | null;
	}>({
		open: false,
		serviceId: null,
		action: null,
	});
	const [validationComments, setValidationComments] = useState('');

	// ================================================================
	// UTILITIES
	// ================================================================

	const toggleRowExpansion = (id: number) => {
		setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const formatDate = (dateString: string): string => {
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Date invalide';

			return new Intl.DateTimeFormat('fr-FR', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			}).format(date);
		} catch {
			return 'Date invalide';
		}
	};

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR',
		}).format(amount);
	};

	const getStatusColor = (status: string): string => {
		const colors: Record<string, string> = {
			scheduled: 'bg-blue-100 text-blue-800',
			in_progress: 'bg-purple-100 text-purple-800',
			completed: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	};

	const getStatusLabel = (status: string): string => {
		const labels: Record<string, string> = {
			scheduled: 'Programmé',
			in_progress: 'En cours',
			completed: 'Terminé',
			cancelled: 'Annulé',
		};
		return labels[status] || status;
	};

	const renderStars = (rating: number | null) => {
		if (!rating) return <span className='text-gray-400'>N/A</span>;

		const stars = [];
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 !== 0;

		for (let i = 0; i < fullStars; i++) {
			stars.push(
				<Star
					key={`full-${i}`}
					className='h-4 w-4 fill-yellow-400 text-yellow-400'
				/>
			);
		}

		if (hasHalfStar) {
			stars.push(
				<Star
					key='half'
					className='h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50'
				/>
			);
		}

		const emptyStars = 5 - Math.ceil(rating);
		for (let i = 0; i < emptyStars; i++) {
			stars.push(
				<Star key={`empty-${i}`} className='h-4 w-4 text-gray-300' />
			);
		}

		return (
			<div className='flex items-center gap-1'>
				<div className='flex'>{stars}</div>
				<span className='text-sm text-gray-600 ml-1'>({rating})</span>
			</div>
		);
	};

	// ================================================================
	// ACTIONS
	// ================================================================

	const handleValidationSubmit = () => {
		if (!validationDialog.serviceId || !validationDialog.action) return;

		const status =
			validationDialog.action === 'approve' ? 'approved' : 'rejected';
		onValidate?.(validationDialog.serviceId, status, validationComments);

		// Reset dialog state
		setValidationDialog({ open: false, serviceId: null, action: null });
		setValidationComments('');
	};

	const openValidationDialog = (
		serviceId: number,
		action: 'approve' | 'reject'
	) => {
		setValidationDialog({
			open: true,
			serviceId,
			action,
		});
	};

	// ================================================================
	// COMPOSANTS
	// ================================================================

	const ActionsDropdown = ({ service }: { service: AdminServiceData }) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' className='h-8 w-8 p-0'>
					<span className='sr-only'>Ouvrir menu</span>
					<MoreHorizontal className='h-4 w-4' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem
					onClick={() => toggleRowExpansion(service.id)}
				>
					<Eye className='mr-2 h-4 w-4' />
					Voir détails
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onEdit?.(service.id)}>
					<Edit className='mr-2 h-4 w-4' />
					Modifier
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onToggleStatus?.(service.id)}>
					{service.isActive ? (
						<>
							<ToggleLeft className='mr-2 h-4 w-4' />
							Désactiver
						</>
					) : (
						<>
							<ToggleRight className='mr-2 h-4 w-4' />
							Activer
						</>
					)}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => openValidationDialog(service.id, 'approve')}
				>
					<CheckCircle className='mr-2 h-4 w-4' />
					Approuver
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => openValidationDialog(service.id, 'reject')}
				>
					<XCircle className='mr-2 h-4 w-4' />
					Rejeter
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => onDelete?.(service.id)}
					className='text-red-600'
				>
					<Trash2 className='mr-2 h-4 w-4' />
					Supprimer
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	const ServiceDetailsRow = ({ service }: { service: AdminServiceData }) => (
		<TableRow>
			<TableCell colSpan={7} className='bg-gray-50 p-0'>
				<Card className='border-0 shadow-none'>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{/* Informations principales */}
							<div className='space-y-3'>
								<h4 className='font-semibold text-sm text-gray-900'>
									Détails du Service
								</h4>
								<div className='space-y-2'>
									<div className='flex items-center gap-2'>
										<MapPin className='h-4 w-4 text-gray-500' />
										<span className='text-sm'>
											{service.location ||
												'Localisation non définie'}
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Calendar className='h-4 w-4 text-gray-500' />
										<span className='text-sm'>
											Du {formatDate(service.startDate)}{' '}
											au {formatDate(service.endDate)}
										</span>
									</div>
									{service.duration && (
										<div className='flex items-center gap-2'>
											<Clock className='h-4 w-4 text-gray-500' />
											<span className='text-sm'>
												{service.duration} minutes
											</span>
										</div>
									)}
								</div>
								<div className='pt-2'>
									<p className='text-sm text-gray-600'>
										{service.description}
									</p>
								</div>
							</div>

							{/* Informations prestataire */}
							<div className='space-y-3'>
								<h4 className='font-semibold text-sm text-gray-900'>
									Prestataire
								</h4>
								<div className='space-y-2'>
									<div className='flex items-center gap-2'>
										<User className='h-4 w-4 text-gray-500' />
										<span className='text-sm font-medium'>
											{service.prestataireName}
										</span>
									</div>
									<div className='text-sm text-gray-600'>
										{service.prestataireEmail}
									</div>
									<div className='flex items-center gap-2'>
										<Star className='h-4 w-4 text-yellow-500' />
										<span className='text-sm'>
											{service.prestataireRating
												? `${service.prestataireRating}/5`
												: 'Non évalué'}
										</span>
									</div>
								</div>
							</div>

							{/* Statistiques */}
							<div className='space-y-3'>
								<h4 className='font-semibold text-sm text-gray-900'>
									Informations
								</h4>
								<div className='space-y-2'>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-gray-600'>
											Créé le:
										</span>
										<span className='text-sm'>
											{formatDate(service.createdAt)}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-gray-600'>
											Mis à jour:
										</span>
										<span className='text-sm'>
											{formatDate(service.updatedAt)}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-gray-600'>
											Type:
										</span>
										<Badge variant='outline'>
											{service.serviceType}
										</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-gray-600'>
											Statut:
										</span>
										<Badge
											variant={
												service.isActive
													? 'default'
													: 'secondary'
											}
										>
											{service.isActive
												? 'Actif'
												: 'Inactif'}
										</Badge>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</TableCell>
		</TableRow>
	);

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardContent className='flex items-center justify-center h-48'>
					<p className='text-gray-500'>Aucun service trouvé</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<ResponsiveTableWrapper>
				<Table>
					<TableHeader>
						<TableRow className='bg-white'>
							<TableHead className='font-medium'>
								Service
							</TableHead>
							<TableHead className='font-medium'>
								Prestataire
							</TableHead>
							<TableHead className='font-medium'>Prix</TableHead>
							<TableHead className='font-medium'>
								Statut
							</TableHead>
							<TableHead className='font-medium'>Note</TableHead>
							<TableHead className='font-medium'>Actif</TableHead>
							<TableHead className='font-medium text-right'>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((service) => (
							<>
								<TableRow
									key={service.id}
									className='cursor-pointer hover:bg-gray-50'
									onClick={() =>
										toggleRowExpansion(service.id)
									}
								>
									<TableCell>
										<div className='space-y-1'>
											<p className='font-medium'>
												{service.name}
											</p>
											<p className='text-sm text-gray-600'>
												{service.serviceType}
											</p>
										</div>
									</TableCell>
									<TableCell>
										<div className='space-y-1'>
											<p className='font-medium'>
												{service.prestataireName}
											</p>
											<p className='text-sm text-gray-600'>
												{service.prestataireEmail}
											</p>
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-1'>
											<Euro className='h-4 w-4 text-gray-500' />
											<span className='font-medium'>
												{formatCurrency(service.price)}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											className={getStatusColor(
												service.status
											)}
										>
											{getStatusLabel(service.status)}
										</Badge>
									</TableCell>
									<TableCell>
										{renderStars(service.prestataireRating)}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												service.isActive
													? 'default'
													: 'secondary'
											}
										>
											{service.isActive
												? 'Actif'
												: 'Inactif'}
										</Badge>
									</TableCell>
									<TableCell className='text-right'>
										<ActionsDropdown service={service} />
									</TableCell>
								</TableRow>
								{expandedRows[service.id] && (
									<ServiceDetailsRow service={service} />
								)}
							</>
						))}
					</TableBody>
				</Table>
			</ResponsiveTableWrapper>

			{/* Dialog de validation */}
			<Dialog
				open={validationDialog.open}
				onOpenChange={(open) =>
					setValidationDialog({ ...validationDialog, open })
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{validationDialog.action === 'approve'
								? 'Approuver'
								: 'Rejeter'}{' '}
							le service
						</DialogTitle>
						<DialogDescription>
							Êtes-vous sûr de vouloir{' '}
							{validationDialog.action === 'approve'
								? 'approuver'
								: 'rejeter'}{' '}
							ce service ? Vous pouvez ajouter des commentaires
							optionnels.
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<Textarea
							placeholder='Commentaires administrateur (optionnel)'
							value={validationComments}
							onChange={(e) =>
								setValidationComments(e.target.value)
							}
						/>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() =>
								setValidationDialog({
									open: false,
									serviceId: null,
									action: null,
								})
							}
						>
							Annuler
						</Button>
						<Button
							onClick={handleValidationSubmit}
							variant={
								validationDialog.action === 'approve'
									? 'default'
									: 'destructive'
							}
						>
							{validationDialog.action === 'approve'
								? 'Approuver'
								: 'Rejeter'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
