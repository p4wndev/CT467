"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  MaNguoiDung: string
  TenNguoiDung: string
  Email: string
  VaiTro: "user" | "staff" | "admin"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: { MaNguoiDung: string; MatKhau: string }) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  loading: boolean
  isTokenValid: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Kiểm tra token có hợp lệ không
  const isTokenValid = () => {
    if (!token) return false

    try {
      // Decode JWT token để kiểm tra expiry
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000

      if (payload.exp && payload.exp < currentTime) {
        console.log("Token đã hết hạn")
        return false
      }

      return true
    } catch (error) {
      console.error("Lỗi khi kiểm tra token:", error)
      return false
    }
  }

  // Auto logout khi token hết hạn
  const checkTokenAndLogout = () => {
    if (token && !isTokenValid()) {
      console.log("Token hết hạn, tự động đăng xuất")
      logout()
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      try {
        // Kiểm tra token ngay khi load
        const payload = JSON.parse(atob(savedToken.split(".")[1]))
        const currentTime = Date.now() / 1000

        if (payload.exp && payload.exp < currentTime) {
          console.log("Token đã hết hạn khi load, xóa dữ liệu")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        } else {
          setToken(savedToken)
          const userData = JSON.parse(savedUser)
          setUser(userData)
          console.log("✅ Restored user session:", userData.MaNguoiDung)
        }
      } catch (error) {
        console.error("Token không hợp lệ, xóa dữ liệu:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setLoading(false)

    // Kiểm tra token mỗi phút
    const interval = setInterval(checkTokenAndLogout, 60000)
    return () => clearInterval(interval)
  }, [])

  const login = async (credentials: { MaNguoiDung: string; MatKhau: string }) => {
    try {
      console.log("🔐 Attempting login for:", credentials.MaNguoiDung)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Login failed:", data)
        throw new Error(data.error || "Đăng nhập thất bại")
      }

      const newToken = data.token
      const userInfo = data.user

      console.log("✅ Login successful:", userInfo)

      setToken(newToken)
      setUser(userInfo)
      localStorage.setItem("token", newToken)
      localStorage.setItem("user", JSON.stringify(userInfo))

      // Redirect based on role
      if (userInfo.VaiTro === "admin" || userInfo.VaiTro === "staff") {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại")
      }

      router.push("/login")
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    console.log("🚪 Logging out...")
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
