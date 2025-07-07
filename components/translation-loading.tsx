"use client"

import type React from "react"

import { useLanguage } from "./language-context"

export function TranslationLoading({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
