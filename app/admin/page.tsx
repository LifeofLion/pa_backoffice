'use client'

import React from 'react'
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { DashboardContent } from '@/components/back-office/dashboard-content'
import { useRequireRole } from '@/src/hooks/use-auth'

/**
 * Page Dashboard Admin utilisant l'architecture /src
 * Utilise BackOfficeLayout centralisé et les hooks d'authentification robustes
 */
export default function DashboardPage() {
  // Protection par rôle avec l'architecture /src
  const isAuthorized = useRequireRole('admin', '/login')

  if (!isAuthorized) {
    return null // Redirection en cours
  }

  return (
    <BackOfficeLayout activeRoute="dashboard">
      <DashboardContent />
    </BackOfficeLayout>
  )
}
