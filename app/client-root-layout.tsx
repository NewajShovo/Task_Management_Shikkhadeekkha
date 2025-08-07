"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import ClientLayout from "./client-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Check authentication status
  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      try {
        const userData = JSON.parse(user)
        setIsAuthenticated(userData.isAuthenticated || false)
        setUserRole(userData.role || null)
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname.startsWith("/auth")
      const isAdminPage = pathname.startsWith("/admin")
      const isWelcomePage = pathname === "/welcome"

      if (!isAuthenticated && !isAuthPage && !isWelcomePage) {
        router.push("/auth/login")
      } else if (isAuthenticated && (isAuthPage || pathname === "/")) {
        if (userRole === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [isAuthenticated, pathname, router, isLoading, userRole])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Auth pages and admin pages don't need the main layout
  const isAuthPage = pathname.startsWith("/auth")
  const isAdminPage = pathname.startsWith("/admin")
  const isWelcomePage = pathname === "/welcome"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {isAuthPage || isAdminPage || isWelcomePage ? children : <ClientLayout>{children}</ClientLayout>}
        </ThemeProvider>
      </body>
    </html>
  )
}
