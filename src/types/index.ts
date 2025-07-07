// =============================================================================
// TYPES UTILISATEUR ET AUTHENTIFICATION
// =============================================================================
export type UserRole =
  | 'client'
  | 'admin'
  | 'shopkeeper'
  | 'service_provider'
  | 'delivery_man'
  | 'guest'

// Relations du backend
export interface AdminRelation {
  id: number
  privileges: string
  createdAt: string
  updatedAt: string
}

export interface ClientRelation {
  id: number
  loyalty_points: number
  preferred_payment_method: string | null
  createdAt: string
  updatedAt: string
}

export interface LivreurRelation {
  id: number
  availabilityStatus: 'available' | 'busy' | 'offline'
  rating: number | null
  totalDeliveries: number
  vehicleType: string
  vehicleNumber: string
  createdAt: string
  updatedAt: string
}

export interface PrestataireRelation {
  id: number
  service_type: string | null
  rating: number | null
  createdAt: string
  updatedAt: string
}

export interface CommercantRelation {
  id: number
  storeName: string
  businessAddress: string | null
  verificationState: 'pending' | 'verified' | 'rejected'
  contactNumber: string | null
  contractStartDate: string
  contractEndDate: string
  createdAt: string
  updatedAt: string
}

// Utilisateur tel que renvoyé par le backend (camelCase)
export interface User {
  id: number
  firstName: string               // camelCase dans la réponse
  lastName: string                // camelCase dans la réponse
  email: string
  phoneNumber?: string | null     // camelCase dans la réponse
  address?: string | null
  city: string
  postalCode: string              // camelCase dans la réponse
  country: string
  state: 'open' | 'closed' | 'banned'
  createdAt: string
  updatedAt: string | null
  
  // Relations (présentes selon le rôle de l'utilisateur)
  admin?: AdminRelation
  client?: ClientRelation
  livreur?: LivreurRelation
  prestataire?: PrestataireRelation
  commercant?: CommercantRelation
}

// Fonction utilitaire pour déterminer le rôle depuis les relations
export function getUserRole(user: User): UserRole {
  if (user.admin) return 'admin'
  if (user.livreur) return 'delivery_man'
  if (user.prestataire) return 'service_provider'
  if (user.commercant) return 'shopkeeper'
  if (user.client) return 'client'
  return 'guest'
}

// Fonction utilitaire pour obtenir le nom complet
export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// =============================================================================
// TYPES API ET RÉPONSES
// =============================================================================

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  status: number
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    totalPages: number
    perPage: number
    total: number
  }
}

// =============================================================================
// TYPES MÉTIER ECODELI
// =============================================================================

export interface Announcement {
  id: string
  title: string
  description: string
  price: number
  location: string
  deliveryDate: string
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  clientId: string
  livreurId?: string
  createdAt: string
}

export interface Delivery {
  id: string
  announcementId: string
  livreurId: string
  clientId: string
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
  pickupAddress: string
  deliveryAddress: string
  scheduledDate: string
  completedAt?: string
  trackingCode?: string
  amount: number
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  providerId: string
  categoryId: string
  images: string[]
  rating: number
  reviewsCount: number
  isActive: boolean
}

export interface Complaint {
  id: string
  announcementId: string
  clientId: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  attachments: string[]
  createdAt: string
  resolvedAt?: string
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  stripePaymentIntentId?: string
  createdAt: string
  completedAt?: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  conversationId: string
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

// =============================================================================
// TYPES FORMULAIRES ET VALIDATION
// =============================================================================

export interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  phone_number: string
  address: string
  city: string
  postal_code: string
  country: string
  role: UserRole
}

export interface CreateAnnouncementForm {
  title: string
  description: string
  price: number
  pickupAddress: string
  deliveryAddress: string
  scheduledDate: string
  packageSize: 'small' | 'medium' | 'large'
  fragile: boolean
}

export interface CreateComplaintForm {
  announcementId: string
  title: string
  description: string
  attachments: File[]
}

// =============================================================================
// TYPES NAVIGATION ET UI
// =============================================================================

export interface NavigationItem {
  href: string
  label: string
  icon: any // On laisse any pour éviter les erreurs React pour le moment
  isActive?: boolean
  badge?: number
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface TabItem {
  id: string
  label: string
  content: any // On laisse any pour éviter les erreurs React pour le moment
}

// =============================================================================
// TYPES CONFIGURATION ET ENVIRONMENT
// =============================================================================

export interface AppConfig {
  apiUrl: string
  stripePublicKey: string
  oneSignalAppId: string
  supportedLanguages: string[]
  maxFileSize: number
  allowedFileTypes: string[]
}

// =============================================================================
// TYPES UTILITAIRES
// =============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Theme = 'light' | 'dark' | 'system'

export type Language = 'fr' | 'en' | 'es'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

// =============================================================================
// TYPES PIÈCES JUSTIFICATIVES
// =============================================================================

export interface JustificationPiece {
  id: number
  utilisateur_id: number
  document_type: 'idCard' | 'drivingLicence' | 'serviceCertificate'
  file_path: string
  account_type: 'livreur' | 'prestataire' | 'commercant'
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_at?: string | null
  createdAt: string
  updatedAt: string
  utilisateur?: User
}

export interface JustificationPiecesResponse {
  status: 'success' | 'error'
  data: JustificationPiece[]
  message?: string
}
