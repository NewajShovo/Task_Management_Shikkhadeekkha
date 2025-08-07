"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem("user")
    if (user) {
      try {
        const userData = JSON.parse(user)
        if (userData.isAuthenticated) {
          if (userData.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        } else {
          router.push("/welcome")
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        router.push("/welcome")
      }
    } else {
      router.push("/welcome")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
