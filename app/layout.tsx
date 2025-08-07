import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientRootLayout from "./client-root-layout"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientRootLayout>{children}</ClientRootLayout>
}

export const metadata = {
      generator: 'v0.dev'
    };
