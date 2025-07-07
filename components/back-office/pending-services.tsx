'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	AlertCircle,
	CheckCircle,
	XCircle,
	Clock,
	Loader2,
} from 'lucide-react';
import { AdminService, PendingService } from '@/services/adminService';
import { useLanguage } from '@/components/language-context';

export default function PendingServices() {
	const { t } = useLanguage();
	const [pendingServices, setPendingServices] = useState<PendingService[]>(
		[]
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [validatingService, setValidatingService] = useState<number | null>(
		null
	);
	const [adminComments, setAdminComments] = useState('');
	const [selectedService, setSelectedService] =
		useState<PendingService | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	useEffect(() => {
		loadPendingServices();
	}, []);

	const loadPendingServices = async () => {
		try {
			setLoading(true);
			setError('');
			const response = await AdminService.getPendingServices();
			setPendingServices(response.pending_services);
		} catch (err: any) {
			console.error(
				'Erreur lors du chargement des services en attente:',
				err
			);
			setError('Erreur lors du chargement des services en attente');
		} finally {
			setLoading(false);
		}
	};

	const handleValidation = async (
		serviceId: number,
		status: 'approved' | 'rejected'
	) => {
		try {
			setValidatingService(serviceId);
			await AdminService.validateService(serviceId, {
				validation_status: status,
				admin_comments: adminComments,
			});

			// Recharger la liste
			await loadPendingServices();

			// Fermer le dialog et réinitialiser
			setIsDialogOpen(false);
			setAdminComments('');
			setSelectedService(null);
		} catch (err: any) {
			console.error('Erreur lors de la validation:', err);
			setError('Erreur lors de la validation du service');
		} finally {
			setValidatingService(null);
		}
	};

	const openValidationDialog = (service: PendingService) => {
		setSelectedService(service);
		setAdminComments('');
		setIsDialogOpen(true);
	};

	const getPricingDisplay = (service: PendingService) => {
		if (service.pricing_type === 'hourly') {
			return `${service.hourly_rate}€/h`;
		}
		return `${service.price}€`;
	};

	if (loading) {
		return (
			<div className='flex justify-center items-center py-12'>
				<Loader2 className='h-8 w-8 animate-spin text-blue-500' />
				<span className='ml-2 text-gray-600'>
					Chargement des services en attente...
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3'>
				<AlertCircle className='h-5 w-5 text-red-500 flex-shrink-0' />
				<p className='text-red-700'>{error}</p>
				<Button
					variant='outline'
					size='sm'
					onClick={loadPendingServices}
					className='ml-auto'
				>
					Réessayer
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h2 className='text-2xl font-bold'>
					Services en attente de validation
				</h2>
				<Badge variant='secondary' className='text-sm'>
					{pendingServices.length} service
					{pendingServices.length > 1 ? 's' : ''} en attente
				</Badge>
			</div>

			{pendingServices.length === 0 ? (
				<Card>
					<CardContent className='text-center py-12'>
						<CheckCircle className='h-16 w-16 text-green-300 mx-auto mb-4' />
						<h3 className='text-xl font-semibold text-gray-900 mb-2'>
							Aucun service en attente
						</h3>
						<p className='text-gray-600'>
							Tous les services ont été validés ou rejetés.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-6'>
					{pendingServices.map((service) => (
						<Card key={service.id} className='overflow-hidden'>
							<CardHeader className='pb-4'>
								<div className='flex justify-between items-start'>
									<div className='flex-1'>
										<CardTitle className='text-lg'>
											{service.name}
										</CardTitle>
										<div className='flex items-center gap-2 mt-2'>
											<Badge
												variant='outline'
												className='text-yellow-600 border-yellow-500'
											>
												<Clock className='w-3 h-3 mr-1' />
												En attente
											</Badge>
											<Badge variant='secondary'>
												{service.service_type_name}
											</Badge>
										</div>
									</div>
									<div className='text-right'>
										<div className='text-lg font-semibold text-green-600'>
											{getPricingDisplay(service)}
										</div>
										<div className='text-sm text-gray-500'>
											{service.pricing_type === 'hourly'
												? 'Tarif horaire'
												: 'Prix fixe'}
										</div>
									</div>
								</div>
							</CardHeader>

							<CardContent>
								<div className='space-y-4'>
									<div>
										<h4 className='font-medium text-gray-900 mb-1'>
											Description
										</h4>
										<p className='text-gray-600 text-sm'>
											{service.description}
										</p>
									</div>

									<div className='grid grid-cols-2 gap-4 text-sm'>
										<div>
											<span className='font-medium text-gray-900'>
												Prestataire:
											</span>
											<p className='text-gray-600'>
												{service.prestataire_name}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-900'>
												Localisation:
											</span>
											<p className='text-gray-600'>
												{service.location}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-900'>
												Service à domicile:
											</span>
											<p className='text-gray-600'>
												{service.home_service
													? 'Oui'
													: 'Non'}
											</p>
										</div>
										<div>
											<span className='font-medium text-gray-900'>
												Matériel requis:
											</span>
											<p className='text-gray-600'>
												{service.requires_materials
													? 'Oui'
													: 'Non'}
											</p>
										</div>
									</div>

									{service.availability_description && (
										<div>
											<h4 className='font-medium text-gray-900 mb-1'>
												Disponibilités
											</h4>
											<p className='text-gray-600 text-sm'>
												{
													service.availability_description
												}
											</p>
										</div>
									)}

									<div className='flex justify-end space-x-2 pt-4 border-t'>
										<Dialog
											open={
												isDialogOpen &&
												selectedService?.id ===
													service.id
											}
											onOpenChange={setIsDialogOpen}
										>
											<DialogTrigger asChild>
												<Button
													variant='outline'
													onClick={() =>
														openValidationDialog(
															service
														)
													}
													disabled={
														validatingService ===
														service.id
													}
												>
													<XCircle className='w-4 h-4 mr-2' />
													Rejeter
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>
														Rejeter le service "
														{service.name}"
													</DialogTitle>
												</DialogHeader>
												<div className='space-y-4'>
													<div>
														<label className='block text-sm font-medium text-gray-700 mb-2'>
															Commentaire
															(optionnel)
														</label>
														<Textarea
															value={
																adminComments
															}
															onChange={(e) =>
																setAdminComments(
																	e.target
																		.value
																)
															}
															placeholder='Expliquez pourquoi ce service est rejeté...'
															rows={3}
														/>
													</div>
													<div className='flex justify-end space-x-2'>
														<Button
															variant='outline'
															onClick={() =>
																setIsDialogOpen(
																	false
																)
															}
															disabled={
																validatingService ===
																service.id
															}
														>
															Annuler
														</Button>
														<Button
															variant='destructive'
															onClick={() =>
																handleValidation(
																	service.id,
																	'rejected'
																)
															}
															disabled={
																validatingService ===
																service.id
															}
														>
															{validatingService ===
															service.id ? (
																<Loader2 className='w-4 h-4 mr-2 animate-spin' />
															) : (
																<XCircle className='w-4 h-4 mr-2' />
															)}
															Rejeter
														</Button>
													</div>
												</div>
											</DialogContent>
										</Dialog>

										<Button
											onClick={() =>
												handleValidation(
													service.id,
													'approved'
												)
											}
											disabled={
												validatingService === service.id
											}
										>
											{validatingService ===
											service.id ? (
												<Loader2 className='w-4 h-4 mr-2 animate-spin' />
											) : (
												<CheckCircle className='w-4 h-4 mr-2' />
											)}
											Approuver
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
