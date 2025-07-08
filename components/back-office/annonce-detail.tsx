'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
	ArrowLeft,
	Package,
	User,
	MapPin,
	Calendar,
	Euro,
	Clock,
	FileText,
	AlertCircle,
	CheckCircle,
	XCircle,
	Truck,
	Download,
	Mail,
} from 'lucide-react';

import { useAnnouncements, type Annonce } from '@/hooks/use-announcements';
import { generateAnnoncePDF } from '@/lib/pdf-generator';
import { openMailTo } from '@/lib/email-utils';

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function getStatusBadgeColor(status: string) {
	switch (status) {
		case 'active':
			return 'bg-green-100 text-green-800';
		case 'pending':
			return 'bg-yellow-100 text-yellow-800';
		case 'completed':
			return 'bg-blue-100 text-blue-800';
		case 'cancelled':
			return 'bg-red-100 text-red-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

function getStatusLabel(status: string) {
	switch (status) {
		case 'active':
			return 'En cours';
		case 'pending':
			return 'En attente';
		case 'completed':
			return 'Terminé';
		case 'cancelled':
			return 'Annulé';
		default:
			return status;
	}
}

function getStatusIcon(status: string) {
	switch (status) {
		case 'active':
			return <CheckCircle className='h-5 w-5 text-green-600' />;
		case 'pending':
			return <Clock className='h-5 w-5 text-yellow-600' />;
		case 'completed':
			return <CheckCircle className='h-5 w-5 text-blue-600' />;
		case 'cancelled':
			return <XCircle className='h-5 w-5 text-red-600' />;
		default:
			return <AlertCircle className='h-5 w-5 text-gray-600' />;
	}
}

function getTypeBadgeColor(type: string) {
	switch (type) {
		case 'transport_colis':
			return 'bg-purple-100 text-purple-800';
		case 'course':
			return 'bg-orange-100 text-orange-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

function getUserTypeBadge(userType?: string) {
	switch (userType) {
		case 'commercant':
			return (
				<Badge className='bg-blue-100 text-blue-800'>Commerçant</Badge>
			);
		case 'client':
			return (
				<Badge className='bg-green-100 text-green-800'>Client</Badge>
			);
		default:
			return <Badge className='bg-gray-100 text-gray-800'>Inconnu</Badge>;
	}
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString('fr-FR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatPrice(price: number) {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
	}).format(price);
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export function AnnonceDetailContent() {
	const params = useParams();
	const router = useRouter();
	const annonceId = params?.id as string;

	const { 
		getAnnouncements, 
		deleteAnnounceSmart, 
		loading, 
		error 
	} = useAnnouncements();
	const [annonce, setAnnonce] = useState<Annonce | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Gestionnaires d'événements pour les actions
	const handleExportPDF = async () => {
		if (!annonce) return;

		setIsGeneratingPDF(true);
		try {
			generateAnnoncePDF(annonce);
		} catch (error) {
			console.error('Erreur lors de la génération du PDF:', error);
			alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
		} finally {
			setIsGeneratingPDF(false);
		}
	};

	const handleContactUser = () => {
		if (!annonce) return;

		if (!annonce.utilisateur?.email) {
			alert('Aucun email disponible pour cet utilisateur');
			return;
		}

		openMailTo(annonce);
	};

	const handleDeleteAnnonce = async () => {
		if (!annonce) return;

		// Confirmation de suppression
		const confirmMessage = `Êtes-vous sûr de vouloir supprimer cette ${
			annonce.source === 'shopkeeper' ? 'livraison de commerçant' : 'annonce'
		} ?\n\nTitre: ${annonce.title}\nUtilisateur: ${annonce.userName}\n\nCette action est irréversible.`;

		if (!confirm(confirmMessage)) {
			return;
		}

		setIsDeleting(true);
		
		try {
			console.log('🗑️ Suppression de l\'annonce:', annonce);
			
			const success = await deleteAnnounceSmart(annonce);
			
			if (success) {
				alert(`${annonce.source === 'shopkeeper' ? 'Livraison de commerçant' : 'Annonce'} supprimée avec succès !`);
				
				// Rediriger vers la liste des annonces
				router.push('/admin/annonces');
			} else {
				alert('Erreur lors de la suppression. Veuillez réessayer.');
			}
		} catch (error) {
			console.error('Erreur lors de la suppression:', error);
			alert('Erreur lors de la suppression. Veuillez réessayer.');
		} finally {
			setIsDeleting(false);
		}
	};

	useEffect(() => {
		const loadAnnonce = async () => {
			try {
				const allAnnonces = await getAnnouncements();
				const foundAnnonce = allAnnonces.find(
					(a) => a.id === annonceId
				);

				if (foundAnnonce) {
					setAnnonce(foundAnnonce);
				} else {
					setNotFound(true);
				}
			} catch (err) {
				console.error("Erreur lors du chargement de l'annonce:", err);
				setNotFound(true);
			}
		};

		if (annonceId) {
			loadAnnonce();
		}
	}, [annonceId, getAnnouncements]);

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Chargement de l'annonce...</p>
				</div>
			</div>
		);
	}

	if (error || notFound || !annonce) {
		return (
			<div className='space-y-6'>
				{/* Header avec bouton retour */}
				<div className='flex items-center space-x-4'>
					<Link href='/admin/annonces'>
						<Button variant='outline' size='sm'>
							<ArrowLeft className='w-4 h-4 mr-2' />
							Retour aux annonces
						</Button>
					</Link>
					<h1 className='text-3xl font-bold text-gray-900'>
						Annonce introuvable
					</h1>
				</div>

				<Card className='border-red-200'>
					<CardContent className='pt-6'>
						<div className='text-center text-red-600'>
							<AlertCircle className='h-12 w-12 mx-auto mb-4' />
							<p className='font-medium'>Annonce non trouvée</p>
							<p className='text-sm mt-1'>
								L'annonce avec l'ID "{annonceId}" n'existe pas
								ou a été supprimée.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header avec bouton retour */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-4'>
					<Link href='/admin/annonces'>
						<Button variant='outline' size='sm'>
							<ArrowLeft className='w-4 h-4 mr-2' />
							Retour aux annonces
						</Button>
					</Link>
					<div>
						<h1 className='text-3xl font-bold text-gray-900'>
							Détail de l'annonce
						</h1>
						<p className='text-gray-600 mt-1'>
							Informations complètes de l'annonce #{annonceId}
						</p>
					</div>
				</div>

				{/* Status badge en header */}
				<div className='flex items-center space-x-2'>
					{getStatusIcon(annonce.status)}
					<Badge className={getStatusBadgeColor(annonce.status)}>
						{getStatusLabel(annonce.status)}
					</Badge>
				</div>
			</div>

			{/* Informations principales */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Informations de l'annonce */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center'>
							<FileText className='w-5 h-5 mr-2' />
							Informations de l'annonce
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<label className='text-sm font-medium text-gray-600'>
								Titre
							</label>
							<p className='text-lg font-semibold'>
								{annonce.title}
							</p>
						</div>

						<div>
							<label className='text-sm font-medium text-gray-600'>
								Description
							</label>
							<p className='text-gray-800'>
								{annonce.description || 'Aucune description'}
							</p>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='text-sm font-medium text-gray-600'>
									Type
								</label>
								<div className='mt-1'>
									<Badge
										className={getTypeBadgeColor(
											annonce.type
										)}
									>
										{annonce.type === 'transport_colis' ? (
											<>
												<Truck className='w-3 h-3 mr-1' />
												Transport
											</>
										) : (
											<>
												<Package className='w-3 h-3 mr-1' />
												Course
											</>
										)}
									</Badge>
								</div>
							</div>

							<div>
								<label className='text-sm font-medium text-gray-600'>
									Source
								</label>
								<p className='text-gray-800 capitalize'>
									{annonce.source === 'shopkeeper'
										? 'Commerçant'
										: 'Traditionnel'}
								</p>
							</div>
						</div>

						<div>
							<label className='text-sm font-medium text-gray-600'>
								Prix
							</label>
							<div className='flex items-center mt-1'>
								<Euro className='w-4 h-4 mr-1 text-green-600' />
								<span className='text-lg font-semibold text-green-700'>
									{formatPrice(annonce.price)}
								</span>
							</div>
						</div>

						{annonce.priority && (
							<div>
								<Badge className='bg-red-100 text-red-800'>
									🔥 Priorité élevée
								</Badge>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Informations utilisateur */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center'>
							<User className='w-5 h-5 mr-2' />
							Informations utilisateur
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<label className='text-sm font-medium text-gray-600'>
								Nom
							</label>
							<p className='text-lg font-semibold'>
								{annonce.userName || 'Utilisateur inconnu'}
							</p>
						</div>

						<div>
							<label className='text-sm font-medium text-gray-600'>
								Type d'utilisateur
							</label>
							<div className='mt-1'>
								{getUserTypeBadge(annonce.userType)}
							</div>
						</div>

						{annonce.utilisateur && (
							<>
								<div>
									<label className='text-sm font-medium text-gray-600'>
										Email
									</label>
									<p className='text-gray-800'>
										{annonce.utilisateur.email ||
											'Non renseigné'}
									</p>
								</div>

								{annonce.utilisateur.phone_number && (
									<div>
										<label className='text-sm font-medium text-gray-600'>
											Téléphone
										</label>
										<p className='text-gray-800'>
											{annonce.utilisateur.phone_number}
										</p>
									</div>
								)}

								<div>
									<label className='text-sm font-medium text-gray-600'>
										ID Utilisateur
									</label>
									<p className='text-gray-800 font-mono'>
										#{annonce.utilisateur.id}
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Informations de livraison */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center'>
						<MapPin className='w-5 h-5 mr-2' />
						Informations de livraison
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-600 flex items-center'>
								<MapPin className='w-4 h-4 mr-1' />
								Point de départ
							</label>
							<p className='text-gray-800 p-3 bg-gray-50 rounded-md'>
								{annonce.start_location}
							</p>
						</div>

						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-600 flex items-center'>
								<MapPin className='w-4 h-4 mr-1' />
								Point d'arrivée
							</label>
							<p className='text-gray-800 p-3 bg-gray-50 rounded-md'>
								{annonce.end_location}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Informations temporelles */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center'>
						<Calendar className='w-5 h-5 mr-2' />
						Informations temporelles
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div>
							<label className='text-sm font-medium text-gray-600'>
								Date de création
							</label>
							<p className='text-gray-800'>
								{formatDate(annonce.created_at)}
							</p>
						</div>

						{annonce.desired_date && (
							<div>
								<label className='text-sm font-medium text-gray-600'>
									Date souhaitée
								</label>
								<p className='text-gray-800'>
									{formatDate(annonce.desired_date)}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Actions admin */}
			<Card>
				<CardHeader>
					<CardTitle>Actions administrateur</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex items-center space-x-4'>
						<Button
							variant='outline'
							onClick={handleExportPDF}
							disabled={isGeneratingPDF || isDeleting}
						>
							<Download className='w-4 h-4 mr-2' />
							{isGeneratingPDF ? 'Génération...' : 'Exporter PDF'}
						</Button>
						<Button 
							variant='outline' 
							onClick={handleContactUser}
							disabled={isDeleting}
						>
							<Mail className='w-4 h-4 mr-2' />
							Contacter l'utilisateur
						</Button>
						<Button
							variant='destructive'
							onClick={handleDeleteAnnonce}
							disabled={isDeleting}
						>
							<XCircle className='w-4 h-4 mr-2' />
							{isDeleting ? 'Suppression...' : 'Supprimer l\'annonce'}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
