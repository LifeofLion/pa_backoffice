'use client'

import React from 'react'
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { FinanceContent } from '@/components/back-office/finance-content'
import { useRequireRole } from '@/src/hooks/use-auth'

/**
 * Page Finance Admin utilisant l'architecture /src
 */
export default function FinancePage() {
  // Protection par rôle avec l'architecture /src
  const isAuthorized = useRequireRole('admin', '/login')

  if (!isAuthorized) {
    return null // Redirection en cours
  }

  return (
    <BackOfficeLayout activeRoute="finance">
      <FinanceContent />
    </BackOfficeLayout>
  )
}
