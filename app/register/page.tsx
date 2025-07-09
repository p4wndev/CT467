"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Film } from "lucide-react"

export default function RegisterPage() {
  const { register } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    MaNguoiDung: "",
    TenNguoiDung: "",
    SoDienThoai: "",
    Email: "",
    MatKhau: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.MatKhau !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      await register(registerData)
      toast({
        title: "Thành công",
        description: "Đăng ký thành công! Vui lòng đăng nhập.",
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Đăng ký thất bại",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <Film className="h-8 w-8" />
            <span className="font-bold text-2xl">Cinema Manager</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đăng ký</CardTitle>
            <CardDescription>Tạo tài khoản mới để sử dụng hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="MaNguoiDung">Mã người dùng</Label>
                <Input
                  id="MaNguoiDung"
                  name="MaNguoiDung"
                  type="text"
                  required
                  value={formData.MaNguoiDung}
                  onChange={handleChange}
                  placeholder="Nhập mã người dùng"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="TenNguoiDung">Tên người dùng</Label>
                <Input
                  id="TenNguoiDung"
                  name="TenNguoiDung"
                  type="text"
                  required
                  value={formData.TenNguoiDung}
                  onChange={handleChange}
                  placeholder="Nhập tên người dùng"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="Email">Email</Label>
                <Input
                  id="Email"
                  name="Email"
                  type="email"
                  value={formData.Email}
                  onChange={handleChange}
                  placeholder="Nhập email (tùy chọn)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="SoDienThoai">Số điện thoại</Label>
                <Input
                  id="SoDienThoai"
                  name="SoDienThoai"
                  type="tel"
                  value={formData.SoDienThoai}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại (tùy chọn)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="MatKhau">Mật khẩu</Label>
                <Input
                  id="MatKhau"
                  name="MatKhau"
                  type="password"
                  required
                  value={formData.MatKhau}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
