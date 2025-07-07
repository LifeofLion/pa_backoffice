"use client"

import { useEffect } from "react"
import ErrorPage from "@/components/error-page"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return <ErrorPage statusCode={error.digest ? error.digest.substring(0, 3) : "500"} showRetry={true} onRetry={reset} />
}