'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';
import { useLanguage } from '@/components/language-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/src/hooks/use-admin';
import { AdminUserCreationRequest } from '@/src/types/validators';
import { FrontendValidators } from '@/src/types/validators';

export function AddUsersContent() {
	const { t } = useLanguage();
	const { toast } = useToast();
	const router = useRouter();
	const adminHook = useAdmin();
	const { createCompleteUser, loading, error, clearError } = adminHook;
	const [date, setDate] = useState<Date>();
	const [isCreated, setIsCreated] = useState(false);
	const [formData, setFormData] = useState<AdminUserCreationRequest>({
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		phone_number: '',
		address: '',
		city: '',
		postalCode: '',
		country: 'France',
		roles: [],
		privileges: undefined,
	});
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleRoleChange = (role: string, checked: boolean) => {
		setFormData((prev) => {
			const currentRoles = prev.roles || [];
			if (checked) {
				return {
					...prev,
					roles: [
						...currentRoles,
						role as
							| 'livreur'
							| 'commercant'
							| 'prestataire'
							| 'administrateur',
					],
				};
			} else {
				return {
					...prev,
					roles: currentRoles.filter((r) => r !== role),
				};
			}
		});
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// ✅ VALIDATION FRONTEND AVEC LES VALIDATORS
		const frontendErrors =
			FrontendValidators.validateAdminUserCreationRequest(formData);

		if (Object.keys(frontendErrors).length > 0) {
			setValidationErrors(frontendErrors);
			toast({
				variant: 'destructive',
				title: '❌ Erreurs de validation',
				description: `Veuillez corriger les erreurs dans le formulaire.`,
				duration: 6000,
			});
			return;
		}

		// Nettoyer les erreurs si tout est OK
		setValidationErrors({});

		try {
			clearError(); // Nettoyer les erreurs précédentes

			// Préparer les données selon le validator backend exact
			const userData: AdminUserCreationRequest = {
				first_name: formData.first_name.trim(),
				last_name: formData.last_name.trim(),
				email: formData.email.trim().toLowerCase(),
				password: formData.password,
				phone_number: formData.phone_number
					? formData.phone_number.trim()
					: null,
				address: formData.address ? formData.address.trim() : null,
				city: formData.city.trim(),
				postalCode: formData.postalCode.trim(),
				country: formData.country.trim(),
				roles:
					formData.roles && formData.roles.length > 0
						? formData.roles
						: undefined,
				privileges:
					formData.privileges &&
					formData.privileges !== 'basic' &&
					formData.privileges !== undefined &&
					['advanced', 'super'].includes(formData.privileges as any)
						? formData.privileges
						: undefined,
			};

			const result = await createCompleteUser(userData);

			// ⚠️ VÉRIFIER SI LA CRÉATION A ÉCHOUÉ
			if (!result || !result.success) {
				// Gestion spécifique des erreurs d'email déjà existant
				if (error && error.toLowerCase().includes('email')) {
					setValidationErrors((prev) => ({
						...prev,
						email: error,
					}));
					return;
				}

				// Autres erreurs génériques
				if (error) {
					toast({
						variant: 'destructive',
						title: '❌ Erreur de création',
						description: error,
						duration: 8000,
					});
				} else {
					toast({
						variant: 'destructive',
						title: '❌ Erreur de création',
						description: "La création d'utilisateur a échoué",
						duration: 8000,
					});
				}
				return;
			}

			// ✅ SUCCÈS : Marquer comme créé pour l'interface utilisateur
			setIsCreated(true);

			// Toast de succès avec détails des rôles créés
			const rolesText =
				result.rolesCreated && result.rolesCreated.length > 0
					? ` avec les rôles : ${result.rolesCreated.join(', ')}`
					: ' (client automatique inclus)';

			toast({
				title: '✅ Succès !',
				description: `Utilisateur "${formData.first_name} ${formData.last_name}" créé avec succès${rolesText}`,
				variant: 'default',
				duration: 5000,
			});

			// Attendre un peu avant de rediriger pour que l'utilisateur voie le toast
			setTimeout(() => {
				router.push('/admin/users');
			}, 2000);
		} catch (error) {
			// Gestion d'erreur propre sans console.error
			const errorMessage =
				error instanceof Error ? error.message : 'Erreur inconnue';

			// Gestion spécifique pour les erreurs d'email
			if (errorMessage.toLowerCase().includes('email')) {
				setValidationErrors((prev) => ({
					...prev,
					email: 'Cette adresse email est déjà utilisée',
				}));
			} else {
				// Autres erreurs en toast
				toast({
					variant: 'destructive',
					title: '❌ Erreur de création',
					description: errorMessage,
					duration: 8000,
				});
			}
		}
	};

	return (
		<div className='space-y-6'>
			<div className='flex items-center'>
				<Link
					href='/admin/users'
					className='text-green-50 hover:underline flex items-center'
				>
					<ChevronDown className='h-4 w-4 mr-1 rotate-90' />
					{t('common.back')}
				</Link>
			</div>

			<h1 className='text-2xl font-bold'>{t('admin.addUser')}</h1>

			{/* 🚨 GESTION DE L'ERREUR GLOBALE DU HOOK (si ce n'est pas une erreur de champ spécifique) */}
			{error && !Object.keys(validationErrors).length && (
				<div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
					<h3 className='text-red-800 font-medium text-sm mb-2'>
						🚨 Erreur serveur
					</h3>
					<p className='text-red-700 text-sm'>{error}</p>
				</div>
			)}

			{/* Message d'information si erreur du hook */}
			{/* {error && (
				<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
					<h3 className='text-red-800 font-medium'>
						🚨 Erreur détectée
					</h3>
					<p className='text-red-700 text-sm mt-1'>{error}</p>
				</div>
			)} */}

			{/* Message de succès visible */}
			{isCreated && (
				<div className='bg-green-50 border border-green-200 rounded-lg p-4'>
					<h3 className='text-green-800 font-medium'>
						✅ Création réussie !
					</h3>
					<p className='text-green-700 text-sm mt-1'>
						L'utilisateur{' '}
						<strong>
							{formData.first_name} {formData.last_name}
						</strong>{' '}
						a été créé avec succès. Redirection en cours vers la
						liste des utilisateurs...
					</p>
				</div>
			)}

			<div className='bg-white rounded-lg p-6 shadow-sm'>
				<form onSubmit={handleSubmit} className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div>
							<Label
								htmlFor='first_name'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.firstName')} * (2-50 caractères)
							</Label>
							<Input
								id='first_name'
								value={formData.first_name}
								onChange={(e) =>
									handleInputChange(
										'first_name',
										e.target.value
									)
								}
								required
								minLength={2}
								maxLength={50}
							/>
							{validationErrors.first_name && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.first_name}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='last_name'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.lastName')} * (2-50 caractères)
							</Label>
							<Input
								id='last_name'
								value={formData.last_name}
								onChange={(e) =>
									handleInputChange(
										'last_name',
										e.target.value
									)
								}
								required
								minLength={2}
								maxLength={50}
							/>
							{validationErrors.last_name && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.last_name}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='email'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.email')} *
							</Label>
							<Input
								id='email'
								type='email'
								value={formData.email}
								onChange={(e) =>
									handleInputChange('email', e.target.value)
								}
								required
							/>
							{validationErrors.email && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.email}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='password'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.password')} * (minimum 8 caractères)
							</Label>
							<Input
								id='password'
								type='password'
								value={formData.password}
								onChange={(e) =>
									handleInputChange(
										'password',
										e.target.value
									)
								}
								required
								minLength={8}
								maxLength={100}
							/>
							{validationErrors.password && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.password}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='phone_number'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.phoneNumber')}
							</Label>
							<Input
								id='phone_number'
								value={formData.phone_number || ''}
								onChange={(e) =>
									handleInputChange(
										'phone_number',
										e.target.value
									)
								}
							/>
						</div>

						<div>
							<Label
								htmlFor='address'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.address')}
							</Label>
							<Input
								id='address'
								value={formData.address || ''}
								onChange={(e) =>
									handleInputChange('address', e.target.value)
								}
							/>
						</div>

						<div>
							<Label
								htmlFor='city'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.city')} * (2-100 caractères)
							</Label>
							<Input
								id='city'
								value={formData.city}
								onChange={(e) =>
									handleInputChange('city', e.target.value)
								}
								required
								minLength={2}
								maxLength={100}
								placeholder='Paris, Londres, Berlin...'
							/>
							{validationErrors.city && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.city}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='postalCode'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.postalCode')} * (2-20 caractères)
							</Label>
							<Input
								id='postalCode'
								value={formData.postalCode}
								onChange={(e) =>
									handleInputChange(
										'postalCode',
										e.target.value
									)
								}
								required
								minLength={2}
								maxLength={20}
								placeholder='75001, SW1A 1AA, 10115...'
							/>
							{validationErrors.postalCode && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.postalCode}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='country'
								className='text-gray-500 mb-2 block'
							>
								{t('auth.country')} * (2-100 caractères)
							</Label>
							<Select
								value={formData.country}
								onValueChange={(value) =>
									handleInputChange('country', value)
								}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder='Sélectionner un pays' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='France'>
										France
									</SelectItem>
									<SelectItem value='United Kingdom'>
										United Kingdom
									</SelectItem>
									<SelectItem value='Germany'>
										Germany
									</SelectItem>
									<SelectItem value='Spain'>Spain</SelectItem>
									<SelectItem value='Italy'>Italy</SelectItem>
								</SelectContent>
							</Select>
							{validationErrors.country && (
								<p className='text-red-500 text-xs mt-1'>
									{validationErrors.country}
								</p>
							)}
						</div>

						<div>
							<Label className='text-gray-500 mb-2 block'>
								Privilèges admin
							</Label>
							<Select
								value={formData.privileges}
								onValueChange={(value) =>
									handleInputChange('privileges', value)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Sélectionner les privilèges' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='none'>
										Aucun privilège
									</SelectItem>
									<SelectItem value='basic'>
										Basique
									</SelectItem>
									<SelectItem value='advanced'>
										Avancé
									</SelectItem>
									<SelectItem value='super'>Super</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Rôles */}
					<div>
						<Label className='text-gray-500 mb-2 block'>
							Rôles utilisateur
						</Label>
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							{[
								{ value: 'livreur', label: 'Livreur' },
								{ value: 'commercant', label: 'Commerçant' },
								{ value: 'prestataire', label: 'Prestataire' },
								{
									value: 'administrateur',
									label: 'Administrateur',
								},
							].map((role) => (
								<label
									key={role.value}
									className='flex items-center space-x-2'
								>
									<input
										type='checkbox'
										checked={
											formData.roles?.includes(
												role.value as
													| 'livreur'
													| 'commercant'
													| 'prestataire'
													| 'administrateur'
											) || false
										}
										onChange={(e) =>
											handleRoleChange(
												role.value,
												e.target.checked
											)
										}
										className='rounded border-gray-300'
									/>
									<span className='text-sm'>
										{role.label}
									</span>
								</label>
							))}
						</div>
					</div>

					<div className='flex justify-center mt-8'>
						<Button
							type='submit'
							disabled={loading || isCreated}
							className={`px-8 transition-all duration-300 ${
								isCreated
									? 'bg-green-600 hover:bg-green-600 text-white'
									: 'bg-[#8CD790] hover:bg-[#7ac57e] text-white'
							}`}
						>
							{loading && '🔄 Création en cours...'}
							{!loading &&
								isCreated &&
								'✅ Utilisateur créé ! Redirection...'}
							{!loading && !isCreated && t('common.create')}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
