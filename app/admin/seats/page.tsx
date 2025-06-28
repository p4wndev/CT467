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
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Seat {
  MaGhe: string
  MaPhong: string
  SoGhe: string
  LoaiGhe: string
}

interface Room {
  MaPhong: string
  TenPhong: string
}

export default function SeatsManagement() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null)
  const [formData, setFormData] = useState({
    MaGhe: "",
    MaPhong: "",
    SoGhe: "",
    LoaiGhe: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSeats()
    fetchRooms()
  }, [])

  const fetchSeats = async () => {
    try {
      setLoading(true)
      const data = await api.getSeats()
      setSeats(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách ghế",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const data = await api.getRooms()
      setRooms(data)
    } catch (error: any) {
      console.error("Error fetching rooms:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSeat) {
        await api.updateSeat(editingSeat.MaGhe, formData)
        toast({
          title: "Thành công",
          description: "Cập nhật ghế thành công",
        })
        setIsEditDialogOpen(false)
      } else {
        await api.createSeat(formData)
        toast({
          title: "Thành công",
          description: "Thêm ghế thành công",
        })
        setIsAddDialogOpen(false)
      }

      fetchSeats()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (seatId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghế này?")) return

    try {
      await api.deleteSeat(seatId)
      toast({
        title: "Thành công",
        description: "Xóa ghế thành công",
      })
      fetchSeats()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa ghế",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (seat: Seat) => {
    setEditingSeat(seat)
    setFormData({
      MaGhe: seat.MaGhe,
      MaPhong: seat.MaPhong,
      SoGhe: seat.SoGhe,
      LoaiGhe: seat.LoaiGhe,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      MaGhe: "",
      MaPhong: "",
      SoGhe: "",
      LoaiGhe: "",
    })
    setEditingSeat(null)
  }

  const filteredSeats = seats.filter((seat) => {
    const matchesSearch =
      seat.SoGhe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.MaGhe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.LoaiGhe.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRoom = selectedRoom === "" || seat.MaPhong === selectedRoom

    return matchesSearch && matchesRoom
  })

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.MaPhong === roomId)
    return room ? room.TenPhong : roomId
  }

  const getSeatTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "VIP":
        return "default"
      case "Couple":
        return "secondary"
      default:
        return "outline"
    }
  }

  const SeatForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="MaGhe">Mã ghế</Label>
          <Input
            id="MaGhe"
            value={formData.MaGhe}
            onChange={(e) => setFormData({ ...formData, MaGhe: e.target.value })}
            required
            disabled={!!editingSeat}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="SoGhe">Số ghế</Label>
          <Input
            id="SoGhe"
            value={formData.SoGhe}
            onChange={(e) => setFormData({ ...formData, SoGhe: e.target.value })}
            required
            placeholder="A1, B2, C3..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="MaPhong">Phòng chiếu</Label>
          <Select value={formData.MaPhong} onValueChange={(value) => setFormData({ ...formData, MaPhong: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn phòng chiếu" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.MaPhong} value={room.MaPhong}>
                  {room.TenPhong} ({room.MaPhong})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="LoaiGhe">Loại ghế</Label>
          <Select value={formData.LoaiGhe} onValueChange={(value) => setFormData({ ...formData, LoaiGhe: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại ghế" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Đơn">Đơn</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Couple">Couple</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        <Button type="submit">{editingSeat ? "Cập nhật" : "Thêm mới"}</Button>
      </div>
    </form>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý ghế</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ghế</CardTitle>
          <CardDescription>Quản lý thông tin ghế trong các phòng chiếu</CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Tìm kiếm ghế..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tất cả phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.MaPhong} value={room.MaPhong}>
                      {room.TenPhong}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm ghế
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm ghế mới</DialogTitle>
                  <DialogDescription>Nhập thông tin ghế mới</DialogDescription>
                </DialogHeader>
                <SeatForm />
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
                  <TableHead>Mã ghế</TableHead>
                  <TableHead>Số ghế</TableHead>
                  <TableHead>Phòng chiếu</TableHead>
                  <TableHead>Loại ghế</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeats.map((seat) => (
                  <TableRow key={seat.MaGhe}>
                    <TableCell className="font-medium">{seat.MaGhe}</TableCell>
                    <TableCell>{seat.SoGhe}</TableCell>
                    <TableCell>{getRoomName(seat.MaPhong)}</TableCell>
                    <TableCell>
                      <Badge variant={getSeatTypeBadgeVariant(seat.LoaiGhe)}>{seat.LoaiGhe}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(seat)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(seat.MaGhe)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredSeats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedRoom ? "Không tìm thấy ghế nào phù hợp" : "Chưa có ghế nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa ghế</DialogTitle>
            <DialogDescription>Cập nhật thông tin ghế</DialogDescription>
          </DialogHeader>
          <SeatForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
