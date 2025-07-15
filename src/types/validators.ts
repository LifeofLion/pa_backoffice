// =============================================================================
// TYPES DE VALIDATION FRONTEND - ALIGNÉS SUR VALIDATORS BACKEND
// =============================================================================

// Types exacts correspondant aux validators backend utilisés dans l'application
// Note: Le backend mélange snake_case et camelCase selon les validators

// =============================================================================
// AUTHENTIFICATION - UTILISÉS ✅
// =============================================================================

export interface LoginRequest {
	email: string; // vine.string().email().toLowerCase()
	password: string; // vine.string().minLength(6).maxLength(20)
}

export interface RegisterRequest {
	first_name: string; // vine.string().minLength(3).maxLength(50)
	last_name: string; // vine.string().minLength(3).maxLength(50)
	email: string; // vine.string().email().toLowerCase()
	address?: string | null; // vine.string().minLength(3).maxLength(255).nullable().optional()
	city: string; // vine.string().minLength(2).maxLength(100)
	postalCode: string; // vine.string().minLength(2).maxLength(20) - ATTENTION: camelCase dans validator
	country: string; // vine.string().minLength(2).maxLength(50)
	password: string; // vine.string().minLength(6).maxLength(20)
	confirm_password: string; // vine.string().minLength(6).maxLength(20)
	phone_number?: string | null; // vine.string().nullable().optional()
}

export interface CheckPasswordRequest {
	email: string; // vine.string().email().toLowerCase()
	password: string; // vine.string().minLength(6).maxLength(20)
}

// =============================================================================
// UTILISATEUR - UTILISÉS ✅
// =============================================================================

export interface UserUpdateRequest {
	first_name?: string; // vine.string().minLength(3).maxLength(50).optional()
	last_name?: string; // vine.string().minLength(3).maxLength(50).optional()
	address?: string | null; // vine.string().minLength(3).maxLength(255).nullable().optional()
	city?: string; // vine.string().minLength(2).maxLength(100).optional()
	postalCode?: string; // vine.string().minLength(2).maxLength(20).optional() - ATTENTION: camelCase
	country?: string; // vine.string().minLength(2).maxLength(100).optional()
	password?: string; // vine.string().minLength(6).maxLength(20).optional()
	phone_number?: string | null; // vine.string().nullable().optional()
}

// =============================================================================
// ADMIN - UTILISÉS ✅
// =============================================================================

export interface AdminUserCreationRequest {
	first_name: string; // vine.string().trim().minLength(2).maxLength(50)
	last_name: string; // vine.string().trim().minLength(2).maxLength(50)
	email: string; // vine.string().email().normalizeEmail()
	password: string; // vine.string().minLength(8).maxLength(100)
	phone_number?: string | null; // vine.string().optional().nullable()
	address?: string | null; // vine.string().optional().nullable()
	city: string; // vine.string().trim().minLength(2).maxLength(100)
	postalCode: string; // vine.string().trim().minLength(2).maxLength(20) - ATTENTION: camelCase
	country: string; // vine.string().trim().minLength(2).maxLength(100)
	roles?: ('livreur' | 'commercant' | 'prestataire' | 'administrateur')[]; // vine.array(vine.enum(...)).optional().nullable()
	privileges?: 'basic' | 'advanced' | 'super'; // vine.enum(['basic', 'advanced', 'super']).optional().nullable()
}

// =============================================================================
// ANNONCES - UTILISÉS ✅
// =============================================================================

export interface CreateAnnouncementRequest {
	utilisateur_id: number; // vine.number()
	title: string; // vine.string().minLength(3).maxLength(50)
	description?: string; // vine.string().minLength(10).maxLength(500).optional()
	price: number; // vine.number()
	tags?: string[]; // vine.array(vine.string()).optional()
	type?: 'transport_colis' | 'service_personne'; // vine.enum(['transport_colis', 'service_personne']).optional()
	status?: 'active' | 'pending' | 'completed' | 'cancelled'; // vine.enum(['active', 'pending', 'completed', 'cancelled']).optional()
	desired_date?: string; // vine.string().optional() - NOUVEAU: remplace scheduled_date
	actual_delivery_date?: string; // vine.string().optional()
	end_location?: string; // vine.string().optional() - NOUVEAU: remplace destination_address
	start_location?: string; // vine.string().optional() - NOUVEAU: remplace starting_address
	priority?: boolean; // vine.boolean().optional()
	storage_box_id?: string; // vine.string().optional()
	image_path?: string; // vine.string().optional()
	insurance_amount?: number; // vine.number().optional() - NOUVEAU
}

export interface UpdateAnnouncementRequest {
	title?: string; // vine.string().minLength(3).maxLength(50).optional()
	description?: string; // vine.string().minLength(10).maxLength(500).optional()
	price: number; // vine.number()
	type?: 'transport_colis' | 'service_personne'; // vine.enum(['transport_colis', 'service_personne']).optional()
	status?: 'active' | 'pending' | 'completed' | 'cancelled'; // vine.enum(['active', 'pending', 'completed', 'cancelled']).optional()
	desired_date?: string; // vine.string().optional() - NOUVEAU: remplace scheduled_date
	actual_delivery_date?: string; // vine.string().optional()
	end_location?: string; // vine.string().optional() - NOUVEAU: remplace destination_address
	start_location?: string; // vine.string().optional() - NOUVEAU: remplace starting_address
	priority?: boolean; // vine.boolean().optional()
	storage_box_id?: string; // vine.string().optional()
	insurance_amount?: number; // vine.number().optional() - NOUVEAU
}

// =============================================================================
// RÉCLAMATIONS - UTILISÉS ✅
// =============================================================================

export interface CreateComplaintRequest {
	utilisateur_id: number; // vine.number().positive()
	subject: string; // vine.string().minLength(3).maxLength(255)
	description: string; // vine.string().minLength(10)
	priority?: 'low' | 'medium' | 'high' | 'urgent'; // vine.enum(['low', 'medium', 'high', 'urgent']).optional()
	related_order_id?: string; // vine.string().optional()
}

export interface UpdateComplaintRequest {
	subject?: string; // vine.string().minLength(3).maxLength(255).optional()
	description?: string; // vine.string().minLength(10).optional()
	status?: 'open' | 'in_progress' | 'resolved' | 'closed'; // vine.enum(['open', 'in_progress', 'resolved', 'closed']).optional()
	priority?: 'low' | 'medium' | 'high' | 'urgent'; // vine.enum(['low', 'medium', 'high', 'urgent']).optional()
	admin_notes?: string; // vine.string().optional()
}

export interface ComplaintData {
	id: number;
	utilisateurId: number;
	subject: string;
	description: string;
	status: 'open' | 'in_progress' | 'resolved' | 'closed';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	relatedOrderId: string | null;
	imagePath: string | null;
	adminNotes: string | null;
	createdAt: string;
	updatedAt: string;

	// Relation utilisateur chargée via preload
	utilisateur?: UserData;
}

