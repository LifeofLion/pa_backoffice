// =============================================================================
// TYPES DE VALIDATION FRONTEND - ALIGNÉS SUR VALIDATORS BACKEND
// =============================================================================

// Types exacts correspondant aux validators backend utilisés dans l'application
// Note: Le backend mélange snake_case et camelCase selon les validators

// =============================================================================
// AUTHENTIFICATION - UTILISÉS ✅
// =============================================================================

export interface LoginRequest {
  email: string                    // vine.string().email().toLowerCase()
  password: string                 // vine.string().minLength(6).maxLength(20)
}

export interface RegisterRequest {
  first_name: string               // vine.string().minLength(3).maxLength(50)
  last_name: string                // vine.string().minLength(3).maxLength(50)
  email: string                    // vine.string().email().toLowerCase()
  address?: string | null          // vine.string().minLength(3).maxLength(255).nullable().optional()
  city: string                     // vine.string().minLength(2).maxLength(100)
  postalCode: string               // vine.string().minLength(2).maxLength(20) - ATTENTION: camelCase dans validator
  country: string                  // vine.string().minLength(2).maxLength(50)
  password: string                 // vine.string().minLength(6).maxLength(20)
  confirm_password: string         // vine.string().minLength(6).maxLength(20)
  phone_number?: string | null     // vine.string().nullable().optional()
}

export interface CheckPasswordRequest {
  email: string                    // vine.string().email().toLowerCase()
  password: string                 // vine.string().minLength(6).maxLength(20)
}

// =============================================================================
// UTILISATEUR - UTILISÉS ✅
// =============================================================================

export interface UserUpdateRequest {
  first_name?: string              // vine.string().minLength(3).maxLength(50).optional()
  last_name?: string               // vine.string().minLength(3).maxLength(50).optional()
  address?: string | null          // vine.string().minLength(3).maxLength(255).nullable().optional()
  city?: string                    // vine.string().minLength(2).maxLength(100).optional()
  postalCode?: string              // vine.string().minLength(2).maxLength(20).optional() - ATTENTION: camelCase
  country?: string                 // vine.string().minLength(2).maxLength(100).optional()
  password?: string                // vine.string().minLength(6).maxLength(20).optional()
  phone_number?: string | null     // vine.string().nullable().optional()
}

// =============================================================================
// ADMIN - UTILISÉS ✅
// =============================================================================

export interface AdminUserCreationRequest {
  first_name: string               // vine.string().trim().minLength(2).maxLength(50)
  last_name: string                // vine.string().trim().minLength(2).maxLength(50)
  email: string                    // vine.string().email().normalizeEmail()
  password: string                 // vine.string().minLength(8).maxLength(100)
  phone_number?: string | null     // vine.string().optional().nullable()
  address?: string | null          // vine.string().optional().nullable()
  city: string                     // vine.string().trim().minLength(2).maxLength(100)
  postalCode: string               // vine.string().trim().minLength(2).maxLength(20) - ATTENTION: camelCase
  country: string                  // vine.string().trim().minLength(2).maxLength(100)
  roles?: ('livreur' | 'commercant' | 'prestataire' | 'administrateur')[]  // vine.array(vine.enum(...)).optional().nullable()
  privileges?: 'basic' | 'advanced' | 'super'  // vine.enum(['basic', 'advanced', 'super']).optional().nullable()
}

// =============================================================================
// ANNONCES - UTILISÉS ✅
// =============================================================================

export interface CreateAnnouncementRequest {
  utilisateur_id: number           // vine.number()
  title: string                    // vine.string().minLength(3).maxLength(50)
  description?: string             // vine.string().minLength(10).maxLength(500).optional()
  price: number                    // vine.number()
  tags?: string[]                  // vine.array(vine.string()).optional()
  type?: 'transport_colis' | 'service_personne'  // vine.enum(['transport_colis', 'service_personne']).optional()
  status?: 'active' | 'pending' | 'completed' | 'cancelled'  // vine.enum(['active', 'pending', 'completed', 'cancelled']).optional()
  desired_date?: string            // vine.string().optional() - NOUVEAU: remplace scheduled_date
  actual_delivery_date?: string    // vine.string().optional()
  end_location?: string            // vine.string().optional() - NOUVEAU: remplace destination_address
  start_location?: string          // vine.string().optional() - NOUVEAU: remplace starting_address
  priority?: boolean               // vine.boolean().optional()
  storage_box_id?: string          // vine.string().optional()
  image_path?: string              // vine.string().optional()
  insurance_amount?: number        // vine.number().optional() - NOUVEAU
}

