"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/src/lib/api"
import { API_ROUTES } from "@/src/lib/api-routes"
import { useAuth } from "@/src/hooks/use-auth"

interface SmartRegisterLinkProps {
  accountType: "delivery-man" | "service-provider" | "shopkeeper"
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Composant intelligent qui vérifie le statut de l'utilisateur avant de rediriger
 * vers la bonne page (app ou registration)
 */
export function SmartRegisterLink({ 
  accountType, 
  children, 
  className = "", 
  onClick 
}: SmartRegisterLinkProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isChecking, setIsChecking] = useState(false)

  // Configuration pour chaque type de compte
  const accountConfig = {
    "delivery-man": {
      role: "livreur",
      appPath: "/app_deliveryman",
      registerPath: "/register/delivery-man"
    },
    "service-provider": {
      role: "prestataire", 
      appPath: "/app_service-provider",
      registerPath: "/register/service-provider"
    },
    "shopkeeper": {
      role: "commercant",
      appPath: "/app_shopkeeper",
      registerPath: "/register/shopkeeper"
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (onClick) {
      onClick()
    }

    if (!user) {
      // Utilisateur non connecté, aller vers l'inscription
      router.push(accountConfig[accountType].registerPath)
      return
    }

    setIsChecking(true)

    try {
      const config = accountConfig[accountType]
      
      // Vérifier si l'utilisateur a déjà le rôle demandé
      const hasRole = checkUserHasRole(user, config.role)
      
      if (hasRole) {
        console.log(`✅ User already has role: ${config.role}`)
        
        // Vérifier le statut des documents justificatifs
        const justifications = await apiClient.get(API_ROUTES.JUSTIFICATION.BY_USER(user.id.toString()))
        const hasValidatedDocs = checkDocumentsValidated(justifications, config.role)
        
        if (hasValidatedDocs) {
          console.log(`✅ User documents validated, redirecting to ${config.appPath}`)
          router.push(config.appPath)
        } else {
          console.log(`⚠️ User has role but documents not validated, going to registration`)
          router.push(config.registerPath)
        }
      } else {
        // L'utilisateur n'a pas le rôle, aller vers l'inscription
        console.log(`ℹ️ User doesn't have role ${config.role}, going to registration`)
        router.push(config.registerPath)
      }
      
    } catch (error) {
      console.error('Error checking user status:', error)
      // En cas d'erreur, aller vers l'inscription
      router.push(accountConfig[accountType].registerPath)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <a
      href={accountConfig[accountType].registerPath}
      className={`${className} ${isChecking ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      onClick={handleClick}
    >
      {isChecking ? "Vérification..." : children}
    </a>
  )
} 