export interface ComplaintTransformed {
	id: number;
	client: string;
	email: string;
	announceId: string;
	subject: string;
	description: string;
	status: 'open' | 'in_progress' | 'resolved' | 'closed';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	adminNotes: string | null;
	createdAt: string;
	updatedAt: string;
	userId: number;
}

// Interfaces pour les réponses API
export interface ComplaintsApiResponse {
	status: 'success' | 'error';
	complaints?: ComplaintData[];
	message?: string;
}

export interface ComplaintApiResponse {
	status: 'success' | 'error';
	complaint?: ComplaintData;
	message?: string;
}

// =============================================================================
// MESSAGES - UTILISÉS PAS TOUCHE C'EST BON
// =============================================================================

export interface SendMessageRequest {
	senderId: number; // vine.number().min(1) - ATTENTION: camelCase dans validator
	receiverId: number; // vine.number().min(1) - ATTENTION: camelCase dans validator
	content: string; // vine.string().minLength(1)
	tempId?: string; // vine.string().optional()
}

// =============================================================================
// JUSTIFICATIONS - UTILISÉS ✅
// =============================================================================

export interface JustificationPieceRequest {
	utilisateur_id: number; // vine.number().positive()
	document_type: string; // vine.string().minLength(2).maxLength(255)
	account_type: 'livreur' | 'commercant' | 'prestataire'; // vine.enum(['livreur', 'commercant', 'prestataire'])
	file?: File; // FormData file upload
}

export interface JustificationPieceData {
	id: number;
	utilisateur_id: number;
	document_type: string;
	file_path: string;
	account_type: 'livreur' | 'commercant' | 'prestataire';
	verification_status: 'pending' | 'verified' | 'rejected';
	uploaded_at: string | null;
	verified_at: string | null;
	createdAt: string;
	updatedAt: string;

	// Relation utilisateur (chargée via preload)
	utilisateur?: UserData;
}

export interface JustificationReviewRequest {
	comments?: string; // vine.string().optional()
}

// Interface pour les données transformées utilisées dans le frontend
export interface JustificationPieceTransformed {
	id: number;
	utilisateur_id: number;
	document_type: string;
	file_path: string;
	account_type: 'livreur' | 'commercant' | 'prestataire';
	verification_status: 'pending' | 'verified' | 'rejected';
	uploaded_at: string | null;
	verified_at: string | null;
	createdAt: string;
	updatedAt: string;

	// Propriétés extraites et calculées pour l'affichage
	firstName: string;
	lastName: string;
	email: string;
	fileName: string;
	submittedAt: string | null;
	reviewedAt: string | null;
	reviewComments?: string;
	reviewedBy?: string;
}

// =============================================================================
// UTILISATEURS - UTILISÉS ✅
// =============================================================================

export interface UserData {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	address: string | null;
	city: string;
	postalCode: string;
	country: string;
	phone_number: string | null;
	state: 'open' | 'banned' | 'closed';
	createdAt: string;
	updatedAt: string | null;

	// Relations optionnelles
	admin?: any;
	client?: any;
	livreur?: any;
	prestataire?: any;
	commercant?: any;
}

// =============================================================================
// TYPES DE RÉPONSE API SPÉCIFIQUES - UTILISÉS ✅
// =============================================================================

export interface JustificationPiecesApiResponse {
	status: 'success' | 'error';
	data: JustificationPieceData[];
	message?: string;
}

export interface JustificationVerifyApiResponse {
	status: 'success' | 'error';
	message: string;
	data?:
		| {
				validatedDocuments?: number;
				reason?: string;
		  }
		| JustificationPieceData;
}

export interface UsersApiResponse {
	status: 'success' | 'error';
	data?: UserData[];
	users?: UserData[];
	message?: string;
}

export interface AdminDashboardStatsResponse {
	status: 'success' | 'error';
	data: {
		totalUsers: number;
		totalDeliveries: number;
		totalComplaints: number;
		totalRevenue: number;
		recentUsers: UserData[];
	};
	message?: string;
}

// =============================================================================
// TYPES DE RÉPONSE GÉNÉRIQUES - UTILISÉS ✅
// =============================================================================

export interface BackendSuccessResponse<T = any> {
	data?: T;
	message?: string;
	[key: string]: any;
}

export interface BackendErrorResponse {
	error_message: string;
	error?: any;
	message?: string;
}

// =============================================================================
// STRIPE
// =============================================================================

export interface StripeSubscribeRequest {
	planId: string; // vine.string().trim().minLength(1)
	priceId: string; // vine.string().trim().minLength(1)
	customerId?: string; // vine.string().optional()
}

export interface StripePaymentIntentRequest {
	amount: number; // vine.number().positive()
	currency?: string; // vine.string().optional() (défaut: 'eur')
	deliveryId?: string; // vine.string().optional()
	serviceId?: string; // vine.string().optional()
	description?: string; // vine.string().optional()
}

export interface StripeConnectedAccountRequest {
	email: string; // vine.string().email()
	country?: string; // vine.string().optional() (défaut: 'FR')
	accountType?: 'individual' | 'company'; // vine.enum(['individual', 'company']).optional()
}

export interface StripeDeliveryPaymentRequest {
	amount: number; // vine.number().positive()
	deliveryId: string; // vine.string().trim().minLength(1)
	livreurStripeAccountId: string; // vine.string().trim().minLength(1)
	commission?: number; // vine.number().optional() (défaut: 5%)
}

export interface StripeServicePaymentRequest {
	amount: number; // vine.number().positive()
	serviceId: string; // vine.string().trim().minLength(1)
	prestataireFeeAccountId: string; // vine.string().trim().minLength(1)
	commission?: number; // vine.number().optional() (défaut: 8%)
}

export interface StripeTransferRequest {
	amount: number; // vine.number().positive()
	destinationAccountId: string; // vine.string().trim().minLength(1)
	transferDescription?: string; // vine.string().optional()
}

export interface StripeInvoiceRequest {
	customerId: string; // vine.string().trim().minLength(1)
	items: Array<{
		// vine.array(vine.object(...))
		description: string; // vine.string().trim().minLength(1)
		amount: number; // vine.number().positive()
		quantity?: number; // vine.number().positive().optional()
	}>;
	dueDate?: string; // vine.string().optional()
}

export interface StripeRefundRequest {
	paymentIntentId: string; // vine.string().trim().minLength(1)
	amount?: number; // vine.number().positive().optional()
	reason?: string; // vine.string().optional()
}

export interface StripeWebhookPayload {
	id: string; // vine.string().trim().minLength(1)
	object: string; // vine.string().trim()
	type: string; // vine.string().trim()
	data: {
		// vine.object()
		object: any; // Données Stripe variables selon l'événement
	};
	created: number; // vine.number()
	livemode: boolean; // vine.boolean()
}

// =============================================================================
// 🚀 NOUVEAU: TYPES STRIPE CONNECT (ALIGNÉS SUR BACKEND)
// =============================================================================

