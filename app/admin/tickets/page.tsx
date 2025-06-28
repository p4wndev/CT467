"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, Eye, Ban, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Ticket {
  MaVe: string
  MaNguoiDung: string
  TongTien: number
  NgayDat: string
  TenNguoiDung?: string
  Email?: string
  ChiTietVe?: TicketDetail[]
}

interface TicketDetail {
  MaChiTietVe: string
  TrangThai: boolean
  SoGhe: string
  ThoiGianBatDauSuatChieu: string
  MaPhimSuatChieu: string
}

export default function TicketsManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const data = await api.getAllTickets()
      setTickets(data.tickets || [])
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách vé",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (ticket: Ticket) => {
    try {
      const detailData = await api.getTicket(ticket.MaVe)
      setSelectedTicket(detailData)
      setIsDetailDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải chi tiết vé",
        variant: "destructive",
      })
    }
  }

  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy vé này?")) return

    try {
      await api.adminCancelTicket(ticketId)
      toast({
        title: "Thành công",
        description: "Hủy vé thành công",
      })
      fetchTickets()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy vé",
        variant: "destructive",
      })
    }
  }

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.MaVe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.MaNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.TenNguoiDung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.Email?.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const getTicketStatus = (ticket: Ticket) => {
    if (!ticket.ChiTietVe || ticket.ChiTietVe.length === 0) return "Không có ghế"
    const hasActiveSeats = ticket.ChiTietVe.some((detail) => detail.TrangThai)
    return hasActiveSeats ? "Hoạt động" : "Đã hủy"
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Hoạt động":
        return "default"
      case "Đã hủy":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý vé</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách vé</CardTitle>
          <CardDescription>Quản lý và theo dõi các vé đã được đặt</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Tìm kiếm vé..."
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
                  <TableHead>Mã vé</TableHead>
                  <TableHead>Người đặt</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.MaVe}>
                    <TableCell className="font-medium">{ticket.MaVe}</TableCell>
                    <TableCell>{ticket.TenNguoiDung || ticket.MaNguoiDung}</TableCell>
                    <TableCell>{ticket.Email || "Chưa có"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">{formatDate(ticket.NgayDat)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatCurrency(ticket.TongTien)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(getTicketStatus(ticket))}>{getTicketStatus(ticket)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(ticket)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {getTicketStatus(ticket) === "Hoạt động" && (
                          <Button variant="outline" size="sm" onClick={() => handleCancelTicket(ticket.MaVe)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Không tìm thấy vé nào phù hợp" : "Chưa có vé nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết vé</DialogTitle>
            <DialogDescription>Thông tin chi tiết về vé đã đặt</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Thông tin vé</h4>
                  <p>Mã vé: {selectedTicket.MaVe}</p>
                  <p>Người đặt: {selectedTicket.TenNguoiDung || selectedTicket.MaNguoiDung}</p>
                  <p>Email: {selectedTicket.Email || "Chưa có"}</p>
                  <p>Ngày đặt: {formatDate(selectedTicket.NgayDat)}</p>
                  <p>Tổng tiền: {formatCurrency(selectedTicket.TongTien)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Chi tiết ghế</h4>
                  {selectedTicket.chiTiet && selectedTicket.chiTiet.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTicket.chiTiet.map((detail: any) => (
                        <div key={detail.MaChiTietVe} className="flex items-center justify-between">
                          <span>Ghế {detail.SoGhe}</span>
                          <Badge variant={detail.TrangThaiChiTietVe ? "default" : "secondary"}>
                            {detail.TrangThaiChiTietVe ? "Hoạt động" : "Đã hủy"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Không có thông tin ghế</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
