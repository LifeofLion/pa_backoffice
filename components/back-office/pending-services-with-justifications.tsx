'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	CheckCircle,
	XCircle,
	Clock,
	FileText,
	Eye,
	Download,
	AlertTriangle,
	User,
	Mail,
	Calendar,
	Euro,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/src/lib/api';

interface Justification {
	id: number;
	document_type: string;
	file_path: string;
	verification_status: 'pending' | 'verified' | 'rejected';
	uploaded_at: string;
	verified_at?: string;
}

interface PendingService {
	id: number;
	name: string;
	description: string;
	price: number;
	location: string;
	status: string;
	created_at: string;
	prestataire_name: string;
	prestataire_email: string;
	service_type_name: string;
	justifications: Justification[];
	has_verified_justifications: boolean;
	total_justifications: number;
	pending_justifications: number;
}

interface PendingServicesResponse {
	pending_services: PendingService[];
	total_pending: number;
}

export default function PendingServicesWithJustifications() {
	const [services, setServices] = useState<PendingService[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [selectedService, setSelectedService] =
		useState<PendingService | null>(null);
	const [validationDialog, setValidationDialog] = useState(false);
	const [validationStatus, setValidationStatus] = useState<
		'approved' | 'rejected' | 'pending'
	>('pending');
	const [adminComments, setAdminComments] = useState('');
	const [validating, setValidating] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		loadPendingServices();
	}, []);

	const loadPendingServices = async () => {
		try {
			setLoading(true);
			setError('');

			const response = await apiClient.get('/services/pending');
			const data: PendingServicesResponse = response.data;
			setServices(data.pending_services);
		} catch (err: any) {
			console.error('Erreur chargement services:', err);
			console.error('Détails erreur:', {
				message: err.message,
				response: err.response?.data,
				status: err.response?.status,
				statusText: err.response?.statusText,
			});
			setError(
				err.response?.data?.message ||
					err.message ||
					'Erreur lors du chargement des services'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleValidateService = async () => {
		if (!selectedService) return;

		try {
			setValidating(true);

			const response = await apiClient.post(
				`/services/${selectedService.id}/validate`,
				{
					validation_status: validationStatus,
					admin_comments: adminComments,
					require_justifications: true,
				}
			);

			toast({
				title: 'Service validé',
				description: `Le service "${selectedService.name}" a été ${
					validationStatus === 'approved'
						? 'approuvé'
						: validationStatus === 'rejected'
						? 'rejeté'
						: 'mis en attente'
				}`,
			});

			setValidationDialog(false);
			setSelectedService(null);
			setValidationStatus('pending');
			setAdminComments('');

			// Recharger la liste
			await loadPendingServices();
		} catch (err: any) {
			console.error('Erreur validation:', err);

			// Gérer le cas des justificatifs requis
			if (err.response?.data?.requires_justifications) {
				toast({
					title: 'Justificatifs requis',
					description:
						'Ce prestataire doit avoir des justificatifs vérifiés avant validation du service.',
					variant: 'destructive',
				});
				return;
			}

			toast({
				title: 'Erreur',
				description:
					err.response?.data?.error_message ||
					err.message ||
					'Erreur lors de la validation du service',
				variant: 'destructive',
			});
		} finally {
			setValidating(false);
		}
	};

	const getStatusBadge = (service: PendingService) => {
		if (!service.has_verified_justifications) {
			return (
				<Badge
					variant='destructive'
					className='flex items-center gap-1'
				>
					<AlertTriangle className='w-3 h-3' />
					Justificatifs requis
				</Badge>
			);
		}

		return (
			<Badge variant='secondary' className='flex items-center gap-1'>
				<Clock className='w-3 h-3' />
				En attente
			</Badge>
		);
	};

	const getJustificationStatusBadge = (status: string) => {
		switch (status) {
			case 'verified':
				return (
					<Badge
						variant='default'
						className='bg-green-100 text-green-800'
					>
						<CheckCircle className='w-3 h-3 mr-1' />
						Vérifié
					</Badge>
				);
			case 'rejected':
				return (
					<Badge variant='destructive'>
						<XCircle className='w-3 h-3 mr-1' />
						Rejeté
					</Badge>
				);
			default:
				return (
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						En attente
					</Badge>
				);
		}
	};

	const openValidationDialog = (
		service: PendingService,
		status: 'approved' | 'rejected' | 'pending'
	) => {
		setSelectedService(service);
		setValidationStatus(status);
		setValidationDialog(true);
	};

	if (loading) {
		return (
			<div className='flex justify-center items-center py-12'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
				<span className='ml-2'>
					Chargement des services en attente...
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant='destructive'>
				<AlertTriangle className='h-4 w-4' />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<h2 className='text-2xl font-bold'>
					Services en attente de validation
				</h2>
				<Badge variant='outline'>
					{services.length} service(s) en attente
				</Badge>
			</div>

			{services.length === 0 ? (
				<Card>
					<CardContent className='text-center py-12'>
						<CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
						<h3 className='text-lg font-semibold mb-2'>
							Aucun service en attente
						</h3>
						<p className='text-gray-600'>
							Tous les services ont été traités.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-6'>
					{services.map((service) => (
						<Card key={service.id} className='overflow-hidden'>
							<CardHeader className='pb-4'>
								<div className='flex justify-between items-start'>
									<div className='flex-1'>
										<CardTitle className='flex items-center gap-2'>
											{service.name}
											{getStatusBadge(service)}
										</CardTitle>
										<div className='flex items-center gap-4 mt-2 text-sm text-gray-600'>
											<div className='flex items-center gap-1'>
												<User className='w-4 h-4' />
												{service.prestataire_name}
											</div>
											<div className='flex items-center gap-1'>
												<Mail className='w-4 h-4' />
												{service.prestataire_email}
											</div>
											<div className='flex items-center gap-1'>
												<Calendar className='w-4 h-4' />
												{new Date(
													service.created_at
												).toLocaleDateString('fr-FR')}
											</div>
											<div className='flex items-center gap-1'>
												<Euro className='w-4 h-4' />
												{service.price}€
											</div>
										</div>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												openValidationDialog(
													service,
													'approved'
												)
											}
											disabled={
												!service.has_verified_justifications
											}
										>
											<CheckCircle className='w-4 h-4 mr-1' />
											Approuver
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												openValidationDialog(
													service,
													'rejected'
												)
											}
										>
											<XCircle className='w-4 h-4 mr-1' />
											Rejeter
										</Button>
									</div>
								</div>
							</CardHeader>

							<CardContent className='space-y-4'>
								<div>
									<h4 className='font-semibold mb-2'>
										Description
									</h4>
									<p className='text-gray-600'>
										{service.description}
									</p>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<h4 className='font-semibold mb-2'>
											Informations du service
										</h4>
										<div className='space-y-1 text-sm'>
											<p>
												<strong>Type:</strong>{' '}
												{service.service_type_name}
											</p>
											<p>
												<strong>Localisation:</strong>{' '}
												{service.location}
											</p>
											<p>
												<strong>Prix:</strong>{' '}
												{service.price}€
											</p>
										</div>
									</div>

									<div>
										<h4 className='font-semibold mb-2'>
											Pièces justificatives
										</h4>
										<div className='space-y-2'>
											<div className='flex items-center justify-between'>
												<span className='text-sm'>
													Total:
												</span>
												<Badge variant='outline'>
													{
														service.total_justifications
													}
												</Badge>
											</div>
											<div className='flex items-center justify-between'>
												<span className='text-sm'>
													Vérifiées:
												</span>
												<Badge
													variant={
														service.has_verified_justifications
															? 'default'
															: 'destructive'
													}
												>
													{
														service.justifications.filter(
															(j) =>
																j.verification_status ===
																'verified'
														).length
													}
												</Badge>
											</div>
											<div className='flex items-center justify-between'>
												<span className='text-sm'>
													En attente:
												</span>
												<Badge variant='secondary'>
													{
														service.pending_justifications
													}
												</Badge>
											</div>
										</div>
									</div>
								</div>

								{service.justifications.length > 0 && (
									<div>
										<h4 className='font-semibold mb-2'>
											Détail des justificatifs
										</h4>
										<div className='grid gap-2'>
											{service.justifications.map(
												(justification) => (
													<div
														key={justification.id}
														className='flex items-center justify-between p-2 border rounded'
													>
														<div className='flex items-center gap-2'>
															<FileText className='w-4 h-4 text-gray-500' />
															<span className='text-sm font-medium'>
																{
																	justification.document_type
																}
															</span>
															{getJustificationStatusBadge(
																justification.verification_status
															)}
														</div>
														<div className='flex items-center gap-1'>
															<Button
																variant='ghost'
																size='sm'
															>
																<Eye className='w-4 h-4' />
															</Button>
															<Button
																variant='ghost'
																size='sm'
															>
																<Download className='w-4 h-4' />
															</Button>
														</div>
													</div>
												)
											)}
										</div>
									</div>
								)}

								{!service.has_verified_justifications && (
									<Alert>
										<AlertTriangle className='h-4 w-4' />
										<AlertDescription>
											Ce prestataire n'a pas de
											justificatifs vérifiés. Le service
											ne peut pas être approuvé.
										</AlertDescription>
									</Alert>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Dialog de validation */}
			<Dialog open={validationDialog} onOpenChange={setValidationDialog}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>
							{validationStatus === 'approved'
								? 'Approuver'
								: validationStatus === 'rejected'
								? 'Rejeter'
								: 'Mettre en attente'}{' '}
							le service
						</DialogTitle>
					</DialogHeader>

					{selectedService && (
						<div className='space-y-4'>
							<div>
								<h4 className='font-semibold mb-2'>
									Service: {selectedService.name}
								</h4>
								<p className='text-sm text-gray-600'>
									Prestataire:{' '}
									{selectedService.prestataire_name}
								</p>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2'>
									Commentaires admin (optionnel)
								</label>
								<Textarea
									value={adminComments}
									onChange={(e) =>
										setAdminComments(e.target.value)
									}
									placeholder='Ajoutez des commentaires sur votre décision...'
									rows={3}
								/>
							</div>

							{validationStatus === 'approved' &&
								!selectedService.has_verified_justifications && (
									<Alert variant='destructive'>
										<AlertTriangle className='h-4 w-4' />
										<AlertDescription>
											Attention: Ce prestataire n'a pas de
											justificatifs vérifiés. Le service
											ne peut pas être approuvé.
										</AlertDescription>
									</Alert>
								)}

							<div className='flex justify-end gap-2'>
								<Button
									variant='outline'
									onClick={() => setValidationDialog(false)}
									disabled={validating}
								>
									Annuler
								</Button>
								<Button
									onClick={handleValidateService}
									disabled={
										validating ||
										(validationStatus === 'approved' &&
											!selectedService.has_verified_justifications)
									}
								>
									{validating ? 'Validation...' : 'Confirmer'}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