export interface StripeConnectOnboardingRequest {
	returnUrl?: string; // vine.string().url().optional()
	refreshUrl?: string; // vine.string().url().optional()
}

export interface StripeConnectTransferRequest {
	montant: number; // vine.number().positive().min(1)
	description?: string; // vine.string().maxLength(255).optional()
}

export interface StripeConnectPayoutConfigRequest {
	schedule: 'manual' | 'daily' | 'weekly' | 'monthly'; // vine.enum(['manual', 'daily', 'weekly', 'monthly'])
	delayDays?: number; // vine.number().min(0).max(30).optional()
}

// Réponses API Stripe Connect
export interface StripeConnectAccountResponse {
	success: boolean;
	data?: {
		has_account: boolean;
		stripe_account_id?: string;
		charges_enabled?: boolean;
		payouts_enabled?: boolean;
		details_submitted?: boolean;
		requirements?: any;
		ready_for_payouts?: boolean;
	};
	message?: string;
}

export interface StripeConnectOnboardingResponse {
	success: boolean;
	data?: {
		onboarding_url: string;
		account_id: string;
	};
	message?: string;
}

export interface StripeConnectTransferResponse {
	success: boolean;
	data?: {
		transfer_id: string;
		amount: number;
		status: string;
		estimated_arrival?: string;
	};
	message?: string;
}

export interface StripeConnectDashboardResponse {
	success: boolean;
	data?: {
		dashboard_url: string;
	};
	message?: string;
}

// Réponses API Stripe
export interface StripeSubscriptionResponse {
	subscription?: {
		id: string;
		status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing';
		current_period_start: number;
		current_period_end: number;
		plan: {
			id: string;
			nickname: string;
			amount: number;
			currency: string;
			interval: 'month' | 'year';
		};
	};
	error?: string;
}

export interface StripePaymentIntentResponse {
	paymentIntent?: {
		id: string;
		status:
			| 'requires_payment_method'
			| 'requires_confirmation'
			| 'requires_action'
			| 'processing'
			| 'requires_capture'
			| 'canceled'
			| 'succeeded';
		client_secret: string;
		amount: number;
		currency: string;
	};
	error?: string;
}

export interface StripeConnectedAccountResponse {
	account?: {
		id: string;
		charges_enabled: boolean;
		payouts_enabled: boolean;
		details_submitted: boolean;
		onboarding_link?: string;
	};
	error?: string;
}

// =============================================================================
// TYPES DE STATUTS STANDARDISÉS SELON LE CAHIER DES CHARGES
// =============================================================================

/**
 * Statuts de paiement standardisés pour l'ensemble du système
 * Basés sur le workflow du cahier des charges page 15
 */
export type PaymentStatus =
	| 'unpaid' // Pas encore payé
	| 'authorized' // Paiement autorisé (en escrow) - argent bloqué chez Stripe
	| 'pending' // En attente de validation par code (fonds dans portefeuille en attente)
	| 'paid' // Validé et fonds libérés (disponibles dans le portefeuille)
	| 'cancelled' // Annulé
	| 'refunded'; // Remboursé

/**
 * Statuts de livraison standardisés
 */
export type DeliveryStatus =
	| 'pending' // En attente d'acceptation par un livreur
	| 'accepted' // Acceptée par un livreur
	| 'in_transit' // En cours de livraison
	| 'delivered' // Livrée (en attente de validation par code)
	| 'completed' // Terminée et validée
	| 'cancelled'; // Annulée

/**
 * Interface pour les données de livraison avec statuts standardisés
 */
export interface StandardizedDeliveryData {
	id: number;
	payment_status: PaymentStatus;
	delivery_status: DeliveryStatus;
	payment_intent_id?: string;
	amount?: number;
	validation_code?: string;
	validated_at?: string;
}

// =============================================================================
// VALIDATEURS STRIPE AMÉLIORÉS SELON LE CAHIER DES CHARGES
// =============================================================================

/**
 * Validator pour création de paiement livraison avec escrow
 */
export interface StripeEscrowPaymentRequest {
	amount: number; // vine.number().positive().min(100) - Minimum 1€
	livraison_id: number; // vine.number().positive()
	description: string; // vine.string().minLength(3).maxLength(255)
	client_id?: number; // vine.number().positive().optional()
	auto_capture?: boolean; // vine.boolean().optional() - false par défaut pour escrow
}

/**
 * Validator pour validation de livraison avec code (cahier des charges page 15)
 */
export interface CodeValidationRequest {
	user_info: string; // vine.string().minLength(1) - Format: "delivery-{livraison_id}"
	code: string; // vine.string().length(6).regex(/^\d{6}$/)
	livraison_id: number; // vine.number().positive()
	validate_funds?: boolean; // vine.boolean().optional() - true par défaut
}

/**
 * Validator pour demande de virement depuis le portefeuille EcoDeli
 */
export interface WalletTransferRequest {
	montant: number; // vine.number().positive().min(1)
	iban: string; // vine.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/)
	bic: string; // vine.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
	description?: string; // vine.string().maxLength(255).optional()
}

// =============================================================================
// 🚀 NOUVEAU: TYPES CLIENT MULTI-RÔLES - CAGNOTTE & GAINS
// =============================================================================

export interface ClientWalletRechargeRequest {
	montant: number; // vine.number().positive().min(1) - Minimum 1€
}

export interface ClientWalletPaymentRequest {
	montant: number; // vine.number().positive().min(1)
	livraison_id?: number; // vine.number().positive().optional()
	service_id?: number; // vine.number().positive().optional()
	description: string; // vine.string().minLength(3).maxLength(255)
}

export interface ClientWalletData {
	id: number;
	client_id: number;
	solde_disponible: number; // Fonds disponibles dans la cagnotte
	solde_en_attente: number; // Gains en attente de libération
	solde_total: number; // Total: disponible + en_attente
	virement_auto_actif: boolean; // Virement automatique activé
	seuil_virement_auto: number; // Seuil pour virement auto
	stripe_account_id?: string; // Compte Stripe Connect pour virements
	created_at: string;
	updated_at: string;
}

export interface ClientWalletTransaction {
	id: number;
	client_id: number;
	type_transaction:
		| 'recharge'
		| 'payment'
		| 'gain'
		| 'virement'
		| 'commission';
	montant: number;
	solde_avant: number;
	solde_apres: number;
	description: string;
	reference_externe?: string; // Payment Intent ID, Transfer ID, etc.
	livraison_id?: number;
	service_id?: number;
	statut: 'pending' | 'completed' | 'failed' | 'cancelled';
	metadata?: any; // Données supplémentaires JSON
	created_at: string;
	updated_at: string;
}

export interface ServiceEarningsData {
	gains_totaux: number; // Total des gains prestataire
	gains_ce_mois: number; // Gains du mois en cours
	gains_cette_semaine: number; // Gains de la semaine
	nombre_services_completes: number; // Nombre de services terminés
	services_recents: ServiceEarningDetail[];
}

