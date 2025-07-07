'use client'

import React from 'react'
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { ComplaintsContent } from '@/components/back-office/complaints-content'
import { useRequireRole } from '@/src/hooks/use-auth'

/**
 * Page Gestion Réclamations Admin utilisant l'architecture /src
 */
export default function ComplaintsPage() {
  // Protection par rôle avec l'architecture /src
  const isAuthorized = useRequireRole('admin', '/login')

  if (!isAuthorized) {
    return null // Redirection en cours
  }

  return (
    <BackOfficeLayout activeRoute="complaints">
      <ComplaintsContent />
    </BackOfficeLayout>
  )
}
