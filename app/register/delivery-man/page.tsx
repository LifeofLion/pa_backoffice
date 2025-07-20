'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Register } from '@/src/components/refactored/auth';
import { useAuth } from '@/src/hooks/use-auth';
import { apiClient } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';
import { JustificationPiecesResponse, JustificationPiece } from '@/src/types';

export default function DeliveryManRegisterPage() {
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

			// 🔍 DEBUG: Vérifier la structure de currentUser
			console.log('🔍 Current user object:', currentUser);
			console.log('🔍 Current user ID:', currentUser.id);
			console.log('🔍 Current user ID type:', typeof currentUser.id);
			console.log(
				'🔍 Current user ID toString():',
				currentUser.id.toString()
			);

			// 🔍 DEBUG: Vérifier spécifiquement le rôle livreur
			console.log('🔍 currentUser.livreur:', currentUser.livreur);
			console.log('🔍 !!currentUser.livreur:', !!currentUser.livreur);
			console.log(
				'🔍 hasOwnProperty livreur:',
				currentUser.hasOwnProperty('livreur')
			);
			console.log(
				'🔍 Object.keys(currentUser):',
				Object.keys(currentUser)
			);

			// Vérifier si l'utilisateur a déjà le rôle livreur
			const hasRole = !!currentUser.livreur;

			if (hasRole) {
				console.log(`✅ User already has delivery role`);

				// Vérifier le statut des documents justificatifs
				// 🔧 SOLUTION TEMPORAIRE: Nettoyer l'ID pour éviter les caractères bizarres
				const cleanUserId = String(currentUser.id)
					.split(':')[0]
					.split('.')[0];
				console.log('🔧 Clean user ID:', cleanUserId);

				const justifications =
					await apiClient.get<JustificationPiecesResponse>(
						API_ROUTES.JUSTIFICATION.BY_USER(cleanUserId)
					);

				// 🔍 DEBUG: Vérifier ce que retourne l'API justifications
				console.log('🔍 Justifications API response:', justifications);
				console.log('🔍 Justifications.data:', justifications.data);
				console.log(
					'🔍 Array.isArray(justifications.data):',
					Array.isArray(justifications.data)
				);
				if (justifications.data) {
					console.log(
						'🔍 justifications.data.length:',
						justifications.data.length
					);
					justifications.data.forEach(
						(j: JustificationPiece, index: number) => {
							console.log(`🔍 Document ${index}:`, {
								account_type: j.account_type,
								verification_status: j.verification_status,
								document_type: j.document_type,
							});
						}
					);
				}

				const hasValidatedDocs =
					checkDocumentsValidated(justifications);
				console.log('🔍 hasValidatedDocs result:', hasValidatedDocs);

				if (hasValidatedDocs) {
					console.log(
						`✅ User documents validated, redirecting to /app_deliveryman`
					);
					router.push('/app_deliveryman');
					return;
				} else {
					console.log(
						`⚠️ User has role but documents not validated, showing form`
					);
					setShowForm(true);
				}
			} else {
				// L'utilisateur n'a pas le rôle, afficher le formulaire
				console.log(`ℹ️ User doesn't have delivery role, showing form`);
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

	const checkDocumentsValidated = (
		justifications: JustificationPiecesResponse
	): boolean => {
		try {
			const data = Array.isArray(justifications.data)
				? justifications.data
				: Array.isArray(justifications)
				? (justifications as JustificationPiece[])
				: [];

			console.log('🔍 DEBUG checkDocumentsValidated - Raw data:', data);

			// Debug: voir la structure exacte des premiers documents
			if (data.length > 0) {
				console.log(
					'🔍 Premier document structure:',
					Object.keys(data[0])
				);
				console.log('🔍 Premier document complet:', data[0]);
			}

			// Filtrer les justifications pour livreur - support camelCase et snake_case
			const userJustifications = data.filter((j: any) => {
				// Vérifier les propriétés en camelCase et snake_case
				const accountType = j.account_type || j.accountType;
				console.log(
					`🔍 Document ${j.id} - accountType: ${accountType} (from account_type: ${j.account_type}, accountType: ${j.accountType})`
				);
				return accountType === 'livreur';
			});

			console.log(
				'🔍 Justifications filtrées pour livreur:',
				userJustifications.length
			);
			userJustifications.forEach((j: any, index: number) => {
				const verificationStatus =
					j.verification_status || j.verificationStatus;
				console.log(`🔍 Document livreur ${index}:`, {
					id: j.id,
					accountType: j.account_type || j.accountType,
					documentType: j.document_type || j.documentType,
					verificationStatus: verificationStatus,
					filePath: j.file_path || j.filePath,
				});
			});

			if (userJustifications.length === 0) {
				console.log('❌ Aucun document livreur trouvé');
				return false; // Aucun document soumis
			}

			// Vérifier si au moins un document est validé - support camelCase et snake_case
			const hasVerifiedDoc = userJustifications.some((j: any) => {
				const verificationStatus =
					j.verification_status || j.verificationStatus;
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

	return <Register accountType='delivery-man' />;
}