export interface UpdateAnnouncementRequest {
  title?: string                   // vine.string().minLength(3).maxLength(50).optional()
  description?: string             // vine.string().minLength(10).maxLength(500).optional()
  price: number                    // vine.number()
  type?: 'transport_colis' | 'service_personne'  // vine.enum(['transport_colis', 'service_personne']).optional()
  status?: 'active' | 'pending' | 'completed' | 'cancelled'  // vine.enum(['active', 'pending', 'completed', 'cancelled']).optional()
  desired_date?: string            // vine.string().optional() - NOUVEAU: remplace scheduled_date
  actual_delivery_date?: string    // vine.string().optional()
  end_location?: string            // vine.string().optional() - NOUVEAU: remplace destination_address
  start_location?: string          // vine.string().optional() - NOUVEAU: remplace starting_address
  priority?: boolean               // vine.boolean().optional()
  storage_box_id?: string          // vine.string().optional()
  insurance_amount?: number        // vine.number().optional() - NOUVEAU
}

// =============================================================================
// RÉCLAMATIONS - UTILISÉS ✅
// =============================================================================

export interface CreateComplaintRequest {
  utilisateur_id: number           // vine.number().positive()
  subject: string                  // vine.string().minLength(3).maxLength(255)
  description: string              // vine.string().minLength(10)
  priority?: 'low' | 'medium' | 'high' | 'urgent'  // vine.enum(['low', 'medium', 'high', 'urgent']).optional()
  related_order_id?: string        // vine.string().optional()
}

export interface UpdateComplaintRequest {
  subject?: string                 // vine.string().minLength(3).maxLength(255).optional()
  description?: string             // vine.string().minLength(10).optional()
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'  // vine.enum(['open', 'in_progress', 'resolved', 'closed']).optional()
  priority?: 'low' | 'medium' | 'high' | 'urgent'  // vine.enum(['low', 'medium', 'high', 'urgent']).optional()
  admin_notes?: string             // vine.string().optional()
}

export interface ComplaintData {
  id: number
  utilisateurId: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  relatedOrderId: string | null
  imagePath: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  
  // Relation utilisateur chargée via preload
  utilisateur?: UserData
}

export interface ComplaintTransformed {
  id: number
  client: string
  email: string
  announceId: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  userId: number
}

// Interfaces pour les réponses API
export interface ComplaintsApiResponse {
  status: 'success' | 'error'
  complaints?: ComplaintData[]
  message?: string
}

export interface ComplaintApiResponse {
  status: 'success' | 'error'
  complaint?: ComplaintData
  message?: string
}

// =============================================================================
// MESSAGES - UTILISÉS PAS TOUCHE C'EST BON
// =============================================================================

export interface SendMessageRequest {
  senderId: number                 // vine.number().min(1) - ATTENTION: camelCase dans validator
  receiverId: number               // vine.number().min(1) - ATTENTION: camelCase dans validator
  content: string                  // vine.string().minLength(1)
  tempId?: string                  // vine.string().optional()
}

// =============================================================================
// JUSTIFICATIONS - UTILISÉS ✅
// =============================================================================

export interface JustificationPieceRequest {
  utilisateur_id: number           // vine.number().positive()
  document_type: string            // vine.string().minLength(2).maxLength(255)
  account_type: 'livreur' | 'commercant' | 'prestataire'  // vine.enum(['livreur', 'commercant', 'prestataire'])
  file?: File                      // FormData file upload
}

export interface JustificationPieceData {
  id: number
  utilisateur_id: number
  document_type: string
  file_path: string
  account_type: 'livreur' | 'commercant' | 'prestataire'
  verification_status: 'pending' | 'verified' | 'rejected'
  uploaded_at: string | null
  verified_at: string | null
  createdAt: string
  updatedAt: string
  
  // Relation utilisateur (chargée via preload)
  utilisateur?: UserData
}

export interface JustificationReviewRequest {
  comments?: string                // vine.string().optional()
}

