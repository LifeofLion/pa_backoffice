import { AppConfig } from '@/src/types'

// =============================================================================
// CONFIGURATION DE L'APPLICATION
// =============================================================================

/**
 * Configuration centralisée de l'application EcoDeli
 */
export const appConfig: AppConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
  oneSignalAppId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
  supportedLanguages: ['fr', 'en', 'es'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'],
}

// =============================================================================
// UTILITAIRES DE VALIDATION D'ENVIRONNEMENT
// =============================================================================

/**
 * Vérifie que toutes les variables d'environnement requises sont définies
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_API_URL',
    // 'NEXT_PUBLIC_STRIPE_PUBLIC_KEY', // Optionnel pour le dev
    // 'NEXT_PUBLIC_ONESIGNAL_APP_ID',  // Optionnel pour le dev
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    isValid: missing.length === 0,
    missing,
  }
}

/**
 * Affiche des avertissements pour les variables d'environnement manquantes
 */
export function warnMissingEnvVars(): void {
  const { isValid, missing } = validateEnvironment()

  if (!isValid) {
    console.warn('⚠️ Variables d\'environnement manquantes:', missing)
    console.warn('Certaines fonctionnalités pourraient ne pas fonctionner correctement.')
  }

  // Avertissements pour les variables optionnelles
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    console.warn('⚠️ NEXT_PUBLIC_STRIPE_PUBLIC_KEY manquante - Les paiements seront désactivés')
  }

  if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
    console.warn('⚠️ NEXT_PUBLIC_ONESIGNAL_APP_ID manquante - Les notifications push seront désactivées')
  }
}

// =============================================================================
// CONSTANTES UTILES
// =============================================================================

/**
 * Routes publiques accessibles sans authentification
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signin',
  '/forgot-password',
  '/verify-email',
  '/verification-success',
  '/legal-notice',
]

/**
 * Routes qui redirigent vers le dashboard si l'utilisateur est déjà connecté
 */
export const AUTH_REDIRECT_ROUTES = [
  '/login',
  '/signin',
]

/**
 * Routes des dashboards par rôle
 */
export const DASHBOARD_ROUTES = {
  client: '/app_client',
  delivery_man: '/app_deliveryman',
  service_provider: '/app_service-provider',
  shopkeeper: '/app_shopkeeper',
  admin: '/admin',
} as const

/**
 * Messages d'erreur par défaut
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  AUTH_REQUIRED: 'Vous devez être connecté pour accéder à cette page',
  PERMISSION_DENIED: 'Vous n\'avez pas les permissions nécessaires',
  INVALID_TOKEN: 'Votre session a expiré, veuillez vous reconnecter',
  VALIDATION_ERROR: 'Veuillez vérifier les informations saisies',
  UNKNOWN_ERROR: 'Une erreur inattendue est survenue',
} as const

/**
 * Paramètres par défaut de l'application
 */
export const APP_DEFAULTS = {
  LANGUAGE: 'fr',
  CURRENCY: 'EUR',
  TIMEZONE: 'Europe/Paris',
  DATE_FORMAT: 'dd/MM/yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
} as const