export interface ServiceEarningDetail {
	id: number;
	service_name: string;
	client_name: string;
	montant: number;
	commission: number;
	gain_net: number;
	date_completion: string;
	statut_paiement: 'pending' | 'paid' | 'transferred';
}

export interface ClientStripeConnectStatus {
	has_account: boolean;
	stripe_account_id?: string;
	charges_enabled?: boolean;
	payouts_enabled?: boolean;
	details_submitted?: boolean;
	requirements?: {
		currently_due: string[];
		eventually_due: string[];
		past_due: string[];
		pending_verification: string[];
	};
	ready_for_payouts?: boolean;
	message?: string;
}

export interface ClientWalletMixedPaymentRequest {
	montant_total: number; // vine.number().positive().min(1)
	montant_cagnotte: number; // vine.number().min(0) - Peut être 0
	montant_carte: number; // vine.number().min(0) - Peut être 0
	livraison_id?: number; // vine.number().positive().optional()
	service_id?: number; // vine.number().positive().optional()
	description: string; // vine.string().minLength(3).maxLength(255)
}

/**
 * Interface pour les données du portefeuille EcoDeli
 */
export interface WalletData {
	id: number;
	utilisateur_id: number;
	solde_disponible: number; // Fonds disponibles pour virement
	solde_en_attente: number; // Fonds en escrow (non encore libérés)
	solde_total: number; // Computed: disponible + en_attente
	virement_auto_actif: boolean;
	seuil_virement_auto: number;
	iban?: string;
	bic?: string;
	created_at: string;
	updated_at: string;
}

/**
 * Interface pour les transactions du portefeuille
 */
export interface WalletTransactionData {
	id: number;
	portefeuille_id: number;
	utilisateur_id: number;
	type_transaction:
		| 'credit'
		| 'debit'
		| 'liberation'
		| 'virement'
		| 'commission';
	montant: number;
	solde_avant: number;
	solde_apres: number;
	description: string;
	reference_externe?: string; // Payment Intent ID, etc.
	livraison_id?: number;
	service_id?: number;
	statut: 'pending' | 'completed' | 'failed' | 'cancelled';
	metadata?: string; // JSON stringifié
	created_at: string;
	updated_at: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function isBackendError(
	response: any
): response is BackendErrorResponse {
	return response && (response.error_message || response.message);
}

export function getBackendErrorMessage(response: any): string {
	if (isBackendError(response)) {
		return (
			response.error_message ||
			response.message ||
			'Une erreur est survenue'
		);
	}
	return 'Une erreur inconnue est survenue';
}

// =============================================================================
// VALIDATEURS FRONTEND AMÉLIORÉS
// =============================================================================

export class FrontendValidators {
	static validateLoginRequest(data: LoginRequest): string[] {
		const errors: string[] = [];

		if (!data.email || !data.email.includes('@')) {
			errors.push('Email invalide');
		}

		if (
			!data.password ||
			data.password.length < 6 ||
			data.password.length > 20
		) {
			errors.push('Le mot de passe doit faire entre 6 et 20 caractères');
		}

		return errors;
	}

	static validateRegisterRequest(data: RegisterRequest): string[] {
		const errors: string[] = [];

		if (
			!data.first_name ||
			data.first_name.length < 3 ||
			data.first_name.length > 50
		) {
			errors.push('Le prénom doit faire entre 3 et 50 caractères');
		}

		if (
			!data.last_name ||
			data.last_name.length < 3 ||
			data.last_name.length > 50
		) {
			errors.push('Le nom doit faire entre 3 et 50 caractères');
		}

		if (!data.email || !data.email.includes('@')) {
			errors.push('Email invalide');
		}

		if (
			!data.password ||
			data.password.length < 6 ||
			data.password.length > 20
		) {
			errors.push('Le mot de passe doit faire entre 6 et 20 caractères');
		}

		if (data.password !== data.confirm_password) {
			errors.push('Les mots de passe ne correspondent pas');
		}

		if (!data.city || data.city.length < 2 || data.city.length > 100) {
			errors.push('La ville doit faire entre 2 et 100 caractères');
		}

		if (
			!data.postalCode ||
			data.postalCode.length < 2 ||
			data.postalCode.length > 20
		) {
			errors.push('Le code postal doit faire entre 2 et 20 caractères');
		}

		if (
			!data.country ||
			data.country.length < 2 ||
			data.country.length > 50
		) {
			errors.push('Le pays doit faire entre 2 et 50 caractères');
		}

		return errors;
	}

	static validateAdminUserCreationRequest(
		data: AdminUserCreationRequest
	): Record<string, string> {
		const errors: Record<string, string> = {};

		if (
			!data.first_name ||
			data.first_name.trim().length < 2 ||
			data.first_name.trim().length > 50
		) {
			errors.first_name = 'Le prénom doit faire entre 2 et 50 caractères';
		}

		if (
			!data.last_name ||
			data.last_name.trim().length < 2 ||
			data.last_name.trim().length > 50
		) {
			errors.last_name = 'Le nom doit faire entre 2 et 50 caractères';
		}

		if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
			errors.email = 'Email invalide';
		}

		if (
			!data.password ||
			data.password.length < 8 ||
			data.password.length > 100
		) {
			errors.password =
				'Le mot de passe doit faire entre 8 et 100 caractères';
		}

		if (
			!data.city ||
			data.city.trim().length < 2 ||
			data.city.trim().length > 100
		) {
			errors.city = 'La ville doit faire entre 2 et 100 caractères';
		}

		if (
			!data.postalCode ||
			data.postalCode.trim().length < 2 ||
			data.postalCode.trim().length > 20
		) {
			errors.postalCode =
				'Le code postal doit faire entre 2 et 20 caractères';
		}

		if (
			!data.country ||
			data.country.trim().length < 2 ||
			data.country.trim().length > 100
		) {
			errors.country = 'Le pays doit faire entre 2 et 100 caractères';
		}

		return errors;
	}

	static validateCreateAnnouncementRequest(
		data: CreateAnnouncementRequest
	): string[] {
		const errors: string[] = [];

		if (!data.title || data.title.length < 3 || data.title.length > 50) {
			errors.push('Le titre doit faire entre 3 et 50 caractères');
		}

		if (
			data.description &&
			(data.description.length < 10 || data.description.length > 500)
		) {
			errors.push('La description doit faire entre 10 et 500 caractères');
		}

		if (!data.price || data.price <= 0) {
			errors.push('Le prix doit être supérieur à 0');
		}

		if (!data.utilisateur_id || data.utilisateur_id <= 0) {
			errors.push('ID utilisateur invalide');
		}

		return errors;
	}

	static validateCreateComplaintRequest(
		data: CreateComplaintRequest
	): string[] {
		const errors: string[] = [];

		if (
			!data.subject ||
			data.subject.length < 3 ||
			data.subject.length > 255
		) {
			errors.push('Le sujet doit faire entre 3 et 255 caractères');
		}

		if (!data.description || data.description.length < 10) {
			errors.push('La description doit faire au moins 10 caractères');
		}

		if (!data.utilisateur_id || data.utilisateur_id <= 0) {
			errors.push('ID utilisateur invalide');
		}

		return errors;
	}

