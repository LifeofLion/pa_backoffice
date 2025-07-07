"use client"

import { useLanguage } from "./language-context"

export default function ExampleComponent() {
  const { t } = useLanguage()

  return (
    <div>
      <h1>{t("app_client.welcome")}</h1>
      <p>{t("auth.pleaseEnterEmailPassword")}</p>
      <button>{t("common.login")}</button>
    </div>
  )
}

