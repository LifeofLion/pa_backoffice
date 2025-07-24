import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, getErrorMessage } from '@/src/lib/api';
import { API_ROUTES } from '@/src/lib/api-routes';
import { trackingWebSocketService } from '@/src/services/tracking/websocket-service';
import { useAuth } from './use-auth';
import { getUserRole } from '@/src/types';

// =============================================================================
// TYPES POUR LES LIVREURS
// =============================================================================

// Types pour les réponses API
interface ApiLivraisonsResponse {
	livraisons?: {
		data: any[];
		meta?: any;
	};
	data?: any[];
	[key: string]: any;
}

export interface Livraison {
	id: string;
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
	pickupLocation: string;
	dropoffLocation: string;
	clientId: string;
	client: {
		name: string;
		phone?: string;
		address: string;
	};
	colis: {
		id: string;
		description: string;
		weight: number;
		status: string;
	}[];
	estimatedDeliveryTime?: string;
	amount?: number;
	title?: string;
	priority?: string | boolean;
	annonce?: {
		id: number;
		title: string;
		description?: string;
		price: number;
		desired_date?: string;
		start_location: string;
		end_location: string;
		priority: boolean;
		status: string;
	};
}

export interface LivreurPosition {
	latitude: number;
	longitude: number;
	accuracy?: number;
	speed?: number;
	heading?: number;
	timestamp: string;
}

export interface AvailableLivraison {
	id: string;
	pickupLocation: string;
	dropoffLocation: string;
	distance: number;
	estimatedDuration: number;
	amount: number;
	packageCount: number;
	priority: 'normal' | 'urgent';
	scheduledDate: string;
}

// =============================================================================
// HOOK POUR LES LIVREURS
// =============================================================================

