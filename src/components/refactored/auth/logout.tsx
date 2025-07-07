'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LanguageSelector from '@/components/language-selector'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/src/hooks/use-auth'

// =============================================================================
// COMPOSANT LOGOUT REFACTORISÉ
// =============================================================================

export default function Logout() {
  const router = useRouter()
  const { t } = useLanguage()
  const { logout } = useAuth()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // ✨ Utilisation de notre hook useAuth - FINI la gestion manuelle des tokens !
        await logout()
        
        // Petit délai pour l'UX
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        // Redirection automatique
        router.push('/')
      } catch (error) {
        console.error('Logout error:', error)
        // Même en cas d'erreur, on redirige l'utilisateur
        router.push('/')
      }
    }

    handleLogout()
  }, [logout, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md text-center">
        <h1 className="text-2xl font-semibold mb-4">
          {t('auth.loggingOut')}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {t('auth.pleaseWaitLogout')}
        </p>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
        </div>
      </div>
    </div>
  )
} 