'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ContractData } from '@/hooks/use-contracts';
import { generateContractPDF } from '@/lib/pdf-generator';
import {
	FileText,
	Mail,
	Phone,
	MapPin,
	Calendar,
	Euro,
	User,
	Store,
	CreditCard,
	Clock,
	Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContractDetailModalProps {
	contract: ContractData | null;
	isOpen: boolean;
	onClose: () => void;
}

export function ContractDetailModal({
	contract,
	isOpen,
	onClose,
}: ContractDetailModalProps) {
	const { toast } = useToast();

	if (!contract) return null;

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			active: {
				label: 'Actif',
				className: 'bg-green-100 text-green-800',
			},
			inactive: {
				label: 'Inactif',
				className: 'bg-gray-100 text-gray-800',
			},
			cancelled: {
				label: 'Annulé',
				className: 'bg-red-100 text-red-800',
			},
			expired: {
				label: 'Expiré',
				className: 'bg-orange-100 text-orange-800',
			},
		};

		const config =
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.inactive;

		return <Badge className={config.className}>{config.label}</Badge>;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatPrice = (price: number) => {
		return `${price.toFixed(2)}€`;
	};

	const handleGeneratePDF = () => {
		try {
			generateContractPDF(contract);
			toast({
				title: 'PDF généré',
				description: 'Le PDF du contrat a été téléchargé avec succès.',
			});
		} catch (error) {
			console.error('Erreur génération PDF:', error);
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: 'Impossible de générer le PDF du contrat.',
			});
		}
	};

	const handleContactShopkeeper = () => {
		const email = contract.commercant.user.email;
		const subject = `Concernant votre contrat EcoDeli #${contract.id}`;
		const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
			subject
		)}`;
		window.open(mailtoUrl, '_blank');
	};

	const calculateContractDuration = () => {
		const start = new Date(contract.startDate);
		const end = contract.endDate ? new Date(contract.endDate) : new Date();
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 30) {
			return `${diffDays} jours`;
		} else if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return `${months} mois`;
		} else {
			const years = Math.floor(diffDays / 365);
			const remainingDays = diffDays % 365;
			const remainingMonths = Math.floor(remainingDays / 30);
			return `${years} an${years > 1 ? 's' : ''}${
				remainingMonths > 0 ? ` et ${remainingMonths} mois` : ''
			}`;
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-xl'>
						<Store className='h-6 w-6 text-green-600' />
						Détails du Contrat Commercial #{contract.id}
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* Statut et actions */}
					<div className='flex items-center justify-between bg-gray-50 p-4 rounded-lg'>
						<div className='flex items-center gap-3'>
							{getStatusBadge(contract.status)}
							<div className='text-sm text-gray-600'>
								Créé le {formatDate(contract.createdAt)}
							</div>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={handleGeneratePDF}
								className='flex items-center gap-2'
							>
								<FileText className='h-4 w-4' />
								Télécharger PDF
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={handleContactShopkeeper}
								className='flex items-center gap-2'
							>
								<Mail className='h-4 w-4' />
								Contacter
							</Button>
						</div>
					</div>

					{/* Informations du plan */}
					<div className='bg-blue-50 p-4 rounded-lg'>
						<h3 className='text-lg font-semibold flex items-center gap-2 mb-3'>
							<CreditCard className='h-5 w-5 text-blue-600' />
							Informations du Plan
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Info className='h-4 w-4 text-gray-500' />
									<span className='font-medium'>
										Nom du plan
									</span>
								</div>
								<p className='text-lg font-bold text-blue-700'>
									{contract.plan.name}
								</p>
							</div>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Euro className='h-4 w-4 text-gray-500' />
									<span className='font-medium'>
										Prix mensuel
									</span>
								</div>
								<p className='text-lg font-bold text-green-600'>
									{formatPrice(contract.plan.price)}/mois
								</p>
							</div>
						</div>
						{contract.plan.description && (
							<div className='mt-4'>
								<div className='flex items-center gap-2 mb-2'>
									<Info className='h-4 w-4 text-gray-500' />
									<span className='font-medium'>
										Description
									</span>
								</div>
								<p className='text-gray-700 bg-white p-3 rounded border'>
									{contract.plan.description}
								</p>
							</div>
						)}
					</div>

					<Separator />

					{/* Informations du commerçant */}
					<div>
						<h3 className='text-lg font-semibold flex items-center gap-2 mb-4'>
							<User className='h-5 w-5 text-gray-600' />
							Informations du Commerçant
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{/* Informations personnelles */}
							<div className='space-y-4'>
								<h4 className='font-medium text-gray-700 border-b pb-1'>
									Coordonnées personnelles
								</h4>
								<div className='space-y-3'>
									<div className='flex items-center gap-3'>
										<User className='h-4 w-4 text-gray-500' />
										<div>
											<p className='font-medium'>
												{
													contract.commercant.user
														.firstName
												}{' '}
												{
													contract.commercant.user
														.lastName
												}
											</p>
											<p className='text-sm text-gray-600'>
												ID:{' '}
												{contract.commercant.user.id}
											</p>
										</div>
									</div>
									<div className='flex items-center gap-3'>
										<Mail className='h-4 w-4 text-gray-500' />
										<div>
											<p className='font-medium'>
												{contract.commercant.user.email}
											</p>
											<p className='text-sm text-gray-600'>
												Email professionnel
											</p>
										</div>
									</div>
									{contract.commercant.user.phone_number && (
										<div className='flex items-center gap-3'>
											<Phone className='h-4 w-4 text-gray-500' />
											<div>
												<p className='font-medium'>
													{
														contract.commercant.user
															.phone_number
													}
												</p>
												<p className='text-sm text-gray-600'>
													Téléphone
												</p>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Informations commerciales */}
							<div className='space-y-4'>
								<h4 className='font-medium text-gray-700 border-b pb-1'>
									Informations commerciales
								</h4>
								<div className='space-y-3'>
									<div className='flex items-center gap-3'>
										<Store className='h-4 w-4 text-gray-500' />
										<div>
											<p className='font-medium'>
												{contract.commercant.storeName}
											</p>
											<p className='text-sm text-gray-600'>
												Nom du magasin
											</p>
										</div>
									</div>
									{contract.commercant.businessAddress && (
										<div className='flex items-start gap-3'>
											<MapPin className='h-4 w-4 text-gray-500 mt-1' />
											<div>
												<p className='font-medium'>
													{
														contract.commercant
															.businessAddress
													}
												</p>
												<p className='text-sm text-gray-600'>
													Adresse du magasin
												</p>
											</div>
										</div>
									)}
									<div className='flex items-center gap-3'>
										<Info className='h-4 w-4 text-gray-500' />
										<div>
											<p className='font-medium'>
												ID Commerçant:{' '}
												{contract.commercant.id}
											</p>
											<p className='text-sm text-gray-600'>
												Identifiant unique
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Informations temporelles */}
					<div>
						<h3 className='text-lg font-semibold flex items-center gap-2 mb-4'>
							<Clock className='h-5 w-5 text-gray-600' />
							Informations Temporelles
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div className='bg-green-50 p-4 rounded-lg'>
								<div className='flex items-center gap-2 mb-2'>
									<Calendar className='h-4 w-4 text-green-600' />
									<span className='font-medium text-green-800'>
										Date de début
									</span>
								</div>
								<p className='text-lg font-bold text-green-700'>
									{formatDate(contract.startDate)}
								</p>
							</div>
							{contract.endDate && (
								<div className='bg-orange-50 p-4 rounded-lg'>
									<div className='flex items-center gap-2 mb-2'>
										<Calendar className='h-4 w-4 text-orange-600' />
										<span className='font-medium text-orange-800'>
											Date de fin
										</span>
									</div>
									<p className='text-lg font-bold text-orange-700'>
										{formatDate(contract.endDate)}
									</p>
								</div>
							)}
							<div className='bg-blue-50 p-4 rounded-lg'>
								<div className='flex items-center gap-2 mb-2'>
									<Clock className='h-4 w-4 text-blue-600' />
									<span className='font-medium text-blue-800'>
										Durée
									</span>
								</div>
								<p className='text-lg font-bold text-blue-700'>
									{calculateContractDuration()}
								</p>
							</div>
						</div>
					</div>

					{/* Informations supplémentaires */}
					<div className='bg-gray-50 p-4 rounded-lg'>
						<h4 className='font-medium text-gray-700 mb-3'>
							Informations supplémentaires
						</h4>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
							<div>
								<span className='font-medium'>
									Date de création:
								</span>
								<br />
								{formatDate(contract.createdAt)}
							</div>
							<div>
								<span className='font-medium'>
									Dernière modification:
								</span>
								<br />
								{formatDate(contract.updatedAt)}
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
