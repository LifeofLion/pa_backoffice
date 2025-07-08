import jsPDF from 'jspdf';
import type { Annonce } from '@/hooks/use-announcements';

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
