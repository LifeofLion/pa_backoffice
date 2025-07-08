import type { Annonce } from '@/hooks/use-announcements';

/**
 * Ouvre la boîte mail par défaut avec un email pré-rempli pour contacter l'utilisateur d'une annonce
 */
export function openMailTo(annonce: Annonce): void {
	if (!annonce.utilisateur?.email) {
		alert('Aucun email disponible pour cet utilisateur');
		return;
	}

	const email = annonce.utilisateur.email;
	const subject = `EcoDeli - Concernant votre annonce: ${annonce.title}`;

	// Créer un message par défaut personnalisé
	const body = `Bonjour ${annonce.userName || 'Monsieur/Madame'},

Nous vous contactons concernant votre annonce sur EcoDeli :

📋 Annonce : ${annonce.title}
🆔 Référence : ${annonce.id
		.replace('traditional_', '')
		.replace('shopkeeper_', '')}
📅 Date de création : ${new Date(annonce.created_at).toLocaleDateString(
		'fr-FR'
	)}
💰 Prix : ${annonce.price.toFixed(2)} €

[Votre message ici]

Cordialement,
L'équipe EcoDeli Admin
`;

	// Encoder les paramètres pour l'URL mailto
	const encodedSubject = encodeURIComponent(subject);
	const encodedBody = encodeURIComponent(body);

	// Construire l'URL mailto
	const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;

	// Ouvrir la boîte mail
	try {
		window.open(mailtoUrl, '_self');
	} catch (error) {
		console.error("Erreur lors de l'ouverture de la boîte mail:", error);
		alert(
			"Impossible d'ouvrir la boîte mail. Veuillez copier l'email manuellement : " +
				email
		);
	}
}

/**
 * Copie l'email de l'utilisateur dans le presse-papiers
 */
export function copyEmailToClipboard(email: string): Promise<boolean> {
	return navigator.clipboard
		.writeText(email)
		.then(() => {
			console.log('Email copié dans le presse-papiers:', email);
			return true;
		})
		.catch((error) => {
			console.error('Erreur lors de la copie:', error);
			return false;
		});
}
