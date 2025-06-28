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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus, Edit, Trash2, Search, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  MaHoaDon: string
  MaNguoiDung: string
  MaVe: string
  NgayMua: string
  TongTien: number
  TenNguoiDung?: string
  TongTienVe?: number
}

interface User {
  MaNguoiDung: string
  TenNguoiDung: string
}

interface Ticket {
  MaVe: string
  TongTien: number
}

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    MaNguoiDung: "",
    MaVe: "",
    NgayMua: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
    fetchUsers()
    fetchTickets()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const data = await api.getInvoices()
      setInvoices(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách hóa đơn",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (error: any) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchTickets = async () => {
    try {
      const data = await api.getAllTickets()
      setTickets(data.tickets || [])
    } catch (error: any) {
      console.error("Error fetching tickets:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingInvoice) {
        await api.updateInvoice(editingInvoice.MaHoaDon, formData)
        toast({
          title: "Thành công",
          description: "Cập nhật hóa đơn thành công",
        })
        setIsEditDialogOpen(false)
      } else {
        await api.createInvoice(formData)
        toast({
          title: "Thành công",
          description: "Thêm hóa đơn thành công",
        })
        setIsAddDialogOpen(false)
      }

      fetchInvoices()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hóa đơn này?")) return

    try {
      await api.deleteInvoice(invoiceId)
      toast({
        title: "Thành công",
        description: "Xóa hóa đơn thành công",
      })
      fetchInvoices()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa hóa đơn",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      MaNguoiDung: invoice.MaNguoiDung,
      MaVe: invoice.MaVe,
      NgayMua: invoice.NgayMua.split("T")[0],
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      MaNguoiDung: "",
      MaVe: "",
      NgayMua: "",
    })
    setEditingInvoice(null)
  }

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.MaHoaDon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.MaNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.TenNguoiDung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.MaVe.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  const InvoiceForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="MaNguoiDung">Người dùng</Label>
        <Select
          value={formData.MaNguoiDung}
          onValueChange={(value) => setFormData({ ...formData, MaNguoiDung: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn người dùng" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.MaNguoiDung} value={user.MaNguoiDung}>
                {user.TenNguoiDung} ({user.MaNguoiDung})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="MaVe">Vé</Label>
        <Select value={formData.MaVe} onValueChange={(value) => setFormData({ ...formData, MaVe: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn vé" />
          </SelectTrigger>
          <SelectContent>
            {tickets.map((ticket) => (
              <SelectItem key={ticket.MaVe} value={ticket.MaVe}>
                {ticket.MaVe} - {formatCurrency(ticket.TongTien)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="NgayMua">Ngày mua</Label>
        <Input
          id="NgayMua"
          type="date"
          value={formData.NgayMua}
          onChange={(e) => setFormData({ ...formData, NgayMua: e.target.value })}
          required
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
        <Button type="submit">{editingInvoice ? "Cập nhật" : "Thêm mới"}</Button>
      </div>
    </form>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý hóa đơn</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
          <CardDescription>Quản lý và theo dõi các hóa đơn thanh toán</CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Tìm kiếm hóa đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm hóa đơn
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm hóa đơn mới</DialogTitle>
                  <DialogDescription>Tạo hóa đơn thanh toán mới</DialogDescription>
                </DialogHeader>
                <InvoiceForm />
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
                  <TableHead>Mã hóa đơn</TableHead>
                  <TableHead>Người mua</TableHead>
                  <TableHead>Mã vé</TableHead>
                  <TableHead>Ngày mua</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.MaHoaDon}>
                    <TableCell className="font-medium">{invoice.MaHoaDon}</TableCell>
                    <TableCell>{invoice.TenNguoiDung || invoice.MaNguoiDung}</TableCell>
                    <TableCell>{invoice.MaVe}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">{formatDate(invoice.NgayMua)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatCurrency(invoice.TongTien)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(invoice)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(invoice.MaHoaDon)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Không tìm thấy hóa đơn nào phù hợp" : "Chưa có hóa đơn nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hóa đơn</DialogTitle>
            <DialogDescription>Cập nhật thông tin hóa đơn</DialogDescription>
          </DialogHeader>
          <InvoiceForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
