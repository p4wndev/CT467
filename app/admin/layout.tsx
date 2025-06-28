"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, token, isTokenValid } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Kiểm tra user và token
      if (!user || !token || !isTokenValid()) {
        console.log("Không có quyền truy cập admin, chuyển hướng đến login")
        router.push("/login")
        return
      }

      // Kiểm tra role
      if (user.VaiTro !== "admin" && user.VaiTro !== "staff") {
        console.log("Không có quyền admin/staff, chuyển hướng đến trang chủ")
        router.push("/")
        return
      }
    }
  }, [user, loading, token, router, isTokenValid])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user || !token || !isTokenValid() || (user.VaiTro !== "admin" && user.VaiTro !== "staff")) {
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
