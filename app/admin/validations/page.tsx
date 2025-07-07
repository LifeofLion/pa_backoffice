'use client'

import React from 'react'
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { ValidationsContent } from '@/components/back-office/validations-content'
import { useRequireRole } from '@/src/hooks/use-auth'

/**
 * Page Validations Admin utilisant l'architecture /src
 */
export default function ValidationsPage() {
  // Protection par rôle avec l'architecture /src
  const isAuthorized = useRequireRole('admin', '/login')

  if (!isAuthorized) {
    return null // Redirection en cours
  }

  return (
    <BackOfficeLayout activeRoute="validations">
      <ValidationsContent />
    </BackOfficeLayout>
  )
}