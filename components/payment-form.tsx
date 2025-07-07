"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, CheckCircle } from "lucide-react"

interface PaymentFormProps {
  amount: string
  itemId: string
  itemName: string
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentForm({ amount, itemId, itemName, onSuccess, onCancel }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setPaymentStatus("processing")

    try {
      // In a real implementation, this would create a payment intent with Stripe
      // and handle the payment flow

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate successful payment
      setPaymentStatus("success")

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (error) {
      console.error("Payment error:", error)
      setPaymentStatus("error")
      setErrorMessage("An error occurred during payment processing. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full">
      {paymentStatus === "success" ? (
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-6">Thank you for your payment. Your transaction has been completed.</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Item:</span>
                  <span className="font-medium">{itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">£{amount}</span>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-16 bg-blue-600 rounded-md mr-3 flex items-center justify-center text-white">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Credit Card ending in 4242</p>
                    <p className="text-sm text-gray-500">Expires 12/25</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <p>For demo purposes, payment will be simulated.</p>
                  <p>In a real application, this would use Stripe Elements for secure payment processing.</p>
                </div>
              </div>
            </div>

            {paymentStatus === "error" && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{errorMessage}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 bg-green-50 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Pay now"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

