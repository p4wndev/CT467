"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Concession {
  MaCombo: string
  TenCombo: string
  GiaCombo: number
  MoTa: string
}

export default function ConcessionsManagement() {
  const [concessions, setConcessions] = useState<Concession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingConcession, setEditingConcession] = useState<Concession | null>(null)
  const [formData, setFormData] = useState({
    MaCombo: "",
    TenCombo: "",
    GiaCombo: "",
    MoTa: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchConcessions()
  }, [])

  const fetchConcessions = async () => {
    try {
      setLoading(true)
      const data = await api.getConcessions()
      setConcessions(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách bắp nước",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const concessionData = {
        ...formData,
        GiaCombo: Number.parseFloat(formData.GiaCombo),
      }

      if (editingConcession) {
        await api.updateConcession(editingConcession.MaCombo, concessionData)
        toast({
          title: "Thành công",
          description: "Cập nhật combo thành công",
        })
        setIsEditDialogOpen(false)
      } else {
        await api.createConcession(concessionData)
        toast({
          title: "Thành công",
          description: "Thêm combo thành công",
        })
        setIsAddDialogOpen(false)
      }

      fetchConcessions()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (concessionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa combo này?")) return

    try {
      await api.deleteConcession(concessionId)
      toast({
        title: "Thành công",
        description: "Xóa combo thành công",
      })
      fetchConcessions()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa combo",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (concession: Concession) => {
    setEditingConcession(concession)
    setFormData({
      MaCombo: concession.MaCombo,
      TenCombo: concession.TenCombo,
      GiaCombo: concession.GiaCombo.toString(),
      MoTa: concession.MoTa,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      MaCombo: "",
      TenCombo: "",
      GiaCombo: "",
      MoTa: "",
    })
    setEditingConcession(null)
  }

  const filteredConcessions = concessions.filter(
    (concession) =>
      concession.TenCombo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concession.MaCombo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concession.MoTa?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const ConcessionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="MaCombo">Mã combo</Label>
          <Input
            id="MaCombo"
            value={formData.MaCombo}
            onChange={(e) => setFormData({ ...formData, MaCombo: e.target.value })}
            required
            disabled={!!editingConcession}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="TenCombo">Tên combo</Label>
          <Input
            id="TenCombo"
            value={formData.TenCombo}
            onChange={(e) => setFormData({ ...formData, TenCombo: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="GiaCombo">Giá combo (VND)</Label>
        <Input
          id="GiaCombo"
          type="number"
          value={formData.GiaCombo}
          onChange={(e) => setFormData({ ...formData, GiaCombo: e.target.value })}
          required
          min="0"
          step="1000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="MoTa">Mô tả</Label>
        <Textarea
          id="MoTa"
          value={formData.MoTa}
          onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
          placeholder="Mô tả chi tiết về combo..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm()
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
          }}
        >
          Hủy
        </Button>
        <Button type="submit">{editingConcession ? "Cập nhật" : "Thêm mới"}</Button>
      </div>
    </form>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý bắp nước</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách combo bắp nước</CardTitle>
          <CardDescription>Quản lý các sản phẩm bắp nước và combo</CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Tìm kiếm combo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm combo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm combo mới</DialogTitle>
                  <DialogDescription>Nhập thông tin combo bắp nước mới</DialogDescription>
                </DialogHeader>
                <ConcessionForm />
              </DialogContent>
            </Dialog>
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
                  <TableHead>Mã combo</TableHead>
                  <TableHead>Tên combo</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConcessions.map((concession) => (
                  <TableRow key={concession.MaCombo}>
                    <TableCell className="font-medium">{concession.MaCombo}</TableCell>
                    <TableCell>{concession.TenCombo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatCurrency(concession.GiaCombo)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{concession.MoTa || "Không có mô tả"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(concession)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(concession.MaCombo)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredConcessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Không tìm thấy combo nào phù hợp" : "Chưa có combo nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa combo</DialogTitle>
            <DialogDescription>Cập nhật thông tin combo</DialogDescription>
          </DialogHeader>
          <ConcessionForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