	static validateJustificationPieceRequest(
		data: JustificationPieceRequest
	): string[] {
		const errors: string[] = [];

		if (!data.utilisateur_id || data.utilisateur_id <= 0) {
			errors.push('ID utilisateur invalide');
		}

		if (
			!data.document_type ||
			data.document_type.length < 2 ||
			data.document_type.length > 255
		) {
			errors.push(
				'Le type de document doit faire entre 2 et 255 caractères'
			);
		}

		if (
			!data.account_type ||
			!['livreur', 'commercant', 'prestataire'].includes(
				data.account_type
			)
		) {
			errors.push('Type de compte invalide');
		}

		return errors;
	}

	static validateJustificationReviewRequest(
		data: JustificationReviewRequest
	): string[] {
		const errors: string[] = [];

		// Les commentaires sont optionnels, mais s'ils sont fournis, ils doivent avoir une longueur raisonnable
		if (data.comments && data.comments.length > 1000) {
			errors.push(
				'Les commentaires ne peuvent pas dépasser 1000 caractères'
			);
		}

		return errors;
	}

	static validateUpdateComplaintRequest(
		data: UpdateComplaintRequest
	): string[] {
		const errors: string[] = [];

		if (
			data.subject &&
			(data.subject.length < 3 || data.subject.length > 255)
		) {
			errors.push('Le sujet doit faire entre 3 et 255 caractères');
		}

		if (data.description && data.description.length < 10) {
			errors.push('La description doit faire au moins 10 caractères');
		}

		return errors;
	}

	// ==========================================================================
	// VALIDATORS STRIPE (NOUVEAUX)
	// ==========================================================================

	static validateStripeSubscribeRequest(
		data: StripeSubscribeRequest
	): string[] {
		const errors: string[] = [];

		if (!data.planId || data.planId.trim().length === 0) {
			errors.push("L'ID du plan est requis");
		}

		if (!data.priceId || data.priceId.trim().length === 0) {
			errors.push("L'ID du prix est requis");
		}

		return errors;
	}

	static validateStripePaymentIntentRequest(
		data: StripePaymentIntentRequest
	): string[] {
		const errors: string[] = [];

		if (!data.amount || data.amount <= 0) {
			errors.push('Le montant doit être supérieur à 0');
		}

		if (data.amount && data.amount > 999999999) {
			errors.push('Le montant est trop élevé');
		}

		if (
			data.currency &&
			!['eur', 'usd', 'gbp'].includes(data.currency.toLowerCase())
		) {
			errors.push('Devise non supportée');
		}

		return errors;
	}

	static validateStripeConnectedAccountRequest(
		data: StripeConnectedAccountRequest
	): string[] {
		const errors: string[] = [];

		if (!data.email || !data.email.includes('@')) {
			errors.push('Email invalide');
		}

		if (
			data.accountType &&
			!['individual', 'company'].includes(data.accountType)
		) {
			errors.push('Type de compte invalide');
		}

		return errors;
	}

	static validateStripeDeliveryPaymentRequest(
		data: StripeDeliveryPaymentRequest
	): string[] {
		const errors: string[] = [];

		if (!data.amount || data.amount <= 0) {
			errors.push('Le montant doit être supérieur à 0');
		}

		if (!data.deliveryId || data.deliveryId.trim().length === 0) {
			errors.push("L'ID de la livraison est requis");
		}

		if (
			!data.livreurStripeAccountId ||
			data.livreurStripeAccountId.trim().length === 0
		) {
			errors.push("L'ID du compte Stripe du livreur est requis");
		}

		if (data.commission && (data.commission < 0 || data.commission > 100)) {
			errors.push('La commission doit être entre 0 et 100%');
		}

		return errors;
	}

	static validateStripeServicePaymentRequest(
		data: StripeServicePaymentRequest
	): string[] {
		const errors: string[] = [];

		if (!data.amount || data.amount <= 0) {
			errors.push('Le montant doit être supérieur à 0');
		}

		if (!data.serviceId || data.serviceId.trim().length === 0) {
			errors.push("L'ID du service est requis");
		}

		if (
			!data.prestataireFeeAccountId ||
			data.prestataireFeeAccountId.trim().length === 0
		) {
			errors.push("L'ID du compte Stripe du prestataire est requis");
		}

		if (data.commission && (data.commission < 0 || data.commission > 100)) {
			errors.push('La commission doit être entre 0 et 100%');
		}

		return errors;
	}

	static validateStripeTransferRequest(
		data: StripeTransferRequest
	): string[] {
		const errors: string[] = [];

		if (!data.amount || data.amount <= 0) {
			errors.push('Le montant doit être supérieur à 0');
		}

		if (
			!data.destinationAccountId ||
			data.destinationAccountId.trim().length === 0
		) {
			errors.push("L'ID du compte de destination est requis");
		}

		return errors;
	}

	static validateStripeInvoiceRequest(data: StripeInvoiceRequest): string[] {
		const errors: string[] = [];

		if (!data.customerId || data.customerId.trim().length === 0) {
			errors.push("L'ID du client est requis");
		}

		if (!data.items || data.items.length === 0) {
			errors.push('Au moins un article est requis');
		}

		data.items.forEach((item, index) => {
			if (!item.description || item.description.trim().length === 0) {
				errors.push(
					`Description manquante pour l'article ${index + 1}`
				);
			}

			if (!item.amount || item.amount <= 0) {
				errors.push(`Montant invalide pour l'article ${index + 1}`);
			}

			if (item.quantity && item.quantity <= 0) {
				errors.push(`Quantité invalide pour l'article ${index + 1}`);
			}
		});

		return errors;
	}

	static validateStripeRefundRequest(data: StripeRefundRequest): string[] {
		const errors: string[] = [];

		if (!data.paymentIntentId || data.paymentIntentId.trim().length === 0) {
			errors.push("L'ID du payment intent est requis");
		}

		if (data.amount && data.amount <= 0) {
			errors.push('Le montant de remboursement doit être supérieur à 0');
		}

		return errors;
	}

	/**
	 * Validation du statut de paiement
	 */
	static validatePaymentStatus(status: string): status is PaymentStatus {
		return [
			'unpaid',
			'authorized',
			'pending',
			'paid',
			'cancelled',
			'refunded',
		].includes(status);
	}

	/**
	 * Validation du statut de livraison
	 */
	static validateDeliveryStatus(status: string): status is DeliveryStatus {
		return [
			'pending',
			'accepted',
			'in_transit',
			'delivered',
			'completed',
			'cancelled',
		].includes(status);
	}

