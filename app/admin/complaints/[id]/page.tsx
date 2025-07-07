"use client"

import { AnalyzeComplaintContent } from "@/components/back-office/analyze-complaint-content"
import BackOfficeLayout from '@/src/components/layouts/back-office-layout'
import { useRequireRole } from '@/src/hooks/use-auth'

interface AnalyzeComplaintPageProps {
  params: {
    id: string
  }
}

export default function AnalyzeComplaintPage({ params }: AnalyzeComplaintPageProps) {
  const isAuthorized = useRequireRole('admin', '/login')
  
  if (!isAuthorized) return null

  return (
    <BackOfficeLayout activeRoute="complaints">
      <AnalyzeComplaintContent id={params.id} />
    </BackOfficeLayout>
  )
}

