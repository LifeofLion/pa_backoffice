"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import { apiClient, getErrorMessage } from "@/src/lib/api"
import { API_ROUTES } from "@/src/lib/api-routes"
import type { RegisterRequest } from "@/src/types/validators"

export default function VerifyEmail() {
  const router = useRouter()
  const [code, setCode] = useState<string[]>(Array(6).fill(""))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ✅ FONCTION DE MAPPING FRONTEND → BACKEND
  const mapFormDataToRegisterRequest = (frontendData: any): RegisterRequest => {
    return {
      first_name: frontendData.firstname || frontendData.first_name,
      last_name: frontendData.name || frontendData.last_name,
      email: frontendData.email,
      address: frontendData.address || null,
      city: frontendData.city,
      postalCode: frontendData.postalCode,
      country: frontendData.country,
      password: frontendData.password,
      confirm_password: frontendData.confirmPassword || frontendData.confirm_password,
      phone_number: frontendData.phone || frontendData.phone_number || null,
      // Note: dateOfBirth est ignoré car non supporté par le backend
    }
  }

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !canResend) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d*$/.test(value)) return

    // Effacer les messages d'erreur/succès quand l'utilisateur tape
    if (error) setError("")
    if (successMessage) setSuccessMessage("")

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    if (/^\d{1,6}$/.test(pastedData)) {
      const newCode = [...code]

      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newCode[i] = pastedData[i]
      }

      setCode(newCode)

      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccessMessage("") // Effacer le message de succès lors de la soumission

    const verificationCode = code.join("")
    const stored = sessionStorage.getItem("signupInfo")

    if (!stored) {
      setError("No signup data found")
      setIsSubmitting(false)
      return
    }

    const { formData } = JSON.parse(stored)

    if (verificationCode.length !== 6) {
      setError("Please enter complete verification code")
      setIsSubmitting(false)
      return
    }

    try {
      // ✅ UTILISATION DU CLIENT API CENTRALISÉ
      const checkResult = await apiClient.post(API_ROUTES.TEMP_CODE.CHECK, {
        user_info: JSON.stringify(formData), // ✅ MÊME FORMAT QUE GENERATE-CODE
        code: verificationCode
      })

      console.log('✅ Code verification successful:', checkResult)
      
      // ✅ MAPPER LES DONNÉES FRONTEND → BACKEND FORMAT
      const backendFormData = mapFormDataToRegisterRequest(formData)
      console.log('🔄 Mapped data for backend:', backendFormData)
      
      // Le code est valide, maintenant créer l'utilisateur avec les bonnes données
      const registerResult = await apiClient.register(backendFormData)

      console.log('✅ Registration successful:', registerResult)
      
      // Nettoyer sessionStorage
      sessionStorage.removeItem("signupInfo")
      
      // Rediriger vers la page de succès
      router.push("/verification-success")
      
    } catch (err) {
      console.error('🔴 Error during verification:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend) return

    const stored = sessionStorage.getItem("signupInfo")
    if (!stored) {
      setError("No signup data found")
      return
    }

    const { formData } = JSON.parse(stored)

    try {
      setCanResend(false)
      setCountdown(60)
      setError("") // Effacer l'erreur précédente
      
      // ✅ UTILISATION DU CLIENT API CENTRALISÉ
      const result = await apiClient.post(API_ROUTES.TEMP_CODE.RESET, {
        user_info: JSON.stringify(formData)
      })

      console.log('✅ Code resent successfully:', result)
      setSuccessMessage("Code resent successfully! Check your email.")
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

    } catch (err) {
      console.error('🔴 Error resending code:', err)
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="absolute top-4 right-4 mr-8">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto mx-auto" />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">Verify Email</h1>

        <p className="text-gray-600 text-center mb-8">Verification code sent to your email</p>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md mb-6 text-center">{error}</div>}

        {successMessage && <div className="bg-green-50 text-green-500 p-3 rounded-md mb-6 text-center">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el: HTMLInputElement | null) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-50"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-green-50 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendCode}
            disabled={!canResend}
            className="text-green-50 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {canResend ? "Resend Code" : `Resend code in ${countdown}s`}
          </button>
        </div>

        <div className="text-center mt-6">
          <Link href="/signin" className="text-gray-500 hover:text-green-50">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
} 