// Interface pour les données transformées utilisées dans le frontend
export interface JustificationPieceTransformed {
  id: number
  utilisateur_id: number
  document_type: string
  file_path: string
  account_type: 'livreur' | 'commercant' | 'prestataire'
  verification_status: 'pending' | 'verified' | 'rejected'
  uploaded_at: string | null
  verified_at: string | null
  createdAt: string
  updatedAt: string
  
  // Propriétés extraites et calculées pour l'affichage
  firstName: string
  lastName: string
  email: string
  fileName: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewComments?: string
  reviewedBy?: string
}

// =============================================================================
// UTILISATEURS - UTILISÉS ✅
// =============================================================================

export interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
  address: string | null
  city: string
  postalCode: string
  country: string
  phone_number: string | null
  state: 'open' | 'banned' | 'closed'
  createdAt: string
  updatedAt: string | null
  
  // Relations optionnelles
  admin?: any
  client?: any
  livreur?: any
  prestataire?: any
  commercant?: any
}

// =============================================================================
// TYPES DE RÉPONSE API SPÉCIFIQUES - UTILISÉS ✅
// =============================================================================

export interface JustificationPiecesApiResponse {
  status: 'success' | 'error'
  data: JustificationPieceData[]
  message?: string
}

export interface JustificationVerifyApiResponse {
  status: 'success' | 'error'
  message: string
  data?: {
    validatedDocuments?: number
    reason?: string
  } | JustificationPieceData
}

export interface UsersApiResponse {
  status: 'success' | 'error'
  data?: UserData[]
  users?: UserData[]
  message?: string
}

export interface AdminDashboardStatsResponse {
  status: 'success' | 'error'
  data: {
    totalUsers: number
    totalDeliveries: number
    totalComplaints: number
    totalRevenue: number
    recentUsers: UserData[]
  }
  message?: string
}

// =============================================================================
// TYPES DE RÉPONSE GÉNÉRIQUES - UTILISÉS ✅
// =============================================================================

export interface BackendSuccessResponse<T = any> {
  data?: T
  message?: string
  [key: string]: any
}

export interface BackendErrorResponse {
  error_message: string
  error?: any
  message?: string
}

// =============================================================================
// VALIDATION HELPERS - UTILISÉS ✅
// =============================================================================

export function isBackendError(response: any): response is BackendErrorResponse {
  return response && (response.error_message || response.message)
}

export function getBackendErrorMessage(response: any): string {
  if (isBackendError(response)) {
    return response.error_message || response.message || 'Une erreur est survenue'
  }
  return 'Une erreur inconnue est survenue'
}

// =============================================================================
// VALIDATORS FRONTEND AVEC VÉRIFICATIONS STRICTES
// =============================================================================

/**
 * Validation côté frontend pour les données avant envoi au backend
 * Permet de valider en amont pour améliorer l'UX
 */
export class FrontendValidators {
  
  static validateLoginRequest(data: LoginRequest): string[] {
    const errors: string[] = []
    
    if (!data.email || !data.email.includes('@')) {
      errors.push('Email invalide')
    }
    
    if (!data.password || data.password.length < 6 || data.password.length > 20) {
      errors.push('Le mot de passe doit faire entre 6 et 20 caractères')
    }
    
    return errors
  }
  
  static validateRegisterRequest(data: RegisterRequest): string[] {
    const errors: string[] = []
    
    if (!data.first_name || data.first_name.length < 3 || data.first_name.length > 50) {
      errors.push('Le prénom doit faire entre 3 et 50 caractères')
    }
    
    if (!data.last_name || data.last_name.length < 3 || data.last_name.length > 50) {
      errors.push('Le nom doit faire entre 3 et 50 caractères')
    }
    
    if (!data.email || !data.email.includes('@')) {
      errors.push('Email invalide')
    }
    
    if (!data.password || data.password.length < 6 || data.password.length > 20) {
      errors.push('Le mot de passe doit faire entre 6 et 20 caractères')
    }
    
    if (data.password !== data.confirm_password) {
      errors.push('Les mots de passe ne correspondent pas')
    }
    
    if (!data.city || data.city.length < 2 || data.city.length > 100) {
      errors.push('La ville doit faire entre 2 et 100 caractères')
    }
    
    if (!data.postalCode || data.postalCode.length < 2 || data.postalCode.length > 20) {
      errors.push('Le code postal doit faire entre 2 et 20 caractères')
    }
    
    if (!data.country || data.country.length < 2 || data.country.length > 50) {
      errors.push('Le pays doit faire entre 2 et 50 caractères')
    }
    
    return errors
  }
  
