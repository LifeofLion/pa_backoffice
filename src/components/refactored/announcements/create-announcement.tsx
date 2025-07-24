'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Package, MapPin } from 'lucide-react';
import { useLanguage } from '@/components/language-context';
import { ClientLayout } from '@/src/components/layouts';
import { useAuth } from '@/src/hooks/use-auth';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import type { CreateAnnouncementRequest } from '@/src/types/validators';
import { FrontendValidators } from '@/src/types/validators';
import { useRouter } from 'next/navigation';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface AddressSuggestion {
	label: string;
	value: string;
}

interface PackageInfo {
	name: string;
	weight: number;
	price: number;
	packageSize: 'Small' | 'Medium' | 'Large';
	priorityShipping: boolean;
	image: File | null;
	imagePreview: string | null;
}

// =============================================================================
// HOOK PERSONNALISÉ POUR LA LOGIQUE D'ADRESSES
// =============================================================================

function useAddressSuggestions() {
	const [startingSuggestions, setStartingSuggestions] = useState<
		AddressSuggestion[]
	>([]);
	const [destinationSuggestions, setDestinationSuggestions] = useState<
		AddressSuggestion[]
	>([]);
	const [showStartingSuggestions, setShowStartingSuggestions] =
		useState(false);
	const [showDestinationSuggestions, setShowDestinationSuggestions] =
		useState(false);
	const [isLoadingStartingSuggestions, setIsLoadingStartingSuggestions] =
		useState(false);
	const [
		isLoadingDestinationSuggestions,
		setIsLoadingDestinationSuggestions,
	] = useState(false);

	const searchAddresses = async (query: string, isStarting: boolean) => {
		if (query.length < 3) {
			if (isStarting) {
				setStartingSuggestions([]);
				setShowStartingSuggestions(false);
			} else {
				setDestinationSuggestions([]);
				setShowDestinationSuggestions(false);
			}
			return;
		}

		try {
			if (isStarting) {
				setIsLoadingStartingSuggestions(true);
			} else {
				setIsLoadingDestinationSuggestions(true);
			}

			const response = await fetch(
				`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
					query
				)}&limit=5`
			);
			const data = await response.json();

			const suggestions = data.features.map((feature: any) => ({
				label: feature.properties.label,
				value: feature.properties.label,
			}));

			if (isStarting) {
				setStartingSuggestions(suggestions);
				setShowStartingSuggestions(true);
				setIsLoadingStartingSuggestions(false);
			} else {
				setDestinationSuggestions(suggestions);
				setShowDestinationSuggestions(true);
				setIsLoadingDestinationSuggestions(false);
			}
		} catch (error) {
			console.error('Error fetching address suggestions:', error);
			if (isStarting) {
				setIsLoadingStartingSuggestions(false);
			} else {
				setIsLoadingDestinationSuggestions(false);
			}
		}
	};

	return {
		startingSuggestions,
		destinationSuggestions,
		showStartingSuggestions,
		showDestinationSuggestions,
		isLoadingStartingSuggestions,
		isLoadingDestinationSuggestions,
		setShowStartingSuggestions,
		setShowDestinationSuggestions,
		searchAddresses,
	};
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function CreateAnnouncement() {
	const { t } = useLanguage();
	const { user } = useAuth();
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [step, setStep] = useState(1); // Étape 1: Nombre de colis, Étape 2: Adresses, Étape 3: Date de livraison, Étape 4: Contenu des colis
	const [packageCount, setPackageCount] = useState(1);
	const [currentPackage, setCurrentPackage] = useState(1);

	// États pour les adresses
	const [destinationAddress, setDestinationAddress] = useState('');
	const [startingType, setStartingType] = useState<'address' | 'box'>(
		'address'
	);
	const [startingAddress, setStartingAddress] = useState('');
	const [startingBox, setStartingBox] = useState('');

	// État pour la date de livraison
	const [deliveryDate, setDeliveryDate] = useState('');

	// Hook personnalisé pour les suggestions d'adresses
	const {
		startingSuggestions,
		destinationSuggestions,
		showStartingSuggestions,
		showDestinationSuggestions,
		isLoadingStartingSuggestions,
		isLoadingDestinationSuggestions,
		setShowStartingSuggestions,
		setShowDestinationSuggestions,
		searchAddresses,
	} = useAddressSuggestions();

	// Refs pour les dropdowns
	const startingSuggestionsRef = useRef<HTMLDivElement>(null);
	const destinationSuggestionsRef = useRef<HTMLDivElement>(null);

	const [packages, setPackages] = useState<PackageInfo[]>([
		{
			name: '',
			weight: 0,
			price: 0,
			packageSize: 'Medium',
			priorityShipping: false,
			image: null,
			imagePreview: null,
		},
	]);

	// =============================================================================
	// EFFETS
	// =============================================================================

	// Effet pour gérer les clics en dehors des suggestions
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				startingSuggestionsRef.current &&
				!startingSuggestionsRef.current.contains(event.target as Node)
			) {
				setShowStartingSuggestions(false);
			}
			if (
				destinationSuggestionsRef.current &&
				!destinationSuggestionsRef.current.contains(
					event.target as Node
				)
			) {
				setShowDestinationSuggestions(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Debounce pour les recherches d'adresses
	useEffect(() => {
		const timer = setTimeout(() => {
			searchAddresses(startingAddress, true);
		}, 300);

		return () => clearTimeout(timer);
	}, [startingAddress]);

	useEffect(() => {
		const timer = setTimeout(() => {
			searchAddresses(destinationAddress, false);
		}, 300);

		return () => clearTimeout(timer);
	}, [destinationAddress]);

	// =============================================================================
	// GESTION DES PACKAGES
	// =============================================================================

	const handlePackageCountChange = (count: number) => {
		if (count < 1) return;
		setPackageCount(count);

		// Ajuster le tableau des packages
		if (count > packages.length) {
			// Ajouter des packages
			const newPackages = [...packages];
			for (let i = packages.length; i < count; i++) {
				newPackages.push({
					name: '',
					weight: 0,
					price: 0,
					packageSize: 'Medium',
					priorityShipping: false,
					image: null,
					imagePreview: null,
				});
			}
			setPackages(newPackages);
		} else if (count < packages.length) {
			// Supprimer des packages
			setPackages(packages.slice(0, count));
			if (currentPackage > count) {
				setCurrentPackage(count);
			}
		}
	};

	const handleImageChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		packageIndex: number
	) => {
		const file = e.target.files?.[0];
		if (file) {
			const newPackages = [...packages];
			newPackages[packageIndex].image = file;

			const reader = new FileReader();
			reader.onloadend = () => {
				newPackages[packageIndex].imagePreview =
					reader.result as string;
				setPackages(newPackages);
			};
			reader.readAsDataURL(file);
		}
	};

	const handlePackageChange = (
		packageIndex: number,
		field: string,
		value: any
	) => {
		const newPackages = [...packages];
		(newPackages[packageIndex] as any)[field] = value;
		setPackages(newPackages);
	};

	const togglePriorityShipping = (packageIndex: number) => {
		const newPackages = [...packages];
		newPackages[packageIndex].priorityShipping =
			!newPackages[packageIndex].priorityShipping;
		setPackages(newPackages);
	};

	// =============================================================================
	// NAVIGATION ENTRE ÉTAPES
	// =============================================================================

	const goToNextPackage = () => {
		if (currentPackage < packageCount) {
			setCurrentPackage(currentPackage + 1);
		}
	};

	const goToPreviousPackage = () => {
		if (currentPackage > 1) {
			setCurrentPackage(currentPackage - 1);
		}
	};

	const proceedToAddressStep = () => {
		setStep(2);
	};

	const proceedToDeliveryDateStep = () => {
		setStep(3);
	};

	const proceedToPackageDetails = () => {
		setStep(4);
	};

	const goBackToPackageCount = () => {
		setStep(1);
	};

	const goBackToAddressStep = () => {
		setStep(2);
	};

	const goBackToDeliveryDateStep = () => {
		setStep(3);
	};

	// =============================================================================
	// GESTION DES ADRESSES
	// =============================================================================

	const selectStartingAddress = (suggestion: AddressSuggestion) => {
		setStartingAddress(suggestion.value);
		setShowStartingSuggestions(false);
	};

	const selectDestinationAddress = (suggestion: AddressSuggestion) => {
		setDestinationAddress(suggestion.value);
		setShowDestinationSuggestions(false);
	};

	// =============================================================================
	// VALIDATION ET SOUMISSION
	// =============================================================================

	const isFormValid = () => {
		if (!destinationAddress.trim()) return false;
		if (startingType === 'address' && !startingAddress.trim()) return false;
		if (startingType === 'box' && !startingBox.trim()) return false;

		// Vérifier que tous les packages ont les champs requis
		return packages.every(
			(pkg) =>
				pkg.name.trim() &&
				pkg.price > 0 &&
				pkg.weight > 0 &&
				pkg.packageSize
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			setError(t('common.authRequired'));
			return;
		}

		// Validation côté client
		const errors: string[] = [];

		if (!destinationAddress.trim()) {
			errors.push("L'adresse de destination est requise");
		}

		if (startingType === 'address' && !startingAddress.trim()) {
			errors.push("L'adresse de départ est requise");
		}

		if (startingType === 'box' && !startingBox.trim()) {
			errors.push('Veuillez sélectionner une boîte de stockage');
		}

		// Validation des packages
		packages.forEach((pkg, index) => {
			if (!pkg.name.trim()) {
				errors.push(`Le nom du colis ${index + 1} est requis`);
			}
			if (!pkg.price || pkg.price <= 0) {
				errors.push(
					`Le Montant de la livraison ${
						index + 1
					} doit être supérieur à 0`
				);
			}
			if (!pkg.weight || pkg.weight <= 0) {
				errors.push(
					`Le poids du colis ${index + 1} doit être supérieur à 0`
				);
			}
			if (!pkg.packageSize) {
				errors.push(`La taille du colis ${index + 1} est requise`);
			}
		});

		if (errors.length > 0) {
			setError(errors.join(', '));
			return;
		}

		setIsSubmitting(true);
		setError('');

		try {
			// Créer l'annonce principale
			const announcementData: CreateAnnouncementRequest = {
				utilisateur_id: user.id,
				title: packages[0].name || 'Livraison de colis',
				description: `Livraison de ${packageCount} colis`,
				price: packages.reduce((total, pkg) => total + pkg.price, 0),
				type: 'transport_colis',
				status: 'active',
				end_location: destinationAddress,
				start_location:
					startingType === 'address'
						? startingAddress
						: `Boîte de stockage: ${startingBox}`,
				desired_date: deliveryDate,
				priority: packages.some((pkg) => pkg.priorityShipping),
				storage_box_id:
					startingType === 'box' ? startingBox : undefined,
				tags: packages.map((pkg) => pkg.packageSize),
				insurance_amount: 0,
			};

			console.log('📍 Adresse de destination:', destinationAddress);
			console.log(
				'📍 Adresse de départ:',
				startingType === 'address'
					? startingAddress
					: `Boîte de stockage: ${startingBox}`
			);
			console.log("📦 Données complètes de l'annonce:", announcementData);

			// VALIDATION FRONTEND AVANT ENVOI AU BACKEND
			console.log('🔍 Validation frontend des données...');
			const validationErrors =
				FrontendValidators.validateCreateAnnouncementRequest(
					announcementData
				);
			if (validationErrors.length > 0) {
				console.log(
					'❌ Erreurs de validation frontend:',
					validationErrors
				);
				setError(
					`Erreurs de validation: ${validationErrors.join(', ')}`
				);
				return;
			}
			console.log('✅ Validation frontend réussie');

			// Récupérer l'image du premier colis (s'il y en a une)
			const firstPackageImage = packages[0]?.image || undefined;

			// Créer l'annonce avec l'image
			const response: any = await apiClient.createAnnouncementWithImage(
				announcementData,
				firstPackageImage
			);

			// L'API renvoie { annonce: ... } - extraire l'objet annonce créé
			const createdAnnouncement = response?.annonce || response;
			console.log('✅ Annonce créée avec succès:', createdAnnouncement);

			// NOUVEAU: Créer les colis individuels pour cette annonce
			console.log('📦 Création des colis individuels...');

			for (let i = 0; i < packages.length; i++) {
				const pkg = packages[i];

				try {
					const colisData = {
						annonce_id: createdAnnouncement.id,
						weight: pkg.weight,
						length: 30, // Dimensions par défaut basées sur la taille
						width:
							pkg.packageSize === 'Small'
								? 15
								: pkg.packageSize === 'Medium'
								? 20
								: 25,
						height:
							pkg.packageSize === 'Small'
								? 10
								: pkg.packageSize === 'Medium'
								? 15
								: 20,
						content_description: pkg.name || `Colis ${i + 1}`,
					};

					console.log(`📦 Création du colis ${i + 1}:`, colisData);

					// Appeler l'API de création de colis
					const colisResponse = await apiClient.post(
						'/colis/create',
						colisData
					);
					console.log(`✅ Colis ${i + 1} créé:`, colisResponse);
				} catch (colisError) {
					console.error(
						`❌ Erreur création colis ${i + 1}:`,
						colisError
					);
					// Ne pas bloquer le processus si un colis échoue
				}
			}

			console.log('🎉 Annonce et colis créés avec succès !');
			router.push('/app_client/announcements');
		} catch (error) {
			console.error('Error creating announcement:', error);
			setError(getErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	// =============================================================================
	// RENDU - EXACTEMENT IDENTIQUE AU COMPOSANT ORIGINAL
	// =============================================================================

	return (
		<ClientLayout activeRoute='announcements'>
			<main className='container mx-auto px-4 py-8'>
				<div className='max-w-2xl mx-auto'>
					<div className='flex items-center mb-6'>
						<Link
							href='/app_client/announcements'
							className='text-gray-600 hover:text-green-500 mr-4'
						>
							<ArrowLeft className='h-5 w-5' />
						</Link>
						<h1 className='text-2xl font-semibold text-green-400'>
							{t('announcements.goBackToAnnouncements')}
						</h1>
					</div>

					{error && (
						<div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md'>
							{error}
						</div>
					)}

					{/* Étape 1: Sélection du nombre de colis */}
					{step === 1 && (
						<div className='bg-white rounded-lg shadow-md p-6'>
							<h2 className='text-xl font-medium text-gray-800 mb-6'>
								{t('announcements.selectPackageCount')}
							</h2>

							<div className='flex flex-col items-center justify-center py-8'>
								<div className='flex items-center justify-center mb-8'>
									<button
										type='button'
										onClick={() =>
											handlePackageCountChange(
												packageCount - 1
											)
										}
										className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300'
										disabled={packageCount <= 1}
									>
										<Minus className='h-5 w-5 text-gray-700' />
									</button>

									<div className='mx-8 text-center'>
										<div className='text-5xl font-bold text-green-500'>
											{packageCount}
										</div>
										<div className='text-gray-500 mt-2'>
											{t('announcements.packages')}
										</div>
									</div>

									<button
										type='button'
										onClick={() =>
											handlePackageCountChange(
												packageCount + 1
											)
										}
										className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300'
									>
										<Plus className='h-5 w-5 text-gray-700' />
									</button>
								</div>

								<div className='flex flex-wrap justify-center gap-2 mb-8'>
									{Array.from({ length: packageCount }).map(
										(_, index) => (
											<div
												key={index}
												className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'
											>
												<Package className='h-6 w-6 text-green-500' />
											</div>
										)
									)}
								</div>

								<button
									type='button'
									onClick={proceedToAddressStep}
									className='px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
								>
									{t('announcements.continueToAddresses')}
								</button>
							</div>
						</div>
					)}

					{/* Étape 2: Saisie des adresses */}
					{step === 2 && (
						<div className='bg-white rounded-lg shadow-md p-6'>
							<h2 className='text-xl font-medium text-gray-800 mb-6'>
								{t('announcements.enterAddresses')}
							</h2>

							<div className='space-y-6'>
								{/* Adresse de départ */}
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										{t('announcements.startingPoint')}
									</label>
									<div className='flex items-center space-x-6 mb-4'>
										<label className='flex items-center space-x-2'>
											<input
												type='radio'
												name='startingType'
												value='address'
												checked={
													startingType === 'address'
												}
												onChange={() =>
													setStartingType('address')
												}
												className='h-4 w-4 text-green-500'
											/>
											<span>
												{t(
													'announcements.addressOption'
												)}
											</span>
										</label>
										<label className='flex items-center space-x-2'>
											<input
												type='radio'
												name='startingType'
												value='box'
												checked={startingType === 'box'}
												onChange={() =>
													setStartingType('box')
												}
												className='h-4 w-4 text-green-500'
											/>
											<span>
												{t('announcements.boxOption')}
											</span>
										</label>
									</div>
									{startingType === 'address' ? (
										<div className='relative'>
											<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
												<MapPin className='h-5 w-5 text-gray-400' />
											</div>
											<input
												type='text'
												id='startingAddress'
												value={startingAddress}
												onChange={(e) =>
													setStartingAddress(
														e.target.value
													)
												}
												onFocus={() =>
													startingAddress.length >=
														3 &&
													setShowStartingSuggestions(
														true
													)
												}
												className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
												placeholder={t(
													'announcements.enterStartingAddress'
												)}
											/>
											{isLoadingStartingSuggestions && (
												<div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
													<div className='animate-spin h-5 w-5 border-2 border-gray-300 border-t-green-500 rounded-full' />
												</div>
											)}
											{showStartingSuggestions &&
												startingSuggestions.length >
													0 && (
													<div
														ref={
															startingSuggestionsRef
														}
														className='absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto'
													>
														{startingSuggestions.map(
															(
																suggestion,
																index
															) => (
																<div
																	key={index}
																	className='px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center'
																	onClick={() =>
																		selectStartingAddress(
																			suggestion
																		)
																	}
																>
																	<MapPin className='h-4 w-4 text-gray-400 mr-2 flex-shrink-0' />
																	<span className='text-sm'>
																		{
																			suggestion.label
																		}
																	</span>
																</div>
															)
														)}
													</div>
												)}
										</div>
									) : (
										<select
											id='startingBox'
											name='startingBox'
											value={startingBox}
											onChange={(e) =>
												setStartingBox(e.target.value)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
										>
											<option value=''>
												{t(
													'common.selectYourStorageBox'
												)}
											</option>
											<option value='Storage box 1'>
												Storage box 1
											</option>
											<option value='Storage box 2'>
												Storage box 2
											</option>
											<option value='Storage box 3'>
												Storage box 3
											</option>
										</select>
									)}
								</div>

								{/* Adresse de destination */}
								<div className='relative'>
									<label
										htmlFor='destinationAddress'
										className='block text-sm font-medium text-gray-700 mb-1'
									>
										{t('announcements.whereTo')}
									</label>
									<div className='relative'>
										<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
											<MapPin className='h-5 w-5 text-gray-400' />
										</div>
										<input
											type='text'
											id='destinationAddress'
											value={destinationAddress}
											onChange={(e) =>
												setDestinationAddress(
													e.target.value
												)
											}
											onFocus={() =>
												destinationAddress.length >=
													3 &&
												setShowDestinationSuggestions(
													true
												)
											}
											className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
											placeholder={t(
												'announcements.enterDestinationAddress'
											)}
										/>
										{isLoadingDestinationSuggestions && (
											<div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
												<div className='animate-spin h-5 w-5 border-2 border-gray-300 border-t-green-500 rounded-full' />
											</div>
										)}
									</div>

									{/* Suggestions d'adresses de destination */}
									{showDestinationSuggestions &&
										destinationSuggestions.length > 0 && (
											<div
												ref={destinationSuggestionsRef}
												className='absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto'
											>
												{destinationSuggestions.map(
													(suggestion, index) => (
														<div
															key={index}
															className='px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center'
															onClick={() =>
																selectDestinationAddress(
																	suggestion
																)
															}
														>
															<MapPin className='h-4 w-4 text-gray-400 mr-2 flex-shrink-0' />
															<span className='text-sm'>
																{
																	suggestion.label
																}
															</span>
														</div>
													)
												)}
											</div>
										)}
								</div>

								<div className='flex justify-between pt-4'>
									<button
										type='button'
										onClick={goBackToPackageCount}
										className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
									>
										{t('common.back')}
									</button>
									<button
										type='button'
										onClick={proceedToDeliveryDateStep}
										className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
										disabled={
											startingType === 'address'
												? !startingAddress
												: !startingBox
										}
									>
										{t(
											'announcements.continueToDeliveryDate'
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Étape 3: Date de livraison */}
					{step === 3 && (
						<div className='bg-white rounded-lg shadow-md p-6'>
							<h2 className='text-xl font-medium text-gray-800 mb-6'>
								{t('announcements.deliveryDate')}
							</h2>

							<div className='mb-6'>
								<label
									htmlFor='deliveryDate'
									className='block text-sm font-medium text-gray-700 mb-2'
								>
									{t('announcements.selectDeliveryDate')}
								</label>
								<input
									type='date'
									id='deliveryDate'
									value={deliveryDate}
									min={new Date().toISOString().split('T')[0]}
									onChange={(e) =>
										setDeliveryDate(e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
								/>
							</div>

							<div className='flex justify-between pt-4'>
								<button
									type='button'
									onClick={goBackToAddressStep}
									className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
								>
									{t('common.back')}
								</button>
								<button
									type='button'
									onClick={proceedToPackageDetails}
									className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
									disabled={!deliveryDate}
								>
									{t('announcements.continueToDetails')}
								</button>
							</div>
						</div>
					)}

					{/* Étape 4: Contenu des colis */}
					{step === 4 && (
						<div className='bg-white rounded-lg shadow-md p-6'>
							<div className='flex justify-between items-center mb-6'>
								<h2 className='text-xl font-medium text-gray-800'>
									{t('announcements.packageDetails')}{' '}
									{currentPackage}/{packageCount}
								</h2>

								<div className='flex space-x-2'>
									<button
										type='button'
										onClick={goToPreviousPackage}
										disabled={currentPackage === 1}
										className='px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
									>
										{t('common.previous')}
									</button>
									<button
										type='button'
										onClick={goToNextPackage}
										disabled={
											currentPackage === packageCount
										}
										className='px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
									>
										{t('common.next')}
									</button>
								</div>
							</div>

							<form onSubmit={handleSubmit} className='space-y-6'>
								{packages.map((pkg, index) => (
									<div
										key={index}
										className={
											index + 1 === currentPackage
												? 'block'
												: 'hidden'
										}
									>
										<div className='flex flex-col items-center mb-8'>
											<div className='w-64 h-64 mb-2 relative'>
												{pkg.imagePreview ? (
													<img
														src={pkg.imagePreview}
														alt={`Package ${
															index + 1
														} preview`}
														className='w-full h-full object-contain'
													/>
												) : (
													<div className='w-full h-full flex items-center justify-center bg-gray-100 rounded-md'>
														<span className='text-gray-400'>
															{t(
																'announcements.noImage'
															)}
														</span>
													</div>
												)}
											</div>
											<label
												htmlFor={`photo-upload-${index}`}
												className='text-green-500 hover:text-green-600 cursor-pointer text-sm'
											>
												{pkg.imagePreview
													? t(
															'announcements.editPhoto'
													  )
													: t(
															'announcements.addPhoto'
													  )}
												<input
													id={`photo-upload-${index}`}
													type='file'
													accept='image/*'
													className='hidden'
													onChange={(e) =>
														handleImageChange(
															e,
															index
														)
													}
												/>
											</label>
										</div>

										<div>
											<label
												htmlFor={`name-${index}`}
												className='block text-sm font-medium text-gray-700 mb-1'
											>
												{t('announcements.packageName')}
											</label>
											<input
												type='text'
												id={`name-${index}`}
												value={pkg.name}
												onChange={(e) =>
													handlePackageChange(
														index,
														'name',
														e.target.value
													)
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
											/>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-8'>
											<div>
												<label
													htmlFor={`price-${index}`}
													className='block text-sm font-medium text-gray-700 mb-1'
												>
													{t('announcements.price')}
												</label>
												<div className='relative'>
													<span className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500'>
														€
													</span>
													<input
														type='number'
														id={`price-${index}`}
														value={pkg.price}
														onChange={(e) =>
															handlePackageChange(
																index,
																'price',
																Number(
																	e.target
																		.value
																)
															)
														}
														min='0'
														step='0.01'
														className='w-full pl-8 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
													/>
												</div>
											</div>

											<div>
												<label
													htmlFor={`weight-${index}`}
													className='block text-sm font-medium text-gray-700 mb-1'
												>
													{t('announcements.weight')}
												</label>
												<div className='relative'>
													<input
														type='number'
														id={`weight-${index}`}
														value={pkg.weight}
														onChange={(e) =>
															handlePackageChange(
																index,
																'weight',
																Number(
																	e.target
																		.value
																)
															)
														}
														min='0'
														step='0.1'
														className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
													/>
													<span className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500'>
														kg
													</span>
												</div>
											</div>
										</div>

										<div className='mt-8'>
											<label
												htmlFor={`packageSize-${index}`}
												className='block text-sm font-medium text-gray-700 mb-1'
											>
												{t('announcements.packageSize')}
											</label>
											<select
												id={`packageSize-${index}`}
												value={pkg.packageSize}
												onChange={(e) =>
													handlePackageChange(
														index,
														'packageSize',
														e.target.value
													)
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
											>
												<option value=''>
													{t(
														'common.selectYourPackageSize'
													)}
												</option>
												<option value='Small'>
													Small
												</option>
												<option value='Medium'>
													Medium
												</option>
												<option value='Large'>
													Large
												</option>
											</select>
										</div>

										<div className='flex items-center mt-8'>
											<input
												type='checkbox'
												id={`priorityShipping-${index}`}
												checked={pkg.priorityShipping}
												onChange={() =>
													togglePriorityShipping(
														index
													)
												}
												className='h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded'
											/>
											<label
												htmlFor={`priorityShipping-${index}`}
												className='ml-2 block text-sm text-gray-700'
											>
												{t(
													'announcements.activatePriorityShipping'
												)}
											</label>
										</div>

										<div className='bg-yellow-50 p-3 rounded-md text-sm text-yellow-800'>
											{t(
												'announcements.priorityShippingInfo'
											)}
										</div>
									</div>
								))}

								<div className='flex justify-between space-x-4 mt-8'>
									<button
										type='button'
										onClick={goBackToDeliveryDateStep}
										className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
									>
										{t('common.back')}
									</button>
									<button
										type='submit'
										className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50'
										disabled={
											isSubmitting || !isFormValid()
										}
									>
										{isSubmitting
											? t('common.adding')
											: t('announcements.addNow')}
									</button>
								</div>
							</form>
						</div>
					)}
				</div>
			</main>
		</ClientLayout>
	);
}
