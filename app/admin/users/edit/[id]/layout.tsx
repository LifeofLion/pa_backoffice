'use client';

import BackOfficeLayout from '@/src/components/layouts/back-office-layout';
import { useUser } from '@/src/stores/auth-store';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditUserLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isAuthenticated, user } = useUser();
	const router = useRouter();
	const [isHydrated, setIsHydrated] = useState(false);

	// Attendre l'hydratation côté client
	useEffect(() => {
		setIsHydrated(true);
	}, []);

	// Vérification d'authentification seulement après hydratation
	useEffect(() => {
		if (!isHydrated) return; // Attendre l'hydratation

		console.log('🔍 EditUserLayout après hydratation:', {
			isAuthenticated,
			user,
			userRole: user ? ((user as any).admin ? 'admin' : 'other') : 'none',
			currentPath: window.location.pathname,
		});

		// Si pas authentifié après hydratation, rediriger
		if (!isAuthenticated) {
			console.log(
				'❌ Non authentifié après hydratation, redirection vers /login'
			);
			router.push('/login');
			return;
		}

		// Vérifier si c'est un admin
		if (user && !(user as any).admin) {
			console.log('❌ Pas admin, redirection vers /login');
			router.push('/login');
			return;
		}

		console.log('✅ Authentification OK après hydratation');
	}, [isHydrated, isAuthenticated, user, router]);

	// Afficher loading pendant l'hydratation
	if (!isHydrated) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div>Chargement de l'application...</div>
			</div>
		);
	}

	// Afficher loading pendant la vérification d'authentification
	if (!isAuthenticated) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div>Vérification de l'authentification...</div>
			</div>
		);
	}

	// Vérifier si admin
	if (!user || !(user as any).admin) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div>Accès refusé - Admin requis</div>
			</div>
		);
	}

	return <BackOfficeLayout activeRoute='users'>{children}</BackOfficeLayout>;
}
