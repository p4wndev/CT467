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

interface Room {
  MaPhong: string
  TenPhong: string
  SoLuongGhe: number
  LoaiPhong: string
}

export default function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState({
    MaPhong: "",
    TenPhong: "",
    SoLuongGhe: "",
    LoaiPhong: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const data = await api.getRooms()
      setRooms(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách phòng chiếu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const roomData = {
        ...formData,
        SoLuongGhe: Number.parseInt(formData.SoLuongGhe),
      }

      if (editingRoom) {
        await api.updateRoom(editingRoom.MaPhong, roomData)
        toast({
          title: "Thành công",
          description: "Cập nhật phòng chiếu thành công",
        })
        setIsEditDialogOpen(false)
      } else {
        await api.createRoom(roomData)
        toast({
          title: "Thành công",
          description: "Thêm phòng chiếu thành công",
        })
        setIsAddDialogOpen(false)
      }

      fetchRooms()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng chiếu này?")) return

    try {
      await api.deleteRoom(roomId)
      toast({
        title: "Thành công",
        description: "Xóa phòng chiếu thành công",
      })
      fetchRooms()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phòng chiếu",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      MaPhong: room.MaPhong,
      TenPhong: room.TenPhong,
      SoLuongGhe: room.SoLuongGhe.toString(),
      LoaiPhong: room.LoaiPhong,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      MaPhong: "",
      TenPhong: "",
      SoLuongGhe: "",
      LoaiPhong: "",
    })
    setEditingRoom(null)
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.TenPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.MaPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.LoaiPhong.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const RoomForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="MaPhong">Mã phòng</Label>
          <Input
            id="MaPhong"
            value={formData.MaPhong}
            onChange={(e) => setFormData({ ...formData, MaPhong: e.target.value })}
            required
            disabled={!!editingRoom}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="TenPhong">Tên phòng</Label>
          <Input
            id="TenPhong"
            value={formData.TenPhong}
            onChange={(e) => setFormData({ ...formData, TenPhong: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="SoLuongGhe">Số lượng ghế</Label>
          <Input
            id="SoLuongGhe"
            type="number"
            value={formData.SoLuongGhe}
            onChange={(e) => setFormData({ ...formData, SoLuongGhe: e.target.value })}
            required
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="LoaiPhong">Loại phòng</Label>
          <Select value={formData.LoaiPhong} onValueChange={(value) => setFormData({ ...formData, LoaiPhong: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại phòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="IMAX">IMAX</SelectItem>
              <SelectItem value="4DX">4DX</SelectItem>
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
        <Button type="submit">{editingRoom ? "Cập nhật" : "Thêm mới"}</Button>
      </div>
    </form>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý phòng chiếu</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phòng chiếu</CardTitle>
          <CardDescription>Quản lý thông tin các phòng chiếu trong rạp</CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Tìm kiếm phòng chiếu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm phòng chiếu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm phòng chiếu mới</DialogTitle>
                  <DialogDescription>Nhập thông tin phòng chiếu mới</DialogDescription>
                </DialogHeader>
                <RoomForm />
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
                  <TableHead>Mã phòng</TableHead>
                  <TableHead>Tên phòng</TableHead>
                  <TableHead>Số lượng ghế</TableHead>
                  <TableHead>Loại phòng</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.MaPhong}>
                    <TableCell className="font-medium">{room.MaPhong}</TableCell>
                    <TableCell>{room.TenPhong}</TableCell>
                    <TableCell>{room.SoLuongGhe} ghế</TableCell>
                    <TableCell>
                      <Badge variant="outline">{room.LoaiPhong}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(room.MaPhong)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredRooms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Không tìm thấy phòng chiếu nào phù hợp" : "Chưa có phòng chiếu nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phòng chiếu</DialogTitle>
            <DialogDescription>Cập nhật thông tin phòng chiếu</DialogDescription>
          </DialogHeader>
          <RoomForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
