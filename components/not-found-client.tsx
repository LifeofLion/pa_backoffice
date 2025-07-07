"use client"

import ErrorPage from "@/components/error-page"
import { useLanguage } from "@/components/language-context"

export default function NotFoundClient() {
  const { t } = useLanguage()

  return (
    <ErrorPage statusCode="404" title={t("errors.pageNotFound")} description={t("errors.pageNotFoundDescription")} />
  )
}