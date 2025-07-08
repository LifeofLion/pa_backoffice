'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BackOfficeLayout } from '@/src/components/layouts';
import { useRequireRole } from '@/hooks/use-auth';
import { AnnonceDetailContent } from '@/components/back-office/annonce-detail';

export default function AnnonceDetailPage() {
	const { checkingRole, redirecting } = useRequireRole('admin');
	const router = useRouter();

	// Redirection si l'utilisateur n'est pas admin
	useEffect(() => {
		if (redirecting) {
			router.push('/login');
		}
	}, [redirecting, router]);

	// Afficher un loading pendant la vérification
	if (checkingRole) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	// Ne pas rendre la page si redirection en cours
	if (redirecting) {
		return null;
	}

	return (
		<BackOfficeLayout activeRoute='annonces'>
			<AnnonceDetailContent />
		</BackOfficeLayout>
	);
}
