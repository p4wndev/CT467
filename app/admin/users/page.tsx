"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Edit, Trash2, Search, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface User {
  MaNguoiDung: string
  TenNguoiDung: string
  Email: string
  SoDienThoai: string
  VaiTro: "user" | "staff" | "admin"
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    TenNguoiDung: "",
    Email: "",
    SoDienThoai: "",
    VaiTro: "user" as "user" | "staff" | "admin",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách người dùng",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      await api.updateUser(editingUser.MaNguoiDung, formData)
      toast({
        title: "Thành công",
        description: "Cập nhật người dùng thành công",
      })
      setIsEditDialogOpen(false)
      fetchUsers()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return

    try {
      await api.deleteUser(userId)
      toast({
        title: "Thành công",
        description: "Xóa người dùng thành công",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa người dùng",
        variant: "destructive",
      })
    }
  }

  const handleUpgradeToStaff = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn nâng quyền người dùng này lên staff?")) return

    try {
      await api.upgradeUserToStaff(userId)
      toast({
        title: "Thành công",
        description: "Nâng quyền thành công",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nâng quyền",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      TenNguoiDung: user.TenNguoiDung,
      Email: user.Email || "",
      SoDienThoai: user.SoDienThoai || "",
      VaiTro: user.VaiTro,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      TenNguoiDung: "",
      Email: "",
      SoDienThoai: "",
      VaiTro: "user",
    })
    setEditingUser(null)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.TenNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.MaNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "staff":
        return "default"
      default:
        return "secondary"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên"
      case "staff":
        return "Nhân viên"
      default:
        return "Người dùng"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Quản lý thông tin và quyền hạn người dùng trong hệ thống</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">Đang tải...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã người dùng</TableHead>
                  <TableHead>Tên người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.MaNguoiDung}>
                    <TableCell className="font-medium">{user.MaNguoiDung}</TableCell>
                    <TableCell>{user.TenNguoiDung}</TableCell>
                    <TableCell>{user.Email || "Chưa có"}</TableCell>
                    <TableCell>{user.SoDienThoai || "Chưa có"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.VaiTro)}>{getRoleLabel(user.VaiTro)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.VaiTro === "user" && (
                          <Button variant="outline" size="sm" onClick={() => handleUpgradeToStaff(user.MaNguoiDung)}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {user.VaiTro !== "admin" && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(user.MaNguoiDung)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Không tìm thấy người dùng nào phù hợp" : "Chưa có người dùng nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>Cập nhật thông tin người dùng</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="TenNguoiDung">Tên người dùng</Label>
              <Input
                id="TenNguoiDung"
                value={formData.TenNguoiDung}
                onChange={(e) => setFormData({ ...formData, TenNguoiDung: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Email">Email</Label>
              <Input
                id="Email"
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="SoDienThoai">Số điện thoại</Label>
              <Input
                id="SoDienThoai"
                value={formData.SoDienThoai}
                onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="VaiTro">Vai trò</Label>
              <Select
                value={formData.VaiTro}
                onValueChange={(value: any) => setFormData({ ...formData, VaiTro: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Người dùng</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsEditDialogOpen(false)
                }}
              >
                Hủy
              </Button>
              <Button type="submit">Cập nhật</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
