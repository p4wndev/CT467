"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  MaNguoiDung: string
  VaiTro: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a token in localStorage
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)

      // Parse the JWT token to get user info
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]))
        setUser({
          MaNguoiDung: payload.MaNguoiDung,
          VaiTro: payload.VaiTro,
        })
      } catch (error) {
        console.error("Failed to parse token:", error)
        localStorage.removeItem("token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)

    // Parse the JWT token to get user info
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]))
      setUser({
        MaNguoiDung: payload.MaNguoiDung,
        VaiTro: payload.VaiTro,
      })
    } catch (error) {
      console.error("Failed to parse token:", error)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/auth/login")
  }

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.VaiTro === "admin",
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