	/**
	 * Validation du code de validation (6 chiffres)
	 */
	static validateValidationCode(code: string): string[] {
		const errors: string[] = [];

		if (!code || code.length !== 6) {
			errors.push('Le code doit faire exactement 6 chiffres');
		}

		if (!/^\d{6}$/.test(code)) {
			errors.push('Le code ne doit contenir que des chiffres');
		}

		return errors;
	}

	/**
	 * Validation IBAN français
	 */
	static validateIBAN(iban: string): string[] {
		const errors: string[] = [];

		if (!iban) {
			errors.push("L'IBAN est requis");
			return errors;
		}

		// Supprimer les espaces
		const cleanIban = iban.replace(/\s/g, '').toUpperCase();

		// Vérifier le format général
		if (
			!/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/.test(cleanIban)
		) {
			errors.push('Format IBAN invalide');
		}

		// Vérifier que c'est un IBAN français
		if (!cleanIban.startsWith('FR')) {
			errors.push('Seuls les IBAN français sont acceptés');
		}

		return errors;
	}

	/**
	 * Validation BIC
	 */
	static validateBIC(bic: string): string[] {
		const errors: string[] = [];

		if (!bic) {
			errors.push('Le BIC est requis');
			return errors;
		}

		const cleanBic = bic.replace(/\s/g, '').toUpperCase();

		if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanBic)) {
			errors.push('Format BIC invalide');
		}

		return errors;
	}

	/**
	 * Validation montant pour virement
	 */
	static validateTransferAmount(
		amount: number,
		availableBalance: number
	): string[] {
		const errors: string[] = [];

		if (!amount || amount <= 0) {
			errors.push('Le montant doit être supérieur à 0');
		}

		if (amount < 1) {
			errors.push('Le montant minimum est de 1€');
		}

		if (amount > availableBalance) {
			errors.push('Montant supérieur au solde disponible');
		}

		return errors;
	}

	/**
	 * Validation de paiement escrow Stripe
	 */
	static validateStripeEscrowPaymentRequest(
		data: StripeEscrowPaymentRequest
	): string[] {
		const errors: string[] = [];

		if (!data.amount || data.amount < 100) {
			errors.push('Le montant minimum est de 1€ (100 centimes)');
		}

		if (data.amount > 999999999) {
			errors.push('Le montant est trop élevé');
		}

		if (!data.livraison_id || data.livraison_id <= 0) {
			errors.push('ID de livraison invalide');
		}

		if (
			!data.description ||
			data.description.length < 3 ||
			data.description.length > 255
		) {
			errors.push('La description doit faire entre 3 et 255 caractères');
		}

		return errors;
	}

	/**
	 * Validation de demande de validation par code
	 */
	static validateCodeValidationRequest(
		data: CodeValidationRequest
	): string[] {
		const errors: string[] = [];

		if (!data.user_info || data.user_info.length === 0) {
			errors.push('Information utilisateur requise');
		}

		// Vérifier le format user_info pour livraison
		if (data.user_info.startsWith('delivery-')) {
			const livraisonIdFromUserInfo = data.user_info.split('-')[1];
			if (
				!livraisonIdFromUserInfo ||
				isNaN(parseInt(livraisonIdFromUserInfo))
			) {
				errors.push('Format user_info invalide pour livraison');
			}
		}

		errors.push(...this.validateValidationCode(data.code));

		if (!data.livraison_id || data.livraison_id <= 0) {
			errors.push('ID de livraison invalide');
		}

		return errors;
	}

	// ==========================================================================
	// 🚀 NOUVEAU: VALIDATORS STRIPE CONNECT
	// ==========================================================================

	/**
	 * Validation demande onboarding Stripe Connect
	 */
	static validateStripeConnectOnboardingRequest(
		data: StripeConnectOnboardingRequest
	): string[] {
		const errors: string[] = [];

		if (data.returnUrl && !this.isValidUrl(data.returnUrl)) {
			errors.push('URL de retour invalide');
		}

		if (data.refreshUrl && !this.isValidUrl(data.refreshUrl)) {
			errors.push('URL de rafraîchissement invalide');
		}

		return errors;
	}

	/**
	 * Validation demande de virement Stripe Connect
	 */
	static validateStripeConnectTransferRequest(
		data: StripeConnectTransferRequest
	): string[] {
		const errors: string[] = [];

		if (!data.montant || data.montant < 1) {
			errors.push('Le montant minimum est de 1€');
		}

		if (data.montant > 999999) {
			errors.push('Le montant maximum est de 999,999€');
		}

		if (data.description && data.description.length > 255) {
			errors.push('La description ne peut pas dépasser 255 caractères');
		}

		return errors;
	}

	/**
	 * Validation configuration virements automatiques
	 */
	static validateStripeConnectPayoutConfigRequest(
		data: StripeConnectPayoutConfigRequest
	): string[] {
		const errors: string[] = [];

		if (!['manual', 'daily', 'weekly', 'monthly'].includes(data.schedule)) {
			errors.push('Fréquence de virement invalide');
		}

		if (
			data.delayDays !== undefined &&
			(data.delayDays < 0 || data.delayDays > 30)
		) {
			errors.push('Le délai doit être entre 0 et 30 jours');
		}

		return errors;
	}

	/**
	 * Utilitaire validation URL
	 */
	private static isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validation de demande de virement
	 */
	static validateWalletTransferRequest(
		data: WalletTransferRequest
	): string[] {
		const errors: string[] = [];

		errors.push(...this.validateTransferAmount(data.montant, Infinity)); // On ne connaît pas le solde ici
		errors.push(...this.validateIBAN(data.iban));
		errors.push(...this.validateBIC(data.bic));

		if (data.description && data.description.length > 255) {
			errors.push('La description ne peut pas dépasser 255 caractères');
		}

		return errors;
	}

	// =============================================================================
	// 🚀 NOUVEAU: VALIDATEURS CLIENT MULTI-RÔLES
	// =============================================================================

	/**
	 * Validation recharge cagnotte client
	 */
	static validateClientWalletRechargeRequest(
		data: ClientWalletRechargeRequest
	): string[] {
		const errors: string[] = [];

		if (!data.montant || data.montant <= 0) {
			errors.push('Le montant doit être supérieur à 0€');
		}

		if (data.montant < 1) {
			errors.push('Le montant minimum de recharge est de 1€');
		}

		if (data.montant > 1000) {
			errors.push('Le montant maximum de recharge est de 1000€');
		}

		return errors;
	}

	/**
	 * Validation paiement depuis cagnotte client
	 */
	static validateClientWalletPaymentRequest(
		data: ClientWalletPaymentRequest
	): string[] {
		const errors: string[] = [];

		if (!data.montant || data.montant <= 0) {
			errors.push('Le montant doit être supérieur à 0€');
		}

		if (data.montant < 0.5) {
			errors.push('Le montant minimum de paiement est de 0.50€');
		}

		if (!data.description || data.description.trim().length < 3) {
			errors.push('La description doit contenir au moins 3 caractères');
		}

		if (data.description && data.description.length > 255) {
			errors.push('La description ne peut pas dépasser 255 caractères');
		}

		if (!data.livraison_id && !data.service_id) {
			errors.push('Une référence de livraison ou de service est requise');
		}

		return errors;
	}

	/**
	 * Validation paiement mixte (cagnotte + carte)
	 */
	static validateClientWalletMixedPaymentRequest(
		data: ClientWalletMixedPaymentRequest
	): string[] {
		const errors: string[] = [];

		if (!data.montant_total || data.montant_total <= 0) {
			errors.push('Le montant total doit être supérieur à 0€');
		}

		if (data.montant_cagnotte < 0) {
			errors.push('Le montant cagnotte ne peut pas être négatif');
		}

		if (data.montant_carte < 0) {
			errors.push('Le montant carte ne peut pas être négatif');
		}

		if (
			Math.abs(
				data.montant_cagnotte + data.montant_carte - data.montant_total
			) > 0.01
		) {
			errors.push(
				'La somme des montants cagnotte et carte doit égaler le montant total'
			);
		}

		if (data.montant_cagnotte === 0 && data.montant_carte === 0) {
			errors.push('Au moins un mode de paiement doit être utilisé');
		}

		if (!data.description || data.description.trim().length < 3) {
			errors.push('La description doit contenir au moins 3 caractères');
		}

		if (data.description && data.description.length > 255) {
			errors.push('La description ne peut pas dépasser 255 caractères');
		}

		if (!data.livraison_id && !data.service_id) {
			errors.push('Une référence de livraison ou de service est requise');
		}

		return errors;
	}

	/**
	 * Validation solde cagnotte client
	 */
	static validateClientWalletBalance(
		montantDemande: number,
		soldeDisponible: number
	): string[] {
		const errors: string[] = [];

		if (montantDemande > soldeDisponible) {
			errors.push(
				`Solde insuffisant. Disponible: ${soldeDisponible.toFixed(
					2
				)}€, Demandé: ${montantDemande.toFixed(2)}€`
			);
		}

		return errors;
	}
}

