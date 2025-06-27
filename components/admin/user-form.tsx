"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"

interface User {
  MaNguoiDung: string
  TenNguoiDung: string
  Email: string
  SoDienThoai: string
  VaiTro: string
  MatKhau?: string
}

interface UserFormProps {
  user: User | null
  isEditing: boolean
  onSubmit: (userData: User) => void
  onCancel: () => void
}

export function UserForm({ user, isEditing, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    MaNguoiDung: "",
    TenNguoiDung: "",
    Email: "",
    SoDienThoai: "",
    VaiTro: "user",
    MatKhau: "",
  })

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        ...user,
        MatKhau: "", // Don't populate password for editing
      })
    }
  }, [user, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, VaiTro: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If editing and password is empty, remove it from the data
    if (isEditing && !formData.MatKhau) {
      const { MatKhau, ...dataWithoutPassword } = formData
      onSubmit(dataWithoutPassword)
    } else {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="MaNguoiDung">Username</Label>
          <Input
            id="MaNguoiDung"
            name="MaNguoiDung"
            value={formData.MaNguoiDung}
            onChange={handleChange}
            disabled={isEditing} // Username cannot be changed when editing
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="TenNguoiDung">Full Name</Label>
          <Input id="TenNguoiDung" name="TenNguoiDung" value={formData.TenNguoiDung} onChange={handleChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="Email">Email</Label>
          <Input id="Email" name="Email" type="email" value={formData.Email} onChange={handleChange} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="SoDienThoai">Phone Number</Label>
          <Input id="SoDienThoai" name="SoDienThoai" value={formData.SoDienThoai} onChange={handleChange} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="VaiTro">Role</Label>
          <Select value={formData.VaiTro} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="MatKhau">{isEditing ? "New Password (leave blank to keep current)" : "Password"}</Label>
          <Input
            id="MatKhau"
            name="MatKhau"
            type="password"
            value={formData.MatKhau}
            onChange={handleChange}
            required={!isEditing} // Only required for new users
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Update User" : "Create User"}</Button>
      </DialogFooter>
    </form>
  )
}
