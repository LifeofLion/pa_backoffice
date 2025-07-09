'use client';

import { useState } from 'react';
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
import { ResponsiveTableWrapper } from '@/components/back-office/responsive-table-wrapper';
import { useLanguage } from '@/components/language-context';
import { ContractData } from '@/hooks/use-contracts';
import { generateContractPDF } from '@/lib/pdf-generator';
import { ContractDetailModal } from '@/components/back-office/contract-detail-modal';
import { Eye, FileText, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContractsTableProps {
	data: ContractData[];
}

export function ContractsTable({ data }: ContractsTableProps) {
	const { t } = useLanguage();
	const { toast } = useToast();
	const [selectedContract, setSelectedContract] =
		useState<ContractData | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			active: {
				label: 'Actif',
				variant: 'default' as const,
				className: 'bg-green-100 text-green-800',
			},
			inactive: {
				label: 'Inactif',
				variant: 'secondary' as const,
				className: 'bg-gray-100 text-gray-800',
			},
			cancelled: {
				label: 'Annulé',
				variant: 'destructive' as const,
				className: 'bg-red-100 text-red-800',
			},
			expired: {
				label: 'Expiré',
				variant: 'outline' as const,
				className: 'bg-orange-100 text-orange-800',
			},
		};

		const config =
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.inactive;

		return (
			<Badge variant={config.variant} className={config.className}>
				{config.label}
			</Badge>
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('fr-FR');
	};

	const formatPrice = (price: number) => {
		return `${price.toFixed(2)}€`;
	};

	const handleViewDetails = (contract: ContractData) => {
		setSelectedContract(contract);
		setIsDetailModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsDetailModalOpen(false);
		setSelectedContract(null);
	};

	const handleGeneratePDF = (contract: ContractData) => {
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

	const handleContactShopkeeper = (contract: ContractData) => {
		const email = contract.commercant.user.email;
		const subject = `Concernant votre contrat EcoDeli #${contract.id}`;
		const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
			subject
		)}`;
		window.open(mailtoUrl, '_blank');
	};

	return (
		<>
			<ResponsiveTableWrapper>
				<Table>
					<TableHeader>
						<TableRow className='bg-white'>
							<TableHead className='font-medium'>
								Commerçant
							</TableHead>
							<TableHead className='font-medium'>Email</TableHead>
							<TableHead className='font-medium'>
								Magasin
							</TableHead>
							<TableHead className='font-medium'>Plan</TableHead>
							<TableHead className='font-medium'>Prix</TableHead>
							<TableHead className='font-medium'>
								Statut
							</TableHead>
							<TableHead className='font-medium'>
								Date début
							</TableHead>
							<TableHead className='font-medium'>
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((contract) => (
							<TableRow key={contract.id}>
								<TableCell>
									<div className='font-medium'>
										{contract.commercant.user.firstName}{' '}
										{contract.commercant.user.lastName}
									</div>
									<div className='text-sm text-gray-500'>
										ID: {contract.id}
									</div>
								</TableCell>
								<TableCell>
									<div className='text-sm'>
										{contract.commercant.user.email}
									</div>
									{contract.commercant.user.phone_number && (
										<div className='text-xs text-gray-500'>
											{
												contract.commercant.user
													.phone_number
											}
										</div>
									)}
								</TableCell>
								<TableCell>
									<div className='font-medium'>
										{contract.commercant.storeName}
									</div>
									{contract.commercant.businessAddress && (
										<div className='text-xs text-gray-500'>
											{
												contract.commercant
													.businessAddress
											}
										</div>
									)}
								</TableCell>
								<TableCell>
									<div className='font-medium'>
										{contract.plan.name}
									</div>
									{contract.plan.description && (
										<div className='text-xs text-gray-500'>
											{contract.plan.description}
										</div>
									)}
								</TableCell>
								<TableCell className='font-medium'>
									{formatPrice(contract.plan.price)}
								</TableCell>
								<TableCell>
									{getStatusBadge(contract.status)}
								</TableCell>
								<TableCell>
									<div className='text-sm'>
										{formatDate(contract.startDate)}
									</div>
									{contract.endDate && (
										<div className='text-xs text-gray-500'>
											Fin: {formatDate(contract.endDate)}
										</div>
									)}
								</TableCell>
								<TableCell>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											className='h-8 w-8 p-0'
											title='Voir les détails'
											onClick={() =>
												handleViewDetails(contract)
											}
										>
											<Eye className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='h-8 w-8 p-0'
											title='Générer PDF'
											onClick={() =>
												handleGeneratePDF(contract)
											}
										>
											<FileText className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='h-8 w-8 p-0'
											title='Contacter'
											onClick={() =>
												handleContactShopkeeper(
													contract
												)
											}
										>
											<Mail className='h-4 w-4' />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</ResponsiveTableWrapper>

			<ContractDetailModal
				contract={selectedContract}
				isOpen={isDetailModalOpen}
				onClose={handleCloseModal}
			/>
		</>
	);
}