// =============================================================================
// 🚀 NOUVEAU: SERVICES - TYPES MANQUANTS POUR LE BACK-OFFICE
// =============================================================================

/**
 * Données d'un service pour le front-end
 */
export interface ServiceData {
	id: number;
	name: string;
	description: string;
	price: number;
	pricing_type: 'fixed' | 'hourly' | 'custom';
	location: string;
	status: 'pending' | 'active' | 'completed' | 'cancelled';
	is_active: boolean;
	prestataire_name: string;
	prestataire_email: string;
	prestataire_rating: number | null;
	service_type_name: string | null;
	service_type_id: number | null;
	created_at: string;
	updated_at: string;
	home_service: boolean;
	requires_materials: boolean;
	duration: number | null; // en minutes
}

/**
 * Statistiques des services pour le dashboard admin
 */
export interface ServiceStats {
	total: number;
	active: number;
	pending: number;
	completed: number;
	cancelled: number;
	total_revenue: number;
	average_rating: number;
	average_duration: number; // en minutes
}

/**
 * Type de service
 */
export interface ServiceTypeData {
	id: number;
	name: string;
	description: string | null;
	is_active: boolean;
	service_count: number;
	created_at: string;
	updated_at: string;
}

/**
 * Validation création/modification de service
 */
export interface ServiceRequest {
	name: string; // vine.string().minLength(3).maxLength(100)
	description: string; // vine.string().minLength(10).maxLength(500)
	price: number; // vine.number().positive()
	pricing_type: 'fixed' | 'hourly' | 'custom'; // vine.enum(['fixed', 'hourly', 'custom'])
	location: string; // vine.string().minLength(3).maxLength(255)
	service_type_id: number; // vine.number().positive()
	home_service: boolean; // vine.boolean()
	requires_materials: boolean; // vine.boolean()
	duration?: number | null; // vine.number().positive().optional().nullable()
}

/**
 * Validation mise à jour statut service
 */
export interface ServiceStatusUpdateRequest {
	is_active: boolean; // vine.boolean()
}

/**
 * Validation type de service
 */
export interface ServiceTypeRequest {
	name: string; // vine.string().minLength(2).maxLength(100)
	description?: string | null; // vine.string().minLength(5).maxLength(255).optional().nullable()
	is_active: boolean; // vine.boolean()
}

/**
 * Filtres pour recherche de services
 */
export interface ServiceFilters {
	status?: string[];
	service_type_id?: number[];
	location?: string;
	price_range?: {
		min: number;
		max: number;
	};
	is_active?: boolean;
	date_range?: {
		start: string;
		end: string;
	};
}

/**
 * Service en attente de validation
 */
export interface PendingServiceData extends ServiceData {
	submitted_at: string;
	rejection_reason?: string | null;
	validated_by?: string | null;
	validated_at?: string | null;
}

/**
 * Réponse API pour les services
 */
export interface ServicesApiResponse {
	data: ServiceData[];
	meta?: {
		total: number;
		page: number;
		per_page: number;
		last_page: number;
	};
}

/**
 * Réponse API pour les types de services
 */
export interface ServiceTypesApiResponse {
	service_types: ServiceTypeData[];
}

// =============================================================================
// 🚀 NOUVEAU: VALIDATORS SERVICES
// =============================================================================

export class ServiceValidators {
	/**
	 * Validation création/modification de service
	 */
	static validateServiceRequest(data: ServiceRequest): string[] {
		const errors: string[] = [];

		if (!data.name || data.name.length < 3 || data.name.length > 100) {
			errors.push(
				'Le nom du service doit faire entre 3 et 100 caractères'
			);
		}

		if (
			!data.description ||
			data.description.length < 10 ||
			data.description.length > 500
		) {
			errors.push('La description doit faire entre 10 et 500 caractères');
		}

		if (!data.price || data.price <= 0) {
			errors.push('Le prix doit être supérieur à 0');
		}

		if (!['fixed', 'hourly', 'custom'].includes(data.pricing_type)) {
			errors.push('Type de tarification invalide');
		}

		if (
			!data.location ||
			data.location.length < 3 ||
			data.location.length > 255
		) {
			errors.push('La localisation doit faire entre 3 et 255 caractères');
		}

		if (!data.service_type_id || data.service_type_id <= 0) {
			errors.push('Type de service invalide');
		}

		if (
			data.duration !== undefined &&
			data.duration !== null &&
			data.duration <= 0
		) {
			errors.push('La durée doit être supérieure à 0 minutes');
		}

		return errors;
	}

	/**
	 * Validation type de service
	 */
	static validateServiceTypeRequest(data: ServiceTypeRequest): string[] {
		const errors: string[] = [];

		if (!data.name || data.name.length < 2 || data.name.length > 100) {
			errors.push('Le nom du type doit faire entre 2 et 100 caractères');
		}

		if (
			data.description &&
			(data.description.length < 5 || data.description.length > 255)
		) {
			errors.push('La description doit faire entre 5 et 255 caractères');
		}

		return errors;
	}

