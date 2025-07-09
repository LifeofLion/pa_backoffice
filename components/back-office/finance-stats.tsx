'use client';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ContractsStats } from '@/hooks/use-contracts';
import { SubscriptionsStats } from '@/hooks/use-subscriptions';
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	ShoppingBag,
	CreditCard,
	Package,
	Calendar,
	Percent,
} from 'lucide-react';

interface FinanceStatsProps {
	contractsStats: ContractsStats | null;
	subscriptionsStats: SubscriptionsStats | null;
}

export function FinanceStats({
	contractsStats,
	subscriptionsStats,
}: FinanceStatsProps) {
	// Calculs des totaux
	const totalRevenue =
		(contractsStats?.totalRevenue || 0) +
		(subscriptionsStats?.totalRevenue || 0);
	const monthlyRevenue =
		(contractsStats?.monthlyRevenue || 0) +
		(subscriptionsStats?.monthlyRevenue || 0);
	const totalContracts =
		(contractsStats?.total || 0) + (subscriptionsStats?.total || 0);
	const activeContracts =
		(contractsStats?.active || 0) + (subscriptionsStats?.active || 0);

	// Taux de conversion et métriques
	const activeRate =
		totalContracts > 0 ? (activeContracts / totalContracts) * 100 : 0;
	const contractsRevenue = contractsStats?.monthlyRevenue || 0;
	const subscriptionsRevenue = subscriptionsStats?.monthlyRevenue || 0;

	// Répartition des revenus
	const contractsPercentage =
		totalRevenue > 0 ? (contractsRevenue / monthlyRevenue) * 100 : 0;
	const subscriptionsPercentage =
		totalRevenue > 0 ? (subscriptionsRevenue / monthlyRevenue) * 100 : 0;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR',
		}).format(amount);
	};

	const formatPercentage = (value: number) => {
		return `${value.toFixed(1)}%`;
	};

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
			{/* Revenus mensuels totaux */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>
						Revenus Mensuels
					</CardTitle>
					<DollarSign className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>
						{formatCurrency(monthlyRevenue)}
					</div>
					<div className='flex items-center text-xs text-muted-foreground mt-2'>
						<TrendingUp className='h-3 w-3 mr-1 text-green-500' />
						<span>Total des revenus actifs</span>
					</div>
				</CardContent>
			</Card>

			{/* Total des contrats/abonnements */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>
						Total Contrats
					</CardTitle>
					<CreditCard className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{totalContracts}</div>
					<div className='flex items-center justify-between text-xs text-muted-foreground mt-2'>
						<span>{activeContracts} actifs</span>
						<span className='text-green-600'>
							{formatPercentage(activeRate)}
						</span>
					</div>
					<Progress value={activeRate} className='mt-2' />
				</CardContent>
			</Card>

			{/* Contrats commerçants */}
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
					<div className='text-xs text-muted-foreground mt-1'>
						{contractsStats?.active || 0} actifs
					</div>
					<div className='text-sm font-medium text-green-600 mt-1'>
						{formatCurrency(contractsStats?.monthlyRevenue || 0)}
					</div>
					<div className='text-xs text-muted-foreground'>
						{formatPercentage(contractsPercentage)} du total
					</div>
				</CardContent>
			</Card>

			{/* Abonnements clients */}
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
					<div className='text-xs text-muted-foreground mt-1'>
						{subscriptionsStats?.active || 0} actifs
					</div>
					<div className='text-sm font-medium text-blue-600 mt-1'>
						{formatCurrency(
							subscriptionsStats?.monthlyRevenue || 0
						)}
					</div>
					<div className='text-xs text-muted-foreground'>
						{formatPercentage(subscriptionsPercentage)} du total
					</div>
				</CardContent>
			</Card>

			{/* Répartition par type d'abonnement */}
			{subscriptionsStats && (
				<Card className='col-span-full lg:col-span-2'>
					<CardHeader>
						<CardTitle className='text-lg'>
							Répartition des Abonnements
						</CardTitle>
						<CardDescription>Par type d'abonnement</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<div className='flex items-center justify-between mb-2'>
									<span className='text-sm font-medium'>
										Gratuit
									</span>
									<span className='text-sm text-muted-foreground'>
										{subscriptionsStats.byType.free}
									</span>
								</div>
								<Progress
									value={
										subscriptionsStats.total > 0
											? (subscriptionsStats.byType.free /
													subscriptionsStats.total) *
											  100
											: 0
									}
									className='h-2'
								/>
							</div>

							<div>
								<div className='flex items-center justify-between mb-2'>
									<span className='text-sm font-medium'>
										Starter
									</span>
									<span className='text-sm text-muted-foreground'>
										{subscriptionsStats.byType.starter}
									</span>
								</div>
								<Progress
									value={
										subscriptionsStats.total > 0
											? (subscriptionsStats.byType
													.starter /
													subscriptionsStats.total) *
											  100
											: 0
									}
									className='h-2'
								/>
							</div>

							<div>
								<div className='flex items-center justify-between mb-2'>
									<span className='text-sm font-medium'>
										Premium
									</span>
									<span className='text-sm text-muted-foreground'>
										{subscriptionsStats.byType.premium}
									</span>
								</div>
								<Progress
									value={
										subscriptionsStats.total > 0
											? (subscriptionsStats.byType
													.premium /
													subscriptionsStats.total) *
											  100
											: 0
									}
									className='h-2'
								/>
							</div>

							<div>
								<div className='flex items-center justify-between mb-2'>
									<span className='text-sm font-medium'>
										Enterprise
									</span>
									<span className='text-sm text-muted-foreground'>
										{subscriptionsStats.byType.enterprise}
									</span>
								</div>
								<Progress
									value={
										subscriptionsStats.total > 0
											? (subscriptionsStats.byType
													.enterprise /
													subscriptionsStats.total) *
											  100
											: 0
									}
									className='h-2'
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Métriques financières détaillées */}
			<Card className='col-span-full lg:col-span-2'>
				<CardHeader>
					<CardTitle className='text-lg'>
						Métriques Financières
					</CardTitle>
					<CardDescription>Détails des revenus</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<ShoppingBag className='h-4 w-4 text-orange-500' />
									<span className='font-medium'>
										Contrats Commerçants
									</span>
								</div>
								<div className='text-2xl font-bold text-orange-600'>
									{formatCurrency(
										contractsStats?.monthlyRevenue || 0
									)}
								</div>
								<div className='text-xs text-muted-foreground'>
									Prix moyen:{' '}
									{contractsStats?.total
										? formatCurrency(
												(contractsStats.monthlyRevenue ||
													0) / contractsStats.total
										  )
										: '0€'}
								</div>
							</div>

							<div>
								<div className='text-sm text-muted-foreground'>
									Statuts des contrats:
								</div>
								<div className='text-xs space-y-1 mt-1'>
									<div>
										• Actifs: {contractsStats?.active || 0}
									</div>
									<div>
										• Inactifs:{' '}
										{contractsStats?.inactive || 0}
									</div>
									<div>
										• Annulés:{' '}
										{contractsStats?.cancelled || 0}
									</div>
									<div>
										• Expirés:{' '}
										{contractsStats?.expired || 0}
									</div>
								</div>
							</div>
						</div>

						<div className='space-y-4'>
							<div>
								<div className='flex items-center gap-2 mb-2'>
									<Users className='h-4 w-4 text-blue-500' />
									<span className='font-medium'>
										Abonnements Clients
									</span>
								</div>
								<div className='text-2xl font-bold text-blue-600'>
									{formatCurrency(
										subscriptionsStats?.monthlyRevenue || 0
									)}
								</div>
								<div className='text-xs text-muted-foreground'>
									Prix moyen:{' '}
									{formatCurrency(
										subscriptionsStats?.averagePrice || 0
									)}
								</div>
							</div>

							<div>
								<div className='text-sm text-muted-foreground'>
									Statuts des abonnements:
								</div>
								<div className='text-xs space-y-1 mt-1'>
									<div>
										• Actifs:{' '}
										{subscriptionsStats?.active || 0}
									</div>
									<div>
										• Inactifs:{' '}
										{subscriptionsStats?.inactive || 0}
									</div>
									<div>
										• Annulés:{' '}
										{subscriptionsStats?.cancelled || 0}
									</div>
									<div>
										• Expirés:{' '}
										{subscriptionsStats?.expired || 0}
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
