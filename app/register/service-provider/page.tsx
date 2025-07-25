"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Register } from "@/src/components/refactored/auth"
import { apiClient } from "@/src/lib/api"
import { API_ROUTES } from "@/src/lib/api-routes"

export default function ServiceProviderRegisterPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      
      if (!token) {
        // Pas connecté, afficher le formulaire
        setShowForm(true)
        setIsChecking(false)
        return
      }

      // Récupérer les données de l'utilisateur
      const currentUser = await apiClient.getCurrentUser()
      
      // Vérifier si l'utilisateur a déjà le rôle prestataire
      const hasRole = !!currentUser.prestataire
      
      if (hasRole) {
        console.log(`✅ User already has service-provider role`)
        
        // Vérifier le statut des documents justificatifs
        const justifications = await apiClient.get(API_ROUTES.JUSTIFICATION.BY_USER(currentUser.id.toString()))
        const hasValidatedDocs = checkDocumentsValidated(justifications)
        
        if (hasValidatedDocs) {
          console.log(`✅ User documents validated, redirecting to /app_service-provider`)
          router.push('/app_service-provider')
          return
        } else {
          console.log(`⚠️ User has role but documents not validated, showing form`)
          setShowForm(true)
        }
      } else {
        // L'utilisateur n'a pas le rôle, afficher le formulaire
        console.log(`ℹ️ User doesn't have service-provider role, showing form`)
        setShowForm(true)
      }
      
    } catch (error) {
      console.error('Error checking user status:', error)
      // En cas d'erreur, afficher le formulaire
      setShowForm(true)
    } finally {
      setIsChecking(false)
    }
  }

  const checkDocumentsValidated = (justifications: any): boolean => {
    try {
      const data = Array.isArray(justifications.data) ? justifications.data : 
                   Array.isArray(justifications) ? justifications : []
      
      console.log('🔍 DEBUG checkDocumentsValidated - Raw data:', data)
      
      // Filtrer les justifications pour prestataire - support camelCase et snake_case
      const userJustifications = data.filter((j: any) => {
        const accountType = j.account_type || j.accountType
        console.log(`🔍 Document ${j.id} - accountType: ${accountType}`)
        return accountType === 'prestataire'
      })
      
      console.log('🔍 Justifications filtrées pour prestataire:', userJustifications.length)
      
      if (userJustifications.length === 0) {
        console.log('❌ Aucun document prestataire trouvé')
        return false // Aucun document soumis
      }
      
      // Vérifier si au moins un document est validé - support camelCase et snake_case
      const hasVerifiedDoc = userJustifications.some((j: any) => {
        const verificationStatus = j.verification_status || j.verificationStatus
        console.log(`🔍 Document verification status: ${verificationStatus}`)
        return verificationStatus === 'verified'
      })
      
      console.log('🔍 A un document vérifié:', hasVerifiedDoc)
      return hasVerifiedDoc
    } catch (error) {
      console.error('Error checking documents:', error)
      return false
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-200">
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-md text-center">
          <div className="animate-spin h-8 w-8 border-2 border-green-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre statut...</p>
        </div>
      </div>
    )
  }

  if (!showForm) {
    return null // Redirection en cours
  }

  return <Register accountType="service-provider" />
}