export function useDeliveryman() {
	const { user } = useAuth();
	const [myLivraisons, setMyLivraisons] = useState<Livraison[]>([]);
	const [availableLivraisons, setAvailableLivraisons] = useState<
		AvailableLivraison[]
	>([]);
	const [currentPosition, setCurrentPosition] =
		useState<LivreurPosition | null>(null);
	const [isAvailable, setIsAvailable] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [wsConnected, setWsConnected] = useState(false);

	// Références pour le suivi GPS
	const positionWatchRef = useRef<number | null>(null);
	const positionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// =============================================================================
	// GESTION DES LIVRAISONS
	// =============================================================================

	const loadMyLivraisons = useCallback(async () => {
		if (!user) return;

		try {
			setLoading(true);
			const userRole = getUserRole(user);

			if (userRole !== 'delivery_man') {
				setError('Accès réservé aux livreurs');
				return;
			}

			if (!user.livreur?.id) {
				setError('ID livreur manquant');
				return;
			}

			const response = (await apiClient.get(
				`${API_ROUTES.DELIVERYMAN.LIVRAISONS(
					user.livreur.id.toString()
				)}?include=annonce,client,colis`
			)) as ApiLivraisonsResponse;

			const livraisonsData =
				response.livraisons?.data ||
				response.data ||
				(Array.isArray(response) ? response : []);
			if (!Array.isArray(livraisonsData)) {
				setError('Format de données invalide reçu du serveur');
				return;
			}

			const transformedLivraisons: Livraison[] = livraisonsData.map(
				(livraison: any) => {
					let pickupLocation = 'Adresse de récupération';
					let dropoffLocation = 'Adresse de livraison';
					let amount = livraison.amount || 0;
					let estimatedDeliveryTime =
						livraison.estimatedDeliveryTime ||
						livraison.estimated_delivery_time;
					let title = `Livraison #${livraison.id || 'N/A'}`;

					if (livraison.annonce) {
						console.log(
							"📍 Utilisation des données de l'annonce directe"
						);
						console.log(
							'💰 Prix annonce:',
							livraison.annonce.price
						);

						pickupLocation =
							livraison.annonce.start_location ||
							livraison.annonce.startLocation ||
							pickupLocation;
						dropoffLocation =
							livraison.annonce.end_location ||
							livraison.annonce.endLocation ||
							dropoffLocation;
						amount = Number(livraison.annonce.price) || amount;
						estimatedDeliveryTime =
							livraison.annonce.desired_date ||
							livraison.annonce.desiredDate ||
							estimatedDeliveryTime;
						title = livraison.annonce.title || title;
					}

					// Si pas d'annonce directe, essayer via les colis (fallback)
					else if (
						livraison.colis &&
						livraison.colis.length > 0 &&
						livraison.colis[0].annonce
					) {
						console.log(
							"📍 Utilisation des données de l'annonce via colis"
						);
						const annonceViaColis = livraison.colis[0].annonce;
						console.log(
							'💰 Prix annonce via colis:',
							annonceViaColis.price
						);

						pickupLocation =
							annonceViaColis.start_location ||
							annonceViaColis.startLocation ||
							pickupLocation;
						dropoffLocation =
							annonceViaColis.end_location ||
							annonceViaColis.endLocation ||
							dropoffLocation;
						amount = Number(annonceViaColis.price) || amount;
						estimatedDeliveryTime =
							annonceViaColis.desired_date ||
							annonceViaColis.desiredDate ||
							estimatedDeliveryTime;
						title = annonceViaColis.title || title;
					}

					// Utiliser le prix de la livraison si disponible (priorité)
					if (livraison.price) {
						amount = Number(livraison.price);
					}

					// Utiliser les adresses de la livraison si disponibles (fallback final)
					if (livraison.pickupLocation || livraison.pickup_location) {
						pickupLocation =
							livraison.pickupLocation ||
							livraison.pickup_location;
					}
					if (
						livraison.dropoffLocation ||
						livraison.dropoff_location
					) {
						dropoffLocation =
							livraison.dropoffLocation ||
							livraison.dropoff_location;
					}

					console.log('✅ Données finales transformées:', {
						title,
						pickupLocation,
						dropoffLocation,
						amount,
						estimatedDeliveryTime,
					});

					return {
						id: livraison.id ? livraison.id.toString() : '',
						status: livraison.status,
						pickupLocation,
						dropoffLocation,
						clientId:
							livraison.clientId?.toString() ||
							livraison.client_id?.toString() ||
							'',
						client: {
							name: livraison.client
								? `${
										livraison.client.user?.first_name ||
										livraison.client.first_name ||
										''
								  } ${
										livraison.client.user?.last_name ||
										livraison.client.last_name ||
										''
								  }`.trim() ||
								  `${livraison.client.firstName || ''} ${
										livraison.client.lastName || ''
								  }`.trim() ||
								  'Client'
								: 'Client',
							phone:
								livraison.client?.user?.phone_number ||
								livraison.client?.phone_number ||
								livraison.client?.phone,
							address: dropoffLocation,
						},
						colis:
							livraison.colis?.map((coli: any) => ({
								id: coli.id ? coli.id.toString() : '',
								description: coli.description || 'Colis',
								weight: coli.weight || 0,
								status: coli.status || 'pending',
							})) || [],
						amount,
						estimatedDeliveryTime,
						title,
						priority:
							livraison.annonce?.priority ||
							(livraison.colis &&
								livraison.colis[0]?.annonce?.priority) ||
							'normal',
					};
				}
			);

			setMyLivraisons(transformedLivraisons);
			setError(null);
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			setError(`Erreur chargement livraisons: ${errorMessage}`);
			setMyLivraisons([]);
		} finally {
			setLoading(false);
		}
	}, [user]);

	const loadAvailableLivraisons = useCallback(async () => {
		if (!user) return;

		try {
			const response = (await apiClient.get(
				API_ROUTES.DELIVERYMAN.AVAILABLE_LIVRAISONS
			)) as ApiLivraisonsResponse;

			const availableData =
				response.livraisons?.data ||
				response.data ||
				(Array.isArray(response) ? response : []);
			if (!Array.isArray(availableData)) {
				setAvailableLivraisons([]);
				return;
			}

			const transformedAvailable: AvailableLivraison[] =
				availableData.map((livraison: any) => ({
					id: livraison.id.toString(),
					pickupLocation:
						livraison.pickupLocation ||
						livraison.pickup_location ||
						'Adresse de récupération',
					dropoffLocation:
						livraison.dropoffLocation ||
						livraison.dropoff_location ||
						'Adresse de livraison',
					distance: livraison.distance || 0,
					estimatedDuration:
						livraison.estimatedDuration ||
						livraison.estimated_duration ||
						60,
					amount: livraison.amount || 0,
					packageCount:
						livraison.colis?.length || livraison.package_count || 1,
					priority: livraison.priority || 'normal',
					scheduledDate:
						livraison.scheduledDate ||
						livraison.scheduled_date ||
						new Date().toISOString(),
				}));

			setAvailableLivraisons(transformedAvailable);
		} catch (error) {
			setAvailableLivraisons([]);
		}
	}, [user]);

	// =============================================================================
	// GESTION DES STATUTS DE LIVRAISON
	// =============================================================================

	const acceptLivraison = useCallback(
		async (livraisonId: string) => {
			if (!user?.livreur?.id) return;

			try {
				setLoading(true);

				const acceptResponse = await apiClient.post(
					API_ROUTES.DELIVERYMAN.ACCEPT_LIVRAISON(
						user.livreur.id.toString(),
						livraisonId
					)
				);

				const livraisonDetails = (await apiClient.get(
					API_ROUTES.DELIVERY.BY_ID(livraisonId)
				)) as any;
				const clientId =
					livraisonDetails.client?.utilisateur_id ||
					livraisonDetails.client_id;

				if (clientId) {
					try {
						const messageData = {
							senderId: user.id,
							receiverId: clientId,
							content: `Bonjour, je suis votre livreur pour la commande #${livraisonId}. Je viens d'accepter votre livraison et je vais bientôt récupérer votre colis. N'hésitez pas à me contacter si vous avez des questions.`,
							tempId: `auto_${Date.now()}`,
						};

						await apiClient.sendMessage(messageData);
					} catch (msgError) {
						console.error(
							'⚠️ Erreur création conversation (non bloquant):',
							msgError
						);
					}
				}

				if (
					livraisonDetails.colis &&
					Array.isArray(livraisonDetails.colis)
				) {
					for (const colis of livraisonDetails.colis) {
						try {
							const trackingNumber =
								colis.tracking_number ||
								colis.trackingNumber ||
								`ECO-${colis.id}`;
							await apiClient.updatePackageLocation(
								trackingNumber,
								{
									status: 'in_transit',
									location: 'Pris en charge par le livreur',
									livreur_id: user.livreur.id,
								}
							);
						} catch (colisError) {
							console.error(
								'⚠️ Erreur mise à jour colis (non bloquant):',
								colisError
							);
						}
					}
				}

				await loadMyLivraisons();
				await loadAvailableLivraisons();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				setError(`Erreur acceptation livraison: ${errorMessage}`);
			} finally {
				setLoading(false);
			}
		},
		[user, loadMyLivraisons, loadAvailableLivraisons]
	);

	const updateLivraisonStatus = useCallback(
		async (
			livraisonId: string,
			newStatus: 'in_progress' | 'completed' | 'cancelled',
			location?: { latitude: number; longitude: number }
		) => {
			if (!user?.livreur?.id) return;

			try {
				setLoading(true);

				const updateData: any = { status: newStatus };
				if (location) {
					updateData.latitude = location.latitude;
					updateData.longitude = location.longitude;
					updateData.timestamp = new Date().toISOString();
				}

				await apiClient.put(
					API_ROUTES.DELIVERYMAN.UPDATE_LIVRAISON_STATUS(
						user.livreur.id.toString(),
						livraisonId
					),
					updateData
				);
				await loadMyLivraisons();
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				setError(`Erreur mise à jour statut: ${errorMessage}`);
			} finally {
				setLoading(false);
			}
		},
		[user, loadMyLivraisons]
	);

	// =============================================================================
	// GESTION DE LA POSITION GPS
	// =============================================================================

	const startLocationTracking = useCallback(() => {
		if (!navigator.geolocation) {
			setError('Géolocalisation non supportée par ce navigateur');
			return;
		}

		const options = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 60000,
		};

		// Démarrer le suivi de position
		positionWatchRef.current = navigator.geolocation.watchPosition(
			(position) => {
				const newPosition: LivreurPosition = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					accuracy: position.coords.accuracy,
					speed: position.coords.speed || 0,
					heading: position.coords.heading || 0,
					timestamp: new Date().toISOString(),
				};

				setCurrentPosition(newPosition);
				console.log('📍 Nouvelle position GPS:', newPosition);

				// Envoyer la position au backend via WebSocket si connecté
				if (wsConnected && user?.livreur?.id) {
					trackingWebSocketService.reportDetour({
						livraisonId: 'current', // ou l'ID de la livraison en cours
						currentLocation: newPosition,
						reason: 'position_update',
					});
				}
			},
			(error) => {
				console.error('❌ Erreur géolocalisation:', error);
				setError('Impossible de récupérer la position GPS');
			},
			options
		);

		// Envoyer la position au backend toutes les 30 secondes
		positionUpdateIntervalRef.current = setInterval(async () => {
			if (currentPosition && user?.livreur?.id) {
				try {
					await apiClient.post(
						`/tracking/livreur/${user.livreur.id}/update-position`,
						{
							latitude: currentPosition.latitude,
							longitude: currentPosition.longitude,
							accuracy: currentPosition.accuracy,
							speed: currentPosition.speed,
							heading: currentPosition.heading,
							timestamp: currentPosition.timestamp,
						}
					);
				} catch (error) {
					console.error('❌ Erreur envoi position:', error);
				}
			}
		}, 30000); // 30 secondes

		console.log('🎯 Suivi GPS démarré');
	}, [wsConnected, user, currentPosition]);

	const stopLocationTracking = useCallback(() => {
		if (positionWatchRef.current) {
			navigator.geolocation.clearWatch(positionWatchRef.current);
			positionWatchRef.current = null;
		}

		if (positionUpdateIntervalRef.current) {
			clearInterval(positionUpdateIntervalRef.current);
			positionUpdateIntervalRef.current = null;
		}

		console.log('⏹️ Suivi GPS arrêté');
	}, []);

	// =============================================================================
	// GESTION DE LA DISPONIBILITÉ
	// =============================================================================

	const updateAvailability = useCallback(
		async (available: boolean) => {
			if (!user?.livreur?.id) return;

			try {
				await apiClient.put(
					API_ROUTES.DELIVERYMAN.UPDATE_AVAILABILITY(
						user.livreur.id.toString()
					),
					{
						availabilityStatus: available ? 'available' : 'offline',
					}
				);

				setIsAvailable(available);

				if (available) {
					startLocationTracking();
					await loadAvailableLivraisons();
				} else {
					stopLocationTracking();
				}

				console.log('✅ Disponibilité mise à jour:', available);
			} catch (error) {
				const errorMessage = getErrorMessage(error);
				setError(`Erreur mise à jour disponibilité: ${errorMessage}`);
				console.error('❌ Erreur mise à jour disponibilité:', error);
			}
		},
		[
			user,
			startLocationTracking,
			stopLocationTracking,
			loadAvailableLivraisons,
		]
	);

	// =============================================================================
	// GESTION DU WEBSOCKET - TEMPORAIREMENT DÉSACTIVÉ
	// =============================================================================

	useEffect(() => {
		// 🚫 WEBSOCKET TEMPORAIREMENT DÉSACTIVÉ pour éviter les erreurs en boucle
		// TODO: Réactiver quand le backend sera stable

		console.log(
			'🔌 WebSocket temporairement désactivé pour éviter les erreurs'
		);
		setWsConnected(false);

		return () => {
			stopLocationTracking();
			setWsConnected(false);
		};
	}, [user, stopLocationTracking]);

	// =============================================================================
	// CHARGEMENT INITIAL - SANS MODE FALLBACK
	// =============================================================================

	useEffect(() => {
		if (user && getUserRole(user) === 'delivery_man') {
			console.log(
				'👤 Utilisateur livreur détecté, chargement des données...'
			);

			// Charger les données réelles uniquement
			loadMyLivraisons();
			loadAvailableLivraisons();

			// Récupérer le statut de disponibilité actuel
			if (user.livreur?.availabilityStatus === 'available') {
				setIsAvailable(true);
			}
		}
	}, [user, loadMyLivraisons, loadAvailableLivraisons]);

	return {
		// Données
		myLivraisons,
		availableLivraisons,
		currentPosition,
		isAvailable,
		loading,
		error,
		wsConnected,

		// Actions
		acceptLivraison,
		updateLivraisonStatus,
		updateAvailability,
		startLocationTracking,
		stopLocationTracking,
		refreshData: () => {
			loadMyLivraisons();
			loadAvailableLivraisons();
		},
		clearError: () => setError(null),

		// Utilitaires
		isDeliveryman: user ? getUserRole(user) === 'delivery_man' : false,
		hasActiveDeliveries: myLivraisons.some(
			(l) => l.status === 'in_progress'
		),
		todayDeliveries: myLivraisons.filter((l) => {
			const today = new Date().toDateString();
			const deliveryDate = new Date(
				l.estimatedDeliveryTime || ''
			).toDateString();
			return deliveryDate === today;
		}),
	};
}
