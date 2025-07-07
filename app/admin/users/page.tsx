'use client'

import React from 'react'
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { UsersContent } from '@/components/back-office/users-content'
import { useRequireRole } from '@/src/hooks/use-auth'

/**
 * Page Gestion Utilisateurs Admin utilisant l'architecture /src
 */
export default function UsersPage() {
  // Protection par rôle avec l'architecture /src
  const isAuthorized = useRequireRole('admin')

  if (!isAuthorized) {
    return null // Redirection en cours
  }

  return (
    <BackOfficeLayout activeRoute="users">
      <UsersContent />
    </BackOfficeLayout>
  )
}
