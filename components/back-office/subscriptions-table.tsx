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
import { SubscriptionData } from '@/hooks/use-subscriptions';
import { generateSubscriptionPDF } from '@/lib/pdf-generator';
import { SubscriptionDetailModal } from '@/components/back-office/subscription-detail-modal';
import { Eye, FileText, Mail, Package, Shield, Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionsTableProps {
	data: SubscriptionData[];
}

export function SubscriptionsTable({ data }: SubscriptionsTableProps) {
	const { t } = useLanguage();
	const { toast } = useToast();
	const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionData | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	const getStatusBadge = (status: string, isActive: boolean) => {
		if (isActive) {
			return <Badge className='bg-green-100 text-green-800'>Actif</Badge>;
		}

		const statusConfig = {
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

	const getSubscriptionTypeBadge = (type: string) => {
		const typeConfig = {
			free: { label: 'Gratuit', className: 'bg-blue-100 text-blue-800' },
			starter: {
				label: 'Starter',
				className: 'bg-purple-100 text-purple-800',
			},
			premium: {
				label: 'Premium',
				className: 'bg-yellow-100 text-yellow-800',
			},
			enterprise: {
				label: 'Enterprise',
				className: 'bg-red-100 text-red-800',
			},
		};

		const config =
			typeConfig[type as keyof typeof typeConfig] || typeConfig.free;

		return <Badge className={config.className}>{config.label}</Badge>;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('fr-FR');
	};

	const formatPrice = (price: number) => {
		return price === 0 ? 'Gratuit' : `${price.toFixed(2)}€`;
	};

	const handleViewDetails = (subscription: SubscriptionData) => {
		setSelectedSubscription(subscription);
		setIsDetailModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsDetailModalOpen(false);
		setSelectedSubscription(null);
	};

	const FeaturesTooltip = ({
		features,
	}: {
		features: SubscriptionData['features'];
	}) => (
		<div className='text-xs space-y-1'>
			<div className='flex items-center gap-1'>
				<Package className='h-3 w-3' />
				{features.max_packages_per_month === -1 
					? 'Illimité' 
					: `${features.max_packages_per_month} colis/mois`}
			</div>
			<div className='flex items-center gap-1'>
				<Shield className='h-3 w-3' />
				{features.insurance_coverage}€ couverture
			</div>
			<div className='flex items-center gap-1'>
				<Headphones className='h-3 w-3' />
				{features.priority_support
					? 'Support prioritaire'
					: 'Support standard'}
			</div>
		</div>
	);

	const handleGeneratePDF = (subscription: SubscriptionData) => {
		try {
			generateSubscriptionPDF(subscription);
			toast({
				title: "PDF généré",
				description: "Le PDF de l'abonnement a été téléchargé avec succès.",
			});
		} catch (error) {
			console.error('Erreur génération PDF:', error);
			toast({
				variant: "destructive",
				title: "Erreur",
				description: "Impossible de générer le PDF de l'abonnement.",
			});
		}
	};

	const handleContactClient = (subscription: SubscriptionData) => {
		const email = subscription.utilisateur.email;
		const clientName = subscription.utilisateur.firstName && subscription.utilisateur.lastName
			? `${subscription.utilisateur.firstName} ${subscription.utilisateur.lastName}`
			: email;
		const subject = `Concernant votre abonnement EcoDeli #${subscription.id}`;
		const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
		window.open(mailtoUrl, '_blank');
	};

	return (
		<>
			<ResponsiveTableWrapper>
				<Table>
					<TableHeader>
						<TableRow className='bg-white'>
							<TableHead className='font-medium'>Client</TableHead>
							<TableHead className='font-medium'>Email</TableHead>
							<TableHead className='font-medium'>
								Type d'abonnement
							</TableHead>
							<TableHead className='font-medium'>
								Prix mensuel
							</TableHead>
							<TableHead className='font-medium'>Statut</TableHead>
							<TableHead className='font-medium'>
								Fonctionnalités
							</TableHead>
							<TableHead className='font-medium'>
								Date début
							</TableHead>
							<TableHead className='font-medium'>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((subscription) => (
							<TableRow key={subscription.id}>
								<TableCell>
									<div className='font-medium'>
										{subscription.utilisateur.firstName && subscription.utilisateur.lastName
											? `${subscription.utilisateur.firstName} ${subscription.utilisateur.lastName}`
											: subscription.utilisateur.email}
									</div>
									<div className='text-sm text-gray-500'>
										ID: {subscription.id}
									</div>
									{subscription.utilisateur.client && (
										<div className='text-xs text-gray-500'>
											Client ID:{' '}
											{subscription.utilisateur.client.id}
										</div>
									)}
								</TableCell>
								<TableCell>
									<div className='text-sm'>
										{subscription.utilisateur.email}
									</div>
									{subscription.utilisateur.phone_number && (
										<div className='text-xs text-gray-500'>
											{subscription.utilisateur.phone_number}
										</div>
									)}
								</TableCell>
								<TableCell>
									{getSubscriptionTypeBadge(
										subscription.subscription_type
									)}
								</TableCell>
								<TableCell className='font-medium'>
									{formatPrice(subscription.monthly_price)}
								</TableCell>
								<TableCell>
									{getStatusBadge(
										subscription.status,
										subscription.is_active
									)}
									{subscription.is_expired && (
										<div className='text-xs text-orange-600 mt-1'>
											Expiré
										</div>
									)}
								</TableCell>
								<TableCell>
									<div className='w-48'>
										<FeaturesTooltip
											features={subscription.features}
										/>
									</div>
								</TableCell>
								<TableCell>
									<div className='text-sm'>
										{formatDate(subscription.start_date)}
									</div>
									{subscription.end_date && (
										<div className='text-xs text-gray-500'>
											Fin: {formatDate(subscription.end_date)}
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
											onClick={() => handleViewDetails(subscription)}
										>
											<Eye className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='h-8 w-8 p-0'
											title='Générer PDF'
											onClick={() => handleGeneratePDF(subscription)}
										>
											<FileText className='h-4 w-4' />
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='h-8 w-8 p-0'
											title='Contacter'
											onClick={() => handleContactClient(subscription)}
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

			<SubscriptionDetailModal
				subscription={selectedSubscription}
				isOpen={isDetailModalOpen}
				onClose={handleCloseModal}
			/>
		</>
	);
}
