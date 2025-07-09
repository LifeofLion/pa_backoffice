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
import { SubscriptionData } from '@/hooks/use-subscriptions';
import { generateSubscriptionPDF } from '@/lib/pdf-generator';
import {
	FileText,
	Mail,
	Phone,
	Calendar,
	Euro,
	User,
	Package,
	Shield,
	Headphones,
	Clock,
	Info,
	CheckCircle,
	XCircle,
	AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionDetailModalProps {
	subscription: SubscriptionData | null;
	isOpen: boolean;
	onClose: () => void;
}

export function SubscriptionDetailModal({
	subscription,
	isOpen,
	onClose,
}: SubscriptionDetailModalProps) {
	const { toast } = useToast();

	if (!subscription) return null;

	const getStatusBadge = (status: string, isActive: boolean) => {
		if (isActive) {
			return (
				<Badge className='bg-green-100 text-green-800 flex items-center gap-1'>
					<CheckCircle className='h-3 w-3' />
					Actif
				</Badge>
			);
		}

		const statusConfig = {
			inactive: {
				label: 'Inactif',
				className: 'bg-gray-100 text-gray-800',
				icon: XCircle,
			},
			cancelled: {
				label: 'Annulé',
				className: 'bg-red-100 text-red-800',
				icon: XCircle,
			},
			expired: {
				label: 'Expiré',
				className: 'bg-orange-100 text-orange-800',
				icon: AlertCircle,
			},
		};

		const config =
			statusConfig[status as keyof typeof statusConfig] ||
			statusConfig.inactive;
		const IconComponent = config.icon;

		return (
			<Badge className={`${config.className} flex items-center gap-1`}>
				<IconComponent className='h-3 w-3' />
				{config.label}
			</Badge>
		);
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
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatPrice = (price: number) => {
		return price === 0 ? 'Gratuit' : `${price.toFixed(2)}€`;
	};

	const handleGeneratePDF = () => {
		try {
			generateSubscriptionPDF(subscription);
			toast({
				title: 'PDF généré',
				description:
					"Le PDF de l'abonnement a été téléchargé avec succès.",
			});
		} catch (error) {
			console.error('Erreur génération PDF:', error);
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: "Impossible de générer le PDF de l'abonnement.",
			});
		}
	};

	const handleContactClient = () => {
		const email = subscription.utilisateur.email;
		const subject = `Concernant votre abonnement EcoDeli #${subscription.id}`;
		const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
			subject
		)}`;
		window.open(mailtoUrl, '_blank');
	};

	const calculateSubscriptionDuration = () => {
		const start = new Date(subscription.start_date);
		const end = subscription.end_date
			? new Date(subscription.end_date)
			: new Date();
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (subscription.end_date === null) {
			return 'Illimitée';
		}

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

	const clientName =
		subscription.utilisateur.firstName && subscription.utilisateur.lastName
			? `${subscription.utilisateur.firstName} ${subscription.utilisateur.lastName}`
			: subscription.utilisateur.email;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2 text-xl'>
						<Package className='h-6 w-6 text-blue-600' />
						Détails de l'Abonnement Client #{subscription.id}
					</DialogTitle>
				</DialogHeader>

				<div className='space-y-6'>
					{/* Statut et actions */}
					<div className='flex items-center justify-between bg-gray-50 p-4 rounded-lg'>
						<div className='flex items-center gap-3'>
							{getStatusBadge(
								subscription.status,
								subscription.is_active
							)}
							{subscription.is_expired && (
								<Badge className='bg-orange-100 text-orange-800 flex items-center gap-1'>
									<AlertCircle className='h-3 w-3' />
									Expiré
								</Badge>
							)}
							<div className='text-sm text-gray-600'>
								Créé le {formatDate(subscription.created_at)}
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
								onClick={handleContactClient}
								className='flex items-center gap-2'
							>
								<Mail className='h-4 w-4' />
								Contacter
							</Button>
						</div>
					</div>

					{/* Informations de l'abonnement */}
					<div className='bg-blue-50 p-4 rounded-lg'>
						<h3 className='text-lg font-semibold flex items-center gap-2 mb-3'>
							<Package className='h-5 w-5 text-blue-600' />
							Informations de l'Abonnement
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Info className='h-4 w-4 text-gray-500' />
									<span className='font-medium'>
										Type d'abonnement
									</span>
								</div>
								{getSubscriptionTypeBadge(
									subscription.subscription_type
								)}
							</div>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Euro className='h-4 w-4 text-gray-500' />
									<span className='font-medium'>
										Prix mensuel
									</span>
								</div>
								<p className='text-lg font-bold text-green-600'>
									{formatPrice(subscription.monthly_price)}
									/mois
								</p>
							</div>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Clock className='h-4 w-4 text-gray-500' />
									<span className='font-medium'>Durée</span>
								</div>
								<p className='text-lg font-bold text-blue-700'>
									{calculateSubscriptionDuration()}
								</p>
							</div>
						</div>
					</div>

					{/* Fonctionnalités incluses */}
					<div className='bg-green-50 p-4 rounded-lg'>
						<h3 className='text-lg font-semibold flex items-center gap-2 mb-4'>
							<CheckCircle className='h-5 w-5 text-green-600' />
							Fonctionnalités Incluses
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div className='bg-white p-4 rounded-lg border border-green-200'>
								<div className='flex items-center gap-2 mb-2'>
									<Package className='h-5 w-5 text-green-600' />
									<span className='font-medium'>
										Colis par mois
									</span>
								</div>
								<p className='text-2xl font-bold text-green-700'>
									{subscription.features
										.max_packages_per_month === -1
										? 'Illimité'
										: subscription.features
												.max_packages_per_month}
								</p>
								<p className='text-sm text-gray-600'>
									{subscription.features
										.max_packages_per_month === -1
										? 'Aucune limitation'
										: 'Limite mensuelle'}
								</p>
							</div>
							<div className='bg-white p-4 rounded-lg border border-green-200'>
								<div className='flex items-center gap-2 mb-2'>
									<Shield className='h-5 w-5 text-green-600' />
									<span className='font-medium'>
										Couverture assurance
									</span>
								</div>
								<p className='text-2xl font-bold text-green-700'>
									{subscription.features.insurance_coverage}€
								</p>
								<p className='text-sm text-gray-600'>
									Protection maximale
								</p>
							</div>
							<div className='bg-white p-4 rounded-lg border border-green-200'>
								<div className='flex items-center gap-2 mb-2'>
									<Headphones className='h-5 w-5 text-green-600' />
									<span className='font-medium'>Support</span>
								</div>
								<p className='text-lg font-bold text-green-700'>
									{subscription.features.priority_support
										? 'Prioritaire'
										: 'Standard'}
								</p>
								<p className='text-sm text-gray-600'>
									{subscription.features.priority_support
										? 'Réponse rapide garantie'
										: 'Support classique'}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Informations du client */}
					<div>
						<h3 className='text-lg font-semibold flex items-center gap-2 mb-4'>
							<User className='h-5 w-5 text-gray-600' />
							Informations du Client
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
												{clientName}
											</p>
											<p className='text-sm text-gray-600'>
												ID Utilisateur:{' '}
												{subscription.utilisateur.id}
											</p>
										</div>
									</div>
									<div className='flex items-center gap-3'>
										<Mail className='h-4 w-4 text-gray-500' />
										<div>
											<p className='font-medium'>
												{subscription.utilisateur.email}
											</p>
											<p className='text-sm text-gray-600'>
												Email principal
											</p>
										</div>
									</div>
									{subscription.utilisateur.phone_number && (
										<div className='flex items-center gap-3'>
											<Phone className='h-4 w-4 text-gray-500' />
											<div>
												<p className='font-medium'>
													{
														subscription.utilisateur
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

							{/* Informations client */}
							<div className='space-y-4'>
								<h4 className='font-medium text-gray-700 border-b pb-1'>
									Informations client
								</h4>
								<div className='space-y-3'>
									{subscription.utilisateur.client && (
										<div className='flex items-center gap-3'>
											<Info className='h-4 w-4 text-gray-500' />
											<div>
												<p className='font-medium'>
													ID Client:{' '}
													{
														subscription.utilisateur
															.client.id
													}
												</p>
												<p className='text-sm text-gray-600'>
													Identifiant unique client
												</p>
											</div>
										</div>
									)}
									<div className='flex items-center gap-3'>
										<Calendar className='h-4 w-4 text-gray-500' />
										<div>
											<p className='font-medium'>
												Client depuis le{' '}
												{formatDate(
													subscription.utilisateur
														.created_at
												)}
											</p>
											<p className='text-sm text-gray-600'>
												Date d'inscription
											</p>
										</div>
									</div>
									{subscription.utilisateur.client
										?.loyalty_points !== undefined && (
										<div className='flex items-center gap-3'>
											<CheckCircle className='h-4 w-4 text-gray-500' />
											<div>
												<p className='font-medium'>
													{
														subscription.utilisateur
															.client
															.loyalty_points
													}{' '}
													points fidélité
												</p>
												<p className='text-sm text-gray-600'>
													Points accumulés
												</p>
											</div>
										</div>
									)}
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
									{formatDate(subscription.start_date)}
								</p>
							</div>
							{subscription.end_date ? (
								<div className='bg-orange-50 p-4 rounded-lg'>
									<div className='flex items-center gap-2 mb-2'>
										<Calendar className='h-4 w-4 text-orange-600' />
										<span className='font-medium text-orange-800'>
											Date de fin
										</span>
									</div>
									<p className='text-lg font-bold text-orange-700'>
										{formatDate(subscription.end_date)}
									</p>
								</div>
							) : (
								<div className='bg-blue-50 p-4 rounded-lg'>
									<div className='flex items-center gap-2 mb-2'>
										<Info className='h-4 w-4 text-blue-600' />
										<span className='font-medium text-blue-800'>
											Durée
										</span>
									</div>
									<p className='text-lg font-bold text-blue-700'>
										Illimitée
									</p>
								</div>
							)}
							<div className='bg-gray-50 p-4 rounded-lg'>
								<div className='flex items-center gap-2 mb-2'>
									<Clock className='h-4 w-4 text-gray-600' />
									<span className='font-medium text-gray-800'>
										Mis à jour
									</span>
								</div>
								<p className='text-lg font-bold text-gray-700'>
									{formatDate(subscription.updated_at)}
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
									Statut actuel:
								</span>
								<br />
								{subscription.is_active ? (
									<span className='text-green-600 font-medium'>
										✓ Abonnement actif
									</span>
								) : (
									<span className='text-red-600 font-medium'>
										✗ Abonnement inactif
									</span>
								)}
							</div>
							<div>
								<span className='font-medium'>
									Renouvellement:
								</span>
								<br />
								{subscription.end_date ? (
									subscription.is_expired ? (
										<span className='text-orange-600 font-medium'>
											Expiré
										</span>
									) : (
										<span className='text-blue-600 font-medium'>
											Automatique
										</span>
									)
								) : (
									<span className='text-green-600 font-medium'>
										Permanent
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
