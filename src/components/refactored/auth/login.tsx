'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSelector from '@/components/language-selector'
import { useLanguage } from '@/components/language-context'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/hooks/use-auth'
import { getErrorMessage } from '@/src/lib/api'
import { LoginRequest, FrontendValidators } from '@/src/types/validators'


export default function Login() {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  })
  const [rememberPassword, setRememberPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const router = useRouter()
  const { t } = useLanguage()
  const { login, isAuthenticated, user, getUserRole } = useAuth()

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = getUserRole()
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/app_client')
      }
    }
  }, [isAuthenticated, user, getUserRole, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const frontendErrors = FrontendValidators.validateLoginRequest(formData)
    
    if (frontendErrors.length > 0) {
      setValidationErrors(frontendErrors)
      setError('')
      return
    }
    
    setValidationErrors([])
    setError('')
    setIsLoading(true)

    try {
      await login(formData.email, formData.password, rememberPassword)
      
      const role = getUserRole()
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/app_client')
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage || t('auth.loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // Si déjà en cours de chargement de l'auth
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md mx-auto">
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-4">{t("auth.loginToAccount")}</h1>

        <p className="text-gray-600 text-center mb-6">{t("auth.pleaseEnterEmailPassword")}</p>

        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <div className="font-medium text-sm mb-1">
              ❌ Erreurs de validation ({validationErrors.length})
            </div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">
              {t("auth.emailAddress")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("auth.emailAddress")}
              className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
              <label htmlFor="password" className="block text-gray-700">
                {t("auth.password")}
              </label>
              <Link href="/forgot-password" className="text-gray-500 text-sm hover:text-green-500 mt-1 sm:mt-0">
                {t("auth.forgetPassword")}
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("auth.password")}
              className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberPassword}
              onChange={(e) => setRememberPassword(e.target.checked)}
              className="h-4 w-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              disabled={isLoading}
            />
            <label htmlFor="remember" className="ml-2 block text-gray-700">
              {t("auth.rememberPassword")}
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Connexion...' : t('auth.signIn')}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-600">{t("auth.dontHaveAccount")} </span>
          <Link href="/signin" className="text-green-500 hover:underline">
            {t("auth.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  )
} 