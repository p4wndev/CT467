"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Film } from "lucide-react"
import { useEffect } from "react"

export function Navbar() {
  const { user, logout, isTokenValid } = useAuth()

  // Kiểm tra token định kỳ
  useEffect(() => {
    const checkToken = () => {
      if (user && !isTokenValid()) {
        console.log("Token hết hạn trong navbar, đăng xuất")
        logout()
      }
    }

    const interval = setInterval(checkToken, 30000) // Kiểm tra mỗi 30 giây
    return () => clearInterval(interval)
  }, [user, isTokenValid, logout])

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6" />
            <span className="font-bold text-xl">Cinema Manager</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {(user.VaiTro === "admin" || user.VaiTro === "staff") && (
                  <Button asChild variant="outline">
                    <Link href="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Quản lý
                    </Link>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{user.TenNguoiDung}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Thông tin cá nhân</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/tickets">Vé của tôi</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
