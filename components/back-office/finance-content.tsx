'use client';

import { useState, useEffect } from 'react';
import { ContractsTable } from '@/components/back-office/contracts-table';
import { SubscriptionsTable } from '@/components/back-office/subscriptions-table';
import { FinanceStats } from '@/components/back-office/finance-stats';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
	RefreshCw,
	TrendingUp,
	Users,
	ShoppingBag,
	CreditCard,
} from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useContracts } from '@/hooks/use-contracts';
import { useSubscriptions } from '@/hooks/use-subscriptions';

export function FinanceContent() {
	const { t } = useLanguage();
	const { toast } = useToast();
	const [selectedMonth, setSelectedMonth] = useState('March');

	// Utilisation des nouveaux hooks
	const {
		contracts,
		stats: contractsStats,
		loading: contractsLoading,
		error: contractsError,
		loadContractsWithStats,
		refreshContracts,
	} = useContracts();

	const {
		subscriptions,
		stats: subscriptionsStats,
		loading: subscriptionsLoading,
		error: subscriptionsError,
		loadSubscriptionsWithStats,
		refreshSubscriptions,
	} = useSubscriptions();

	const isLoading = contractsLoading || subscriptionsLoading;
	const hasError = contractsError || subscriptionsError;

	// Charger les données de financement
	const loadFinanceData = async () => {
		try {
			console.log('🔍 Chargement des données financières...');

			// Charger les contrats et abonnements en parallèle
			await Promise.all([
				loadContractsWithStats(),
				loadSubscriptionsWithStats(),
			]);

			console.log('✅ Données financières chargées');
		} catch (error) {
			console.error(
				'❌ Erreur lors du chargement des données financières:',
				error
			);
			toast({
				variant: 'destructive',
				title: 'Erreur',
				description: 'Impossible de charger les données financières',
			});
		}
	};

	const handleRefresh = async () => {
		await Promise.all([refreshContracts(), refreshSubscriptions()]);

		toast({
			title: 'Données actualisées',
			description: 'Les données financières ont été mises à jour',
		});
	};

	useEffect(() => {
		loadFinanceData();
	}, []);

	// Affichage des erreurs
	useEffect(() => {
		if (contractsError) {
			toast({
				variant: 'destructive',
				title: 'Erreur contrats',
				description: contractsError,
			});
		}
		if (subscriptionsError) {
			toast({
				variant: 'destructive',
				title: 'Erreur abonnements',
				description: subscriptionsError,
			});
		}
	}, [contractsError, subscriptionsError, toast]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<RefreshCw className='h-8 w-8 animate-spin' />
				<span className='ml-2'>
					Chargement des données financières...
				</span>
			</div>
		);
	}

	// Calcul des statistiques globales
	const totalRevenue =
		(contractsStats?.monthlyRevenue || 0) +
		(subscriptionsStats?.monthlyRevenue || 0);
	const totalContracts =
		(contractsStats?.total || 0) + (subscriptionsStats?.total || 0);
	const activeContracts =
		(contractsStats?.active || 0) + (subscriptionsStats?.active || 0);

	return (
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
				<div>
					<h1 className='text-2xl font-bold'>{t('admin.finance')}</h1>
					<p className='text-gray-600'>
						Gestion financière et contrats
					</p>
				</div>
				<div className='flex gap-2 items-center'>
					<Button
						onClick={handleRefresh}
						variant='outline'
						disabled={isLoading}
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${
								isLoading ? 'animate-spin' : ''
							}`}
						/>
						Actualiser
					</Button>
				</div>
			</div>

			{/* Statistiques globales */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Revenus Mensuels
						</CardTitle>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{totalRevenue.toFixed(2)}€
						</div>
						<p className='text-xs text-muted-foreground'>
							Contrats:{' '}
							{(contractsStats?.monthlyRevenue || 0).toFixed(2)}€
							| Abonnements:{' '}
							{(subscriptionsStats?.monthlyRevenue || 0).toFixed(
								2
							)}
							€
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Contrats
						</CardTitle>
						<CreditCard className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{totalContracts}
						</div>
						<p className='text-xs text-muted-foreground'>
							{activeContracts} actifs
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Contrats Commerçants
						</CardTitle>
						<ShoppingBag className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{contractsStats?.total || 0}
						</div>
						<p className='text-xs text-muted-foreground'>
							{contractsStats?.active || 0} actifs
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Abonnements Clients
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{subscriptionsStats?.total || 0}
						</div>
						<p className='text-xs text-muted-foreground'>
							{subscriptionsStats?.active || 0} actifs
						</p>
					</CardContent>
				</Card>
			</div>

			<div className='space-y-8'>
				{/* Section Abonnements Clients */}
				<div>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-xl font-semibold'>
							{t('admin.usersContracts')}
						</h2>
						<div className='text-sm text-gray-600'>
							{subscriptionsStats?.active || 0} actifs sur{' '}
							{subscriptionsStats?.total || 0}
						</div>
					</div>

					{subscriptionsLoading ? (
						<div className='flex items-center justify-center py-8'>
							<RefreshCw className='h-6 w-6 animate-spin mr-2' />
							Chargement des abonnements...
						</div>
					) : subscriptions.length > 0 ? (
						<SubscriptionsTable data={subscriptions} />
					) : (
						<Card>
							<CardContent className='text-center py-8'>
								<Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
								<p className='text-gray-600'>
									Aucun abonnement client trouvé
								</p>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Section Contrats Commerçants */}
				<div>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-xl font-semibold'>
							{t('admin.shopkeepersContracts')}
						</h2>
						<div className='text-sm text-gray-600'>
							{contractsStats?.active || 0} actifs sur{' '}
							{contractsStats?.total || 0}
						</div>
					</div>

					{contractsLoading ? (
						<div className='flex items-center justify-center py-8'>
							<RefreshCw className='h-6 w-6 animate-spin mr-2' />
							Chargement des contrats...
						</div>
					) : contracts.length > 0 ? (
						<ContractsTable data={contracts} />
					) : (
						<Card>
							<CardContent className='text-center py-8'>
								<ShoppingBag className='h-12 w-12 text-gray-400 mx-auto mb-4' />
								<p className='text-gray-600'>
									Aucun contrat commerçant trouvé
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
