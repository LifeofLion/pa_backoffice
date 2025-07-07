'use client'

import React from 'react'
import { DashboardContent } from '@/components/back-office/dashboard-content'

/**
 * Dashboard Admin refactorisé utilisant l'architecture /src
 * Remplace /app/admin/page.tsx en gardant la même UI
 */
export default function AdminDashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Contenu du dashboard - UI inchangée */}
      <div className="p-4 md:p-6">
        <DashboardContent />
      </div>
    </div>
  )
} 