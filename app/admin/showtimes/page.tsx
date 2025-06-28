"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
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
import { Plus, Edit, Trash2, Search, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Showtime {
  MaSuatChieu: string
  MaPhim: string
  MaPhong: string
  ThoiGianBatDau: string
  ThoiGianKetThuc: string
  GiaVe: number
  TenPhim?: string
  TenPhong?: string
}

interface Movie {
  MaPhim: string
  TenPhim: string
}

interface Room {
  MaPhong: string
  TenPhong: string
}

export default function ShowtimesManagement() {
  const { user, isTokenValid } = useAuth()
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMovie, setSelectedMovie] = useState<string>("all")
  const [selectedRoom, setSelectedRoom] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null)
  const [formData, setFormData] = useState({
    MaPhim: "",
    MaPhong: "",
    ThoiGianBatDau: "",
    ThoiGianKetThuc: "",
    GiaVe: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (user && isTokenValid()) {
      fetchShowtimes()
      fetchMovies()
      fetchRooms()
    }
  }, [user, isTokenValid])

  const fetchShowtimes = async () => {
    try {
      setLoading(true)
      const data = await api.getShowtimes()
      setShowtimes(data.suatChieu || [])
    } catch (error: any) {
      console.error("Error fetching showtimes:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách suất chiếu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMovies = async () => {
    try {
      const data = await api.getMovies()
      setMovies(data)
    } catch (error: any) {
      console.error("Error fetching movies:", error)
      toast({
        title: "Cảnh báo",
        description: "Không thể tải danh sách phim",
        variant: "destructive",
      })
    }
  }

  const fetchRooms = async () => {
    try {
      const data = await api.getRooms()
      setRooms(data)
    } catch (error: any) {
      console.error("Error fetching rooms:", error)
      toast({
        title: "Cảnh báo",
        description: "Không thể tải danh sách phòng chiếu",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isTokenValid()) {
      toast({
        title: "Lỗi",
        description: "Phiên đăng nhập đã hết hạn",
        variant: "destructive",
      })
      return
    }

    try {
      const showtimeData = {
        ...formData,
        GiaVe: Number.parseFloat(formData.GiaVe),
      }

      if (editingShowtime) {
        await api.updateShowtime(editingShowtime.MaSuatChieu, showtimeData)
        toast({
          title: "Thành công",
          description: "Cập nhật suất chiếu thành công",
        })
        setIsEditDialogOpen(false)
      } else {
        await api.createShowtime(showtimeData)
        toast({
          title: "Thành công",
          description: "Thêm suất chiếu thành công",
        })
        setIsAddDialogOpen(false)
      }

      fetchShowtimes()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (showtimeId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa suất chiếu này?")) return

    if (!isTokenValid()) {
      toast({
        title: "Lỗi",
        description: "Phiên đăng nhập đã hết hạn",
        variant: "destructive",
      })
      return
    }

    try {
      await api.deleteShowtime(showtimeId)
      toast({
        title: "Thành công",
        description: "Xóa suất chiếu thành công",
      })
      fetchShowtimes()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa suất chiếu",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (showtime: Showtime) => {
    setEditingShowtime(showtime)
    setFormData({
      MaPhim: showtime.MaPhim,
      MaPhong: showtime.MaPhong,
      ThoiGianBatDau: new Date(showtime.ThoiGianBatDau).toISOString().slice(0, 16),
      ThoiGianKetThuc: new Date(showtime.ThoiGianKetThuc).toISOString().slice(0, 16),
      GiaVe: showtime.GiaVe.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      MaPhim: "",
      MaPhong: "",
      ThoiGianBatDau: "",
      ThoiGianKetThuc: "",
      GiaVe: "",
    })
    setEditingShowtime(null)
  }

  const filteredShowtimes = showtimes.filter((showtime) => {
    const matchesSearch =
      showtime.TenPhim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.TenPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.MaSuatChieu.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMovie = selectedMovie === "all" || showtime.MaPhim === selectedMovie
    const matchesRoom = selectedRoom === "all" || showtime.MaPhong === selectedRoom

    return matchesSearch && matchesMovie && matchesRoom
  })

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const ShowtimeForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="MaPhim">Phim</Label>
          <Select value={formData.MaPhim} onValueChange={(value) => setFormData({ ...formData, MaPhim: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn phim" />
            </SelectTrigger>
            <SelectContent>
              {movies.map((movie) => (
                <SelectItem key={movie.MaPhim} value={movie.MaPhim}>
                  {movie.TenPhim}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="MaPhong">Phòng chiếu</Label>
          <Select value={formData.MaPhong} onValueChange={(value) => setFormData({ ...formData, MaPhong: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn phòng chiếu" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.MaPhong} value={room.MaPhong}>
                  {room.TenPhong}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ThoiGianBatDau">Thời gian bắt đầu</Label>
          <Input
            id="ThoiGianBatDau"
            type="datetime-local"
            value={formData.ThoiGianBatDau}
            onChange={(e) => setFormData({ ...formData, ThoiGianBatDau: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ThoiGianKetThuc">Thời gian kết thúc</Label>
          <Input
            id="ThoiGianKetThuc"
            type="datetime-local"
            value={formData.ThoiGianKetThuc}
            onChange={(e) => setFormData({ ...formData, ThoiGianKetThuc: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="GiaVe">Giá vé (VND)</Label>
        <Input
          id="GiaVe"
          type="number"
          value={formData.GiaVe}
          onChange={(e) => setFormData({ ...formData, GiaVe: e.target.value })}
          required
          min="0"
          step="1000"
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
        <Button type="submit">{editingShowtime ? "Cập nhật" : "Thêm mới"}</Button>
      </div>
    </form>
  )

  if (!user || !isTokenValid()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Phiên đăng nhập đã hết hạn</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý suất chiếu</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách suất chiếu</CardTitle>
          <CardDescription>Quản lý lịch chiếu phim trong các phòng</CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Tìm kiếm suất chiếu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedMovie} onValueChange={setSelectedMovie}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tất cả phim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phim</SelectItem>
                  {movies.map((movie) => (
                    <SelectItem key={movie.MaPhim} value={movie.MaPhim}>
                      {movie.TenPhim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Thêm suất chiếu
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm suất chiếu mới</DialogTitle>
                  <DialogDescription>Tạo lịch chiếu mới cho phim</DialogDescription>
                </DialogHeader>
                <ShowtimeForm />
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
                  <TableHead>Mã suất chiếu</TableHead>
                  <TableHead>Phim</TableHead>
                  <TableHead>Phòng chiếu</TableHead>
                  <TableHead>Thời gian bắt đầu</TableHead>
                  <TableHead>Thời gian kết thúc</TableHead>
                  <TableHead>Giá vé</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShowtimes.map((showtime) => (
                  <TableRow key={showtime.MaSuatChieu}>
                    <TableCell className="font-medium">{showtime.MaSuatChieu}</TableCell>
                    <TableCell>{showtime.TenPhim || showtime.MaPhim}</TableCell>
                    <TableCell>{showtime.TenPhong || showtime.MaPhong}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">{formatDateTime(showtime.ThoiGianBatDau)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">{formatDateTime(showtime.ThoiGianKetThuc)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatCurrency(showtime.GiaVe)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(showtime)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(showtime.MaSuatChieu)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredShowtimes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedMovie !== "all" || selectedRoom !== "all"
                ? "Không tìm thấy suất chiếu nào phù hợp"
                : "Chưa có suất chiếu nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa suất chiếu</DialogTitle>
            <DialogDescription>Cập nhật thông tin suất chiếu</DialogDescription>
          </DialogHeader>
          <ShowtimeForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
