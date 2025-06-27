"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardNav } from "@/components/admin/dashboard-nav"
import { ModeToggle } from "@/components/mode-toggle"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/auth/login")
  //   } else if (!isAdmin) {
  //     router.push("/not-found")
  //   }
  // }, [isAuthenticated, isAdmin, router])

  // if (!isAuthenticated || !isAdmin) {
  //   return <div className="flex h-screen items-center justify-center">Loading...</div>
  // }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="m2 2 20 20" />
              <path d="M12 12v8" />
              <path d="M12 12h8" />
              <path d="M12 12V4" />
              <path d="M12 12H4" />
            </svg>
            <span className="text-xl font-bold">Admin Dashboard</span>
          </div>
          <ModeToggle />
        </div>
      </header>
      <div className="container flex-1 items-start px-4 py-6 md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-[4.5rem] z-30 -ml-2 hidden h-[calc(100vh-4.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="w-full">{children}</main>
      </div>
    </div>
  )
}