  static validateAdminUserCreationRequest(data: AdminUserCreationRequest): string[] {
    const errors: string[] = []
    
    if (!data.first_name || data.first_name.trim().length < 2 || data.first_name.trim().length > 50) {
      errors.push('Le prénom doit faire entre 2 et 50 caractères')
    }
    
    if (!data.last_name || data.last_name.trim().length < 2 || data.last_name.trim().length > 50) {
      errors.push('Le nom doit faire entre 2 et 50 caractères')
    }
    
    if (!data.email || !data.email.includes('@')) {
      errors.push('Email invalide')
    }
    
    if (!data.password || data.password.length < 8 || data.password.length > 100) {
      errors.push('Le mot de passe doit faire entre 8 et 100 caractères')
    }
    
    if (!data.city || data.city.trim().length < 2 || data.city.trim().length > 100) {
      errors.push('La ville doit faire entre 2 et 100 caractères')
    }
    
    if (!data.postalCode || data.postalCode.trim().length < 2 || data.postalCode.trim().length > 20) {
      errors.push('Le code postal doit faire entre 2 et 20 caractères')
    }
    
    if (!data.country || data.country.trim().length < 2 || data.country.trim().length > 100) {
      errors.push('Le pays doit faire entre 2 et 100 caractères')
    }
    
    return errors
  }
  
  static validateCreateAnnouncementRequest(data: CreateAnnouncementRequest): string[] {
    const errors: string[] = []
    
    if (!data.title || data.title.length < 3 || data.title.length > 50) {
      errors.push('Le titre doit faire entre 3 et 50 caractères')
    }
    
    if (data.description && (data.description.length < 10 || data.description.length > 500)) {
      errors.push('La description doit faire entre 10 et 500 caractères')
    }
    
    if (!data.price || data.price <= 0) {
      errors.push('Le prix doit être supérieur à 0')
    }
    
    if (!data.utilisateur_id || data.utilisateur_id <= 0) {
      errors.push('ID utilisateur invalide')
    }
    
    return errors
  }
  
  static validateCreateComplaintRequest(data: CreateComplaintRequest): string[] {
    const errors: string[] = []
    
    if (!data.subject || data.subject.length < 3 || data.subject.length > 255) {
      errors.push('Le sujet doit faire entre 3 et 255 caractères')
    }
    
    if (!data.description || data.description.length < 10) {
      errors.push('La description doit faire au moins 10 caractères')
    }
    
    if (!data.utilisateur_id || data.utilisateur_id <= 0) {
      errors.push('ID utilisateur invalide')
    }
    
    return errors
  }
  
  static validateJustificationPieceRequest(data: JustificationPieceRequest): string[] {
    const errors: string[] = []
    
    if (!data.utilisateur_id || data.utilisateur_id <= 0) {
      errors.push('ID utilisateur invalide')
    }
    
    if (!data.document_type || data.document_type.length < 2 || data.document_type.length > 255) {
      errors.push('Le type de document doit faire entre 2 et 255 caractères')
    }
    
    if (!data.account_type || !['livreur', 'commercant', 'prestataire'].includes(data.account_type)) {
      errors.push('Type de compte invalide')
    }
    
    return errors
  }
  
  static validateJustificationReviewRequest(data: JustificationReviewRequest): string[] {
    const errors: string[] = []
    
    // Les commentaires sont optionnels, mais s'ils sont fournis, ils doivent avoir une longueur raisonnable
    if (data.comments && data.comments.length > 1000) {
      errors.push('Les commentaires ne peuvent pas dépasser 1000 caractères')
    }
    
    return errors
  }
  
  static validateUpdateComplaintRequest(data: UpdateComplaintRequest): string[] {
    const errors: string[] = []
    
    if (data.subject && (data.subject.length < 3 || data.subject.length > 255)) {
      errors.push('Le sujet doit faire entre 3 et 255 caractères')
    }
    
    if (data.description && data.description.length < 10) {
      errors.push('La description doit faire au moins 10 caractères')
    }
    
    if (data.status && !['open', 'in_progress', 'resolved', 'closed'].includes(data.status)) {
      errors.push('Statut invalide')
    }
    
    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Priorité invalide')
    }
    
    return errors
  }
} 