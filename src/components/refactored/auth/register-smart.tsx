"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/components/language-context"
import { apiClient, getErrorMessage } from "@/src/lib/api"
import { API_ROUTES } from "@/src/lib/api-routes"

interface RegisterProps {
  accountType: "delivery-man" | "service-provider" | "shopkeeper"
}

export default function RegisterSmart({ accountType }: RegisterProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState("")

  // Mapping des types de comptes pour l'affichage et les routes
  const accountTypeConfig = {
    "delivery-man": {
      label: "Delivery man",
      role: "livreur",
      appPath: "/app_deliveryman",
      documentsPath: "/documents-verification/deliveryman"
    },
    "service-provider": {
      label: "Service Provider",
      role: "prestataire",
      appPath: "/app_service-provider",
      documentsPath: "/documents-verification/service-provider"
    },
    "shopkeeper": {
      label: "Shopkeeper",
      role: "commercant",
      appPath: "/app_shopkeeper",
      documentsPath: "/documents-verification/shopkeeper"
    }
  }

  // Vérifier le statut de l'utilisateur au chargement
  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    setIsCheckingStatus(true)
    try {
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      
      if (!token) {
        // Pas connecté, continuer avec le formulaire d'inscription
        setIsCheckingStatus(false)
        return
      }

      // Récupérer les données de l'utilisateur
      const currentUser = await apiClient.getCurrentUser()
      const config = accountTypeConfig[accountType]
      
      // Vérifier si l'utilisateur a déjà le rôle demandé
      const hasRole = checkUserHasRole(currentUser, config.role)
      
      if (hasRole) {
        console.log(`✅ User already has role: ${config.role}`)
        
        // Vérifier le statut des documents justificatifs
        const justifications = await apiClient.get(API_ROUTES.JUSTIFICATION.BY_USER(currentUser.id.toString()))
        const hasValidatedDocs = checkDocumentsValidated(justifications, config.role)
        
        if (hasValidatedDocs) {
          console.log(`✅ User documents validated, redirecting to ${config.appPath}`)
          router.push(config.appPath)
          return
        } else {
          console.log(`⚠️ User has role but documents not validated, redirecting to ${config.documentsPath}`)
          router.push(config.documentsPath) 
          return
        }
      }
      
      // L'utilisateur n'a pas le rôle, continuer avec le formulaire
      console.log(`ℹ️ User doesn't have role ${config.role}, showing registration form`)
      setIsCheckingStatus(false)
      
    } catch (error) {
      console.error('Error checking user status:', error)
      // En cas d'erreur, continuer avec le formulaire
      setIsCheckingStatus(false)
    }
  }

  const checkUserHasRole = (user: any, role: string): boolean => {
    switch (role) {
      case 'livreur':
        return !!user.livreur
      case 'prestataire':
        return !!user.prestataire
      case 'commercant':
        return !!user.commercant
      default:
        return false
    }
  }

  const checkDocumentsValidated = (justifications: any, accountType: string): boolean => {
    try {
      const data = Array.isArray(justifications.data) ? justifications.data : 
                   Array.isArray(justifications) ? justifications : []
      
      // Filtrer les justifications pour ce type de compte
      const userJustifications = data.filter((j: any) => j.account_type === accountType)
      
      if (userJustifications.length === 0) {
        return false // Aucun document soumis
      }
      
      // Vérifier si au moins un document est validé
      return userJustifications.some((j: any) => j.verification_status === 'verified')
    } catch (error) {
      console.error('Error checking documents:', error)
      return false
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation basique
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Vérifier s'il y a un token d'authentification existant
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      
      if (!token) {
        // Pas de token, rediriger vers login
        localStorage.removeItem('authToken')
        sessionStorage.removeItem('authToken')
        router.push('/login')
        return
      }

      // Vérifier l'utilisateur actuellement connecté
      const currentUser = await apiClient.getCurrentUser()
      
      // Vérifier que les credentials correspondent à l'utilisateur connecté
      const loginResponse = await apiClient.login(formData.email, formData.password)

      if (currentUser.email !== loginResponse.user.email) {
        console.log('Token mismatch')
        throw new Error('Token mismatch - Please login again')
      }

      // Rediriger vers la page de vérification de documents appropriée
      const redirectPath = accountTypeConfig[accountType].documentsPath
      router.push(redirectPath)

    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(`Registration verification failed: ${errorMessage}`)
      console.error('Registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Afficher un loader pendant la vérification du statut
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-200">
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre statut...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-200">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Create an Account
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Create an account as a {accountTypeConfig[accountType].label}
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">
              Confirm Email address:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-green-300 text-gray-700 rounded-md hover:bg-green-400 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="text-green-500 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
} 