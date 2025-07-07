"use client"

import { AddUsersContent } from "@/components/back-office/add-users-content"
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { useRequireRole } from '@/src/hooks/use-auth'

export default function AddAdministratorPage() {
  const isAuthorized = useRequireRole('admin', '/login')
  
  if (!isAuthorized) return null

  return (
    <BackOfficeLayout activeRoute="users">
      <AddUsersContent />
    </BackOfficeLayout>
  )
}

