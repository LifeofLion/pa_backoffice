import jsPDF from 'jspdf';
import type { Annonce } from '@/hooks/use-announcements';
import type { ContractData } from '@/hooks/use-contracts';
import type { SubscriptionData } from '@/hooks/use-subscriptions';

/**
 * Génère un PDF avec les informations complètes d'une annonce
 */
export function generateAnnoncePDF(annonce: Annonce): void {
	const doc = new jsPDF();

	// Configuration des couleurs et styles
	const primaryColor = [34, 197, 94]; // Green-500
	const secondaryColor = [107, 114, 128]; // Gray-500
	const textColor = [17, 24, 39]; // Gray-900

	let yPosition = 20;
	const leftMargin = 20;
	const pageWidth = doc.internal.pageSize.getWidth();

	// En-tête du document
	doc.setFontSize(20);
	doc.setTextColor(...primaryColor);
	doc.text("EcoDeli - Detail de l'annonce", leftMargin, yPosition);

	yPosition += 10;
	doc.setFontSize(12);
	doc.setTextColor(...secondaryColor);
	doc.text(
		`Genere le ${new Date().toLocaleDateString(
			'fr-FR'
		)} a ${new Date().toLocaleTimeString('fr-FR')}`,
		leftMargin,
		yPosition
	);

	// Ligne de séparation
	yPosition += 15;
	doc.setDrawColor(...primaryColor);
	doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);

	// Informations de l'annonce
	yPosition += 20;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text("INFORMATIONS DE L'ANNONCE", leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Titre
	doc.setFont('helvetica', 'bold');
	doc.text('Titre:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(annonce.title, leftMargin + 25, yPosition);

	yPosition += 10;

	// Description
	doc.setFont('helvetica', 'bold');
	doc.text('Description:', leftMargin, yPosition);
	yPosition += 7;
	doc.setFont('helvetica', 'normal');

	// Diviser la description en lignes pour éviter le débordement
	const descriptionLines = doc.splitTextToSize(
		annonce.description,
		pageWidth - 40
	);
	doc.text(descriptionLines, leftMargin, yPosition);
	yPosition += descriptionLines.length * 7;

	yPosition += 10;

	// Type et statut
	doc.setFont('helvetica', 'bold');
	doc.text('Type:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		annonce.type === 'transport_colis' ? 'Transport de colis' : 'Course',
		leftMargin + 25,
		yPosition
	);

	doc.setFont('helvetica', 'bold');
	doc.text('Statut:', leftMargin + 100, yPosition);
	doc.setFont('helvetica', 'normal');
	const statusLabels = {
		active: 'En cours',
		pending: 'En attente',
		completed: 'Termine',
		cancelled: 'Annule',
	};
	doc.text(
		statusLabels[annonce.status as keyof typeof statusLabels] ||
			annonce.status,
		leftMargin + 125,
		yPosition
	);

	yPosition += 10;

	// Prix
	doc.setFont('helvetica', 'bold');
	doc.text('Prix:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(`${annonce.price.toFixed(2)} €`, leftMargin + 25, yPosition);

	// Source
	doc.setFont('helvetica', 'bold');
	doc.text('Source:', leftMargin + 100, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		annonce.source === 'shopkeeper' ? 'Commercant' : 'Traditionnel',
		leftMargin + 125,
		yPosition
	);

	// Informations utilisateur
	yPosition += 25;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS UTILISATEUR', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Nom
	doc.setFont('helvetica', 'bold');
	doc.text('Nom:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(annonce.userName || 'Non renseigne', leftMargin + 25, yPosition);

	yPosition += 10;

	// Type d'utilisateur
	doc.setFont('helvetica', 'bold');
	doc.text("Type d'utilisateur:", leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		annonce.userType === 'commercant' ? 'Commercant' : 'Client',
		leftMargin + 50,
		yPosition
	);

	yPosition += 10;

	// Email si disponible
	if (annonce.utilisateur?.email) {
		doc.setFont('helvetica', 'bold');
		doc.text('Email:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text(annonce.utilisateur.email, leftMargin + 25, yPosition);
		yPosition += 10;
	}

	// ID utilisateur
	if (annonce.utilisateur?.id) {
		doc.setFont('helvetica', 'bold');
		doc.text('ID Utilisateur:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text(`#${annonce.utilisateur.id}`, leftMargin + 40, yPosition);
		yPosition += 10;
	}

	// Informations de livraison
	yPosition += 15;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS DE LIVRAISON', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Point de départ
	doc.setFont('helvetica', 'bold');
	doc.text('Point de depart:', leftMargin, yPosition);
	yPosition += 7;
	doc.setFont('helvetica', 'normal');
	const startLines = doc.splitTextToSize(
		annonce.start_location,
		pageWidth - 40
	);
	doc.text(startLines, leftMargin, yPosition);
	yPosition += startLines.length * 7;

	yPosition += 10;

	// Point d'arrivée
	doc.setFont('helvetica', 'bold');
	doc.text("Point d'arrivee:", leftMargin, yPosition);
	yPosition += 7;
	doc.setFont('helvetica', 'normal');
	const endLines = doc.splitTextToSize(annonce.end_location, pageWidth - 40);
	doc.text(endLines, leftMargin, yPosition);
	yPosition += endLines.length * 7;

	// Informations temporelles
	yPosition += 15;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS TEMPORELLES', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Date de création
	doc.setFont('helvetica', 'bold');
	doc.text('Date de creation:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const createdDate = new Date(annonce.created_at).toLocaleDateString(
		'fr-FR',
		{
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}
	);
	doc.text(createdDate, leftMargin + 50, yPosition);

	yPosition += 10;

	// Date souhaitée
	if (annonce.desired_date) {
		doc.setFont('helvetica', 'bold');
		doc.text('Date souhaitee:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		const desiredDate = new Date(annonce.desired_date).toLocaleDateString(
			'fr-FR',
			{
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			}
		);
		doc.text(desiredDate, leftMargin + 45, yPosition);
		yPosition += 10;
	}

	// Priorité
	if (annonce.priority) {
		yPosition += 10;
		doc.setTextColor(220, 38, 38); // Red-600
		doc.setFont('helvetica', 'bold');
		doc.text('*** PRIORITE ELEVEE ***', leftMargin, yPosition);
	}

	// Pied de page
	const pageHeight = doc.internal.pageSize.getHeight();
	doc.setFontSize(8);
	doc.setTextColor(...secondaryColor);
	doc.text(
		'Ce document a ete genere automatiquement par EcoDeli Admin Dashboard',
		leftMargin,
		pageHeight - 15
	);
	doc.text(`ID Annonce: ${annonce.id}`, leftMargin, pageHeight - 10);

	// Télécharger le PDF
	const fileName = `annonce_${annonce.id
		.replace('traditional_', '')
		.replace('shopkeeper_', '')}_${
		new Date().toISOString().split('T')[0]
	}.pdf`;
	doc.save(fileName);
}

/**
 * Génère un PDF avec les informations complètes d'un contrat commerçant
 */
export function generateContractPDF(contract: ContractData): void {
	const doc = new jsPDF();

	// Configuration des couleurs et styles
	const primaryColor = [34, 197, 94]; // Green-500
	const secondaryColor = [107, 114, 128]; // Gray-500
	const textColor = [17, 24, 39]; // Gray-900

	let yPosition = 20;
	const leftMargin = 20;
	const pageWidth = doc.internal.pageSize.getWidth();

	// En-tête du document
	doc.setFontSize(20);
	doc.setTextColor(...primaryColor);
	doc.text('EcoDeli - Contrat Commercial', leftMargin, yPosition);

	yPosition += 10;
	doc.setFontSize(12);
	doc.setTextColor(...secondaryColor);
	doc.text(
		`Genere le ${new Date().toLocaleDateString(
			'fr-FR'
		)} a ${new Date().toLocaleTimeString('fr-FR')}`,
		leftMargin,
		yPosition
	);

	// Ligne de séparation
	yPosition += 15;
	doc.setDrawColor(...primaryColor);
	doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);

	// Informations du contrat
	yPosition += 20;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS DU CONTRAT', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// ID du contrat
	doc.setFont('helvetica', 'bold');
	doc.text('ID Contrat:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(`#${contract.id}`, leftMargin + 35, yPosition);

	// Statut
	doc.setFont('helvetica', 'bold');
	doc.text('Statut:', leftMargin + 100, yPosition);
	doc.setFont('helvetica', 'normal');
	const statusLabels = {
		active: 'Actif',
		inactive: 'Inactif',
		cancelled: 'Annule',
		expired: 'Expire',
	};
	doc.text(
		statusLabels[contract.status as keyof typeof statusLabels] ||
			contract.status,
		leftMargin + 125,
		yPosition
	);

	yPosition += 15;

	// Informations du plan
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS DU PLAN', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Nom du plan
	doc.setFont('helvetica', 'bold');
	doc.text('Plan:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(contract.plan.name, leftMargin + 25, yPosition);

	yPosition += 10;

	// Prix
	doc.setFont('helvetica', 'bold');
	doc.text('Prix mensuel:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		`${contract.plan.price.toFixed(2)} €/mois`,
		leftMargin + 40,
		yPosition
	);

	yPosition += 10;

	// Description du plan
	if (contract.plan.description) {
		doc.setFont('helvetica', 'bold');
		doc.text('Description:', leftMargin, yPosition);
		yPosition += 7;
		doc.setFont('helvetica', 'normal');
		const descLines = doc.splitTextToSize(
			contract.plan.description,
			pageWidth - 40
		);
		doc.text(descLines, leftMargin, yPosition);
		yPosition += descLines.length * 7;
	}

	// Informations du commerçant
	yPosition += 15;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS DU COMMERCANT', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Nom du commerçant
	doc.setFont('helvetica', 'bold');
	doc.text('Nom:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		`${contract.commercant.user.firstName} ${contract.commercant.user.lastName}`,
		leftMargin + 25,
		yPosition
	);

	yPosition += 10;

	// Email
	doc.setFont('helvetica', 'bold');
	doc.text('Email:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(contract.commercant.user.email, leftMargin + 25, yPosition);

	yPosition += 10;

	// Téléphone
	if (contract.commercant.user.phone_number) {
		doc.setFont('helvetica', 'bold');
		doc.text('Telephone:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text(
			contract.commercant.user.phone_number,
			leftMargin + 35,
			yPosition
		);
		yPosition += 10;
	}

	// Nom du magasin
	doc.setFont('helvetica', 'bold');
	doc.text('Magasin:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(contract.commercant.storeName, leftMargin + 30, yPosition);

	yPosition += 10;

	// Adresse du magasin
	if (contract.commercant.businessAddress) {
		doc.setFont('helvetica', 'bold');
		doc.text('Adresse:', leftMargin, yPosition);
		yPosition += 7;
		doc.setFont('helvetica', 'normal');
		const addressLines = doc.splitTextToSize(
			contract.commercant.businessAddress,
			pageWidth - 40
		);
		doc.text(addressLines, leftMargin, yPosition);
		yPosition += addressLines.length * 7;
	}

	// Informations temporelles
	yPosition += 15;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS TEMPORELLES', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Date de début
	doc.setFont('helvetica', 'bold');
	doc.text('Date de debut:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const startDate = new Date(contract.startDate).toLocaleDateString('fr-FR');
	doc.text(startDate, leftMargin + 40, yPosition);

	yPosition += 10;

	// Date de fin
	if (contract.endDate) {
		doc.setFont('helvetica', 'bold');
		doc.text('Date de fin:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		const endDate = new Date(contract.endDate).toLocaleDateString('fr-FR');
		doc.text(endDate, leftMargin + 35, yPosition);
		yPosition += 10;
	}

	// Date de création
	doc.setFont('helvetica', 'bold');
	doc.text('Date de creation:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const createdDate = new Date(contract.createdAt).toLocaleDateString(
		'fr-FR'
	);
	doc.text(createdDate, leftMargin + 45, yPosition);

	// Pied de page
	const pageHeight = doc.internal.pageSize.getHeight();
	doc.setFontSize(8);
	doc.setTextColor(...secondaryColor);
	doc.text(
		'Ce document a ete genere automatiquement par EcoDeli Admin Dashboard',
		leftMargin,
		pageHeight - 15
	);
	doc.text(`ID Contrat: ${contract.id}`, leftMargin, pageHeight - 10);

	// Télécharger le PDF
	const fileName = `contrat_commercant_${contract.id}_${
		new Date().toISOString().split('T')[0]
	}.pdf`;
	doc.save(fileName);
}

/**
 * Génère un PDF avec les informations complètes d'un abonnement client
 */
export function generateSubscriptionPDF(subscription: SubscriptionData): void {
	const doc = new jsPDF();

	// Configuration des couleurs et styles
	const primaryColor = [59, 130, 246]; // Blue-500
	const secondaryColor = [107, 114, 128]; // Gray-500
	const textColor = [17, 24, 39]; // Gray-900

	let yPosition = 20;
	const leftMargin = 20;
	const pageWidth = doc.internal.pageSize.getWidth();

	// En-tête du document
	doc.setFontSize(20);
	doc.setTextColor(...primaryColor);
	doc.text('EcoDeli - Abonnement Client', leftMargin, yPosition);

	yPosition += 10;
	doc.setFontSize(12);
	doc.setTextColor(...secondaryColor);
	doc.text(
		`Genere le ${new Date().toLocaleDateString(
			'fr-FR'
		)} a ${new Date().toLocaleTimeString('fr-FR')}`,
		leftMargin,
		yPosition
	);

	// Ligne de séparation
	yPosition += 15;
	doc.setDrawColor(...primaryColor);
	doc.line(leftMargin, yPosition, pageWidth - leftMargin, yPosition);

	// Informations de l'abonnement
	yPosition += 20;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text("INFORMATIONS DE L'ABONNEMENT", leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// ID de l'abonnement
	doc.setFont('helvetica', 'bold');
	doc.text('ID Abonnement:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(`#${subscription.id}`, leftMargin + 45, yPosition);

	// Statut
	doc.setFont('helvetica', 'bold');
	doc.text('Statut:', leftMargin + 120, yPosition);
	doc.setFont('helvetica', 'normal');
	const statusLabels = {
		active: 'Actif',
		inactive: 'Inactif',
		cancelled: 'Annule',
		expired: 'Expire',
	};
	doc.text(
		statusLabels[subscription.status as keyof typeof statusLabels] ||
			subscription.status,
		leftMargin + 145,
		yPosition
	);

	yPosition += 15;

	// Type d'abonnement
	doc.setFont('helvetica', 'bold');
	doc.text('Type:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const typeLabels = {
		free: 'Gratuit',
		starter: 'Starter',
		premium: 'Premium',
		enterprise: 'Enterprise',
	};
	doc.text(
		typeLabels[subscription.subscription_type as keyof typeof typeLabels] ||
			subscription.subscription_type,
		leftMargin + 25,
		yPosition
	);

	// Prix mensuel
	doc.setFont('helvetica', 'bold');
	doc.text('Prix mensuel:', leftMargin + 100, yPosition);
	doc.setFont('helvetica', 'normal');
	const price =
		subscription.monthly_price === 0
			? 'Gratuit'
			: `${subscription.monthly_price.toFixed(2)} €/mois`;
	doc.text(price, leftMargin + 145, yPosition);

	// Fonctionnalités de l'abonnement
	yPosition += 20;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('FONCTIONNALITES INCLUSES', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Colis par mois
	doc.setFont('helvetica', 'bold');
	doc.text('Colis par mois:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const packagesText =
		subscription.features.max_packages_per_month === -1
			? 'Illimite'
			: `${subscription.features.max_packages_per_month}`;
	doc.text(packagesText, leftMargin + 45, yPosition);

	yPosition += 10;

	// Couverture assurance
	doc.setFont('helvetica', 'bold');
	doc.text('Couverture assurance:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		`${subscription.features.insurance_coverage} €`,
		leftMargin + 60,
		yPosition
	);

	yPosition += 10;

	// Support prioritaire
	doc.setFont('helvetica', 'bold');
	doc.text('Support prioritaire:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	doc.text(
		subscription.features.priority_support ? 'Oui' : 'Non',
		leftMargin + 55,
		yPosition
	);

	// Informations du client
	yPosition += 20;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS DU CLIENT', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Nom (ou email si pas de nom)
	doc.setFont('helvetica', 'bold');
	doc.text('Client:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const clientName =
		subscription.utilisateur.firstName && subscription.utilisateur.lastName
			? `${subscription.utilisateur.firstName} ${subscription.utilisateur.lastName}`
			: subscription.utilisateur.email;
	doc.text(clientName, leftMargin + 25, yPosition);

	yPosition += 10;

	// Email (si différent du nom)
	if (
		subscription.utilisateur.firstName &&
		subscription.utilisateur.lastName
	) {
		doc.setFont('helvetica', 'bold');
		doc.text('Email:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text(subscription.utilisateur.email, leftMargin + 25, yPosition);
		yPosition += 10;
	}

	// Téléphone
	if (subscription.utilisateur.phone_number) {
		doc.setFont('helvetica', 'bold');
		doc.text('Telephone:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text(
			subscription.utilisateur.phone_number,
			leftMargin + 35,
			yPosition
		);
		yPosition += 10;
	}

	// ID Client
	if (subscription.utilisateur.client) {
		doc.setFont('helvetica', 'bold');
		doc.text('ID Client:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text(
			`#${subscription.utilisateur.client.id}`,
			leftMargin + 30,
			yPosition
		);
		yPosition += 10;
	}

	// Informations temporelles
	yPosition += 15;
	doc.setFontSize(16);
	doc.setTextColor(...textColor);
	doc.text('INFORMATIONS TEMPORELLES', leftMargin, yPosition);

	yPosition += 15;
	doc.setFontSize(11);

	// Date de début
	doc.setFont('helvetica', 'bold');
	doc.text('Date de debut:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const startDate = new Date(subscription.start_date).toLocaleDateString(
		'fr-FR'
	);
	doc.text(startDate, leftMargin + 40, yPosition);

	yPosition += 10;

	// Date de fin
	if (subscription.end_date) {
		doc.setFont('helvetica', 'bold');
		doc.text('Date de fin:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		const endDate = new Date(subscription.end_date).toLocaleDateString(
			'fr-FR'
		);
		doc.text(endDate, leftMargin + 35, yPosition);
		yPosition += 10;
	} else {
		doc.setFont('helvetica', 'bold');
		doc.text('Duree:', leftMargin, yPosition);
		doc.setFont('helvetica', 'normal');
		doc.text('Illimitee', leftMargin + 25, yPosition);
		yPosition += 10;
	}

	// Date de création
	doc.setFont('helvetica', 'bold');
	doc.text('Date de creation:', leftMargin, yPosition);
	doc.setFont('helvetica', 'normal');
	const createdDate = new Date(subscription.created_at).toLocaleDateString(
		'fr-FR'
	);
	doc.text(createdDate, leftMargin + 45, yPosition);

	// Indicateurs de statut
	yPosition += 20;
	if (subscription.is_active) {
		doc.setTextColor(34, 197, 94); // Green-500
		doc.setFont('helvetica', 'bold');
		doc.text('✓ ABONNEMENT ACTIF', leftMargin, yPosition);
	}

	if (subscription.is_expired) {
		yPosition += 10;
		doc.setTextColor(220, 38, 38); // Red-600
		doc.setFont('helvetica', 'bold');
		doc.text('⚠ ABONNEMENT EXPIRE', leftMargin, yPosition);
	}

	// Pied de page
	const pageHeight = doc.internal.pageSize.getHeight();
	doc.setFontSize(8);
	doc.setTextColor(...secondaryColor);
	doc.text(
		'Ce document a ete genere automatiquement par EcoDeli Admin Dashboard',
		leftMargin,
		pageHeight - 15
	);
	doc.text(`ID Abonnement: ${subscription.id}`, leftMargin, pageHeight - 10);

	// Télécharger le PDF
	const fileName = `abonnement_client_${subscription.id}_${
		new Date().toISOString().split('T')[0]
	}.pdf`;
	doc.save(fileName);
}
