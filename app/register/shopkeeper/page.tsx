'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Register } from '@/src/components/refactored/auth';
import { apiClient } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';
import { useAuth } from '@/src/hooks/use-auth';

export default function ShopkeeperRegisterPage() {
	const router = useRouter();
	const { user, isAuthenticated } = useAuth();
	const [isChecking, setIsChecking] = useState(true);
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		checkUserStatus();
	}, [isAuthenticated, user]);

	const checkUserStatus = async () => {
		try {
			if (!isAuthenticated || !user) {
				// Pas connecté, afficher le formulaire
				setShowForm(true);
				setIsChecking(false);
				return;
			}

			// Utiliser les données de l'utilisateur depuis useAuth
			const currentUser = user;

			// Vérifier si l'utilisateur a déjà le rôle commercant
			const hasRole = !!currentUser.commercant;

			if (hasRole) {
				console.log(`✅ User already has shopkeeper role`);

				// Vérifier le statut des documents justificatifs
				const justifications = await apiClient.get(
					API_ROUTES.JUSTIFICATION.BY_USER(currentUser.id.toString())
				);
				const hasValidatedDocs =
					checkDocumentsValidated(justifications);

				if (hasValidatedDocs) {
					console.log(
						`✅ User documents validated, redirecting to /app_shopkeeper`
					);
					router.push('/app_shopkeeper');
					return;
				} else {
					console.log(
						`⚠️ User has role but documents not validated, showing form`
					);
					setShowForm(true);
				}
			} else {
				// L'utilisateur n'a pas le rôle, afficher le formulaire
				console.log(
					`ℹ️ User doesn't have shopkeeper role, showing form`
				);
				setShowForm(true);
			}
		} catch (error) {
			console.error('Error checking user status:', error);
			// En cas d'erreur, afficher le formulaire
			setShowForm(true);
		} finally {
			setIsChecking(false);
		}
	};

	const checkDocumentsValidated = (justifications: any): boolean => {
		try {
			const data = Array.isArray(justifications.data)
				? justifications.data
				: Array.isArray(justifications)
				? justifications
				: [];

			console.log('🔍 DEBUG checkDocumentsValidated - Raw data:', data);

			// Filtrer les justifications pour commercant - support camelCase et snake_case
			const userJustifications = data.filter((j: any) => {
				const accountType = j.account_type || j.accountType;
				console.log(
					`🔍 Document ${j.id} - accountType: ${accountType}`
				);
				return accountType === 'commercant';
			});

			console.log(
				'🔍 Justifications filtrées pour commercant:',
				userJustifications.length
			);

			if (userJustifications.length === 0) {
				console.log('❌ Aucun document commercant trouvé');
				return false; // Aucun document soumis
			}

			// Vérifier si au moins un document est validé - support camelCase et snake_case
			const hasVerifiedDoc = userJustifications.some((j: any) => {
				const verificationStatus =
					j.verification_status || j.verificationStatus;
				console.log(
					`🔍 Document verification status: ${verificationStatus}`
				);
				return verificationStatus === 'verified';
			});

			console.log('🔍 A un document vérifié:', hasVerifiedDoc);
			return hasVerifiedDoc;
		} catch (error) {
			console.error('Error checking documents:', error);
			return false;
		}
	};

	if (isChecking) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-green-200'>
				<div className='bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md text-center'>
					<div className='animate-spin h-8 w-8 border-2 border-green-500 rounded-full border-t-transparent mx-auto mb-4'></div>
					<p className='text-gray-600'>
						Vérification de votre statut...
					</p>
				</div>
			</div>
		);
	}

	if (!showForm) {
		return null; // Redirection en cours
	}

	return <Register accountType='shopkeeper' />;
}
