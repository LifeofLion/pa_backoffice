"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/components/language-context"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ici vous pouvez ajouter la logique de récupération de mot de passe
    console.log("Password reset requested for:", email)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4">
        {!submitted ? (
          <>
            <div className="text-center mb-12">
              <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto mx-auto" />
            </div>

            <h2 className="text-2xl font-semibold text-center mb-16">Forgot Password</h2>

            <form onSubmit={handleSubmit} className="space-y-16">
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-green-50 text-white rounded-md hover:bg-green-400 transition-colors"
              >
                Send Email
              </button>
            </form>

            <div className="text-center mt-8">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/signin" className="text-green-50 hover:underline">
                Create Account
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-12">
              <Image src="/logo.png" alt="EcoDeli" width={120} height={40} className="h-auto mx-auto" />
            </div>

            <div className="text-center py-8">
              <svg
                className="w-16 h-16 text-green-50 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl font-semibold mb-2">Email Sent</h2>
              <p className="text-gray-600 mb-6">
                Password reset link sent to {email}
              </p>

              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-green-50 text-white rounded-md hover:bg-green-400 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 