	/**
	 * Validation filtres de recherche
	 */
	static validateServiceFilters(filters: ServiceFilters): string[] {
		const errors: string[] = [];

		if (filters.price_range) {
			if (filters.price_range.min < 0) {
				errors.push('Le prix minimum ne peut pas être négatif');
			}
			if (filters.price_range.max < 0) {
				errors.push('Le prix maximum ne peut pas être négatif');
			}
			if (filters.price_range.min > filters.price_range.max) {
				errors.push(
					'Le prix minimum ne peut pas être supérieur au prix maximum'
				);
			}
		}

		return errors;
	}
}

// =============================================================================
// 🚀 NOUVEAU: BOOKINGS - TYPES POUR LA GESTION DES RÉSERVATIONS
// =============================================================================

/**
 * Statuts possibles d'une réservation
 */
export type BookingStatus =
	| 'pending'
	| 'confirmed'
	| 'in_progress'
	| 'completed'
	| 'cancelled';

/**
 * Données d'une réservation pour le front-end
 */
export interface BookingData {
	id: number;
	client_id: number;
	prestataire_id: number;
	service_id: number;
	status: BookingStatus;
	booked_date: string;
	booked_time: string;
	location: string;
	notes: string | null;
	total_price: number;
	payment_status: 'pending' | 'paid' | 'refunded';
	created_at: string;
	updated_at: string;
	// Relations
	client_name: string;
	client_email: string;
	prestataire_name: string;
	prestataire_email: string;
	service_name: string;
	service_description: string;
	service_type_name?: string;
}

/**
 * Statistiques des réservations pour le dashboard admin
 */
export interface BookingStats {
	total: number;
	pending: number;
	confirmed: number;
	in_progress: number;
	completed: number;
	cancelled: number;
	total_revenue: number;
	average_booking_value: number;
	growth_rate: number;
}

/**
 * Filtres pour les réservations
 */
export interface BookingFilters {
	status?: BookingStatus[];
	client_id?: number;
	prestataire_id?: number;
	service_id?: number;
	date_start?: string;
	date_end?: string;
	payment_status?: string[];
}

/**
 * Requête pour mettre à jour le statut d'une réservation
 */
export interface BookingStatusUpdateRequest {
	status: BookingStatus;
	notes?: string;
}

/**
 * Réponse API pour les réservations
 */
export interface BookingsApiResponse {
	data: BookingData[];
	meta?: {
		total: number;
		page: number;
		per_page: number;
		last_page: number;
	};
}

// =============================================================================
// 🚀 NOUVEAU: RATINGS - TYPES POUR LA GESTION DES AVIS
// =============================================================================

/**
 * Types d'éléments pouvant être évalués
 */
export type RatingType = 'service' | 'delivery' | 'prestataire' | 'livreur';

/**
 * Données d'un avis pour le front-end
 */
export interface RatingData {
	id: number;
	user_id: number;
	item_id: number;
	rating_type: RatingType;
	rating: number; // 1-5 étoiles
	comment: string | null;
	is_visible: boolean;
	admin_response: string | null;
	created_at: string;
	updated_at: string;
	// Relations
	user_name: string;
	user_email: string;
	item_name: string; // nom du service/prestataire évalué
	reviewedUserName: string; // nom et prénom de l'utilisateur évalué
}

/**
 * Statistiques des avis pour le dashboard admin
 */
export interface RatingStats {
	total: number;
	visible: number;
	hidden: number;
	with_admin_response: number;
	average_rating: number;
	ratings_by_type: Record<RatingType, number>;
	ratings_distribution: Record<string, number>; // 1 étoile: X, 2 étoiles: Y, etc.
}

/**
 * Filtres pour les avis
 */
export interface RatingFilters {
	rating_type?: RatingType;
	rating?: number;
	is_visible?: boolean;
	has_admin_response?: boolean;
	date_start?: string;
	date_end?: string;
	user_id?: number;
}

/**
 * Formulaire pour répondre à un avis (admin)
 */
export interface AdminRatingResponse {
	admin_response: string;
}

/**
 * Réponse API pour les avis
 */
export interface RatingsApiResponse {
	data: RatingData[];
	meta?: {
		total: number;
		page: number;
		per_page: number;
		last_page: number;
	};
}

/**
 * Réponse API pour les statistiques des avis
 */
export interface RatingStatsApiResponse {
	data: RatingStats;
}

// =============================================================================
// VALIDATEURS POUR BOOKINGS ET RATINGS
// =============================================================================

export class BookingValidators {
	/**
	 * Validation d'une requête de mise à jour de statut de réservation
	 */
	static validateBookingStatusUpdate(
		data: BookingStatusUpdateRequest
	): string[] {
		const errors: string[] = [];

		if (
			!data.status ||
			![
				'pending',
				'confirmed',
				'in_progress',
				'completed',
				'cancelled',
			].includes(data.status)
		) {
			errors.push('Statut de réservation invalide');
		}

		if (data.notes && data.notes.length > 500) {
			errors.push('Les notes ne peuvent pas dépasser 500 caractères');
		}

		return errors;
	}

	/**
	 * Validation des filtres de réservation
	 */
	static validateBookingFilters(filters: BookingFilters): string[] {
		const errors: string[] = [];

		if (
			filters.status &&
			filters.status.some(
				(s) =>
					![
						'pending',
						'confirmed',
						'in_progress',
						'completed',
						'cancelled',
					].includes(s)
			)
		) {
			errors.push('Statut de filtre invalide');
		}

		if (
			filters.date_start &&
			filters.date_end &&
			new Date(filters.date_start) > new Date(filters.date_end)
		) {
			errors.push(
				'La date de début doit être antérieure à la date de fin'
			);
		}

		return errors;
	}
}

export class RatingValidators {
	/**
	 * Validation d'une réponse admin à un avis
	 */
	static validateAdminRatingResponse(data: AdminRatingResponse): string[] {
		const errors: string[] = [];

		if (!data.admin_response || data.admin_response.trim().length < 5) {
			errors.push('La réponse admin doit faire au moins 5 caractères');
		}

		if (data.admin_response && data.admin_response.length > 1000) {
			errors.push(
				'La réponse admin ne peut pas dépasser 1000 caractères'
			);
		}

		return errors;
	}

	/**
	 * Validation des filtres d'avis
	 */
	static validateRatingFilters(filters: RatingFilters): string[] {
		const errors: string[] = [];

		if (
			filters.rating_type &&
			!['service', 'delivery', 'prestataire', 'livreur'].includes(
				filters.rating_type
			)
		) {
			errors.push("Type d'avis invalide");
		}

		if (filters.rating && (filters.rating < 1 || filters.rating > 5)) {
			errors.push('La note doit être entre 1 et 5');
		}

		if (
			filters.date_start &&
			filters.date_end &&
			new Date(filters.date_start) > new Date(filters.date_end)
		) {
			errors.push(
				'La date de début doit être antérieure à la date de fin'
			);
		}

		return errors;
	}
}
