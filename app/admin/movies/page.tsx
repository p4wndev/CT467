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

interface Movie {
  MaPhim: string
  TenPhim: string
  TheLoai: string
  DaoDien: string
  ThoiLuong: number
  NgayKhoiChieu: string
  DoTuoiChoPhep: string
  HinhAnh: string
}

export default function MoviesManagement() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [formData, setFormData] = useState({
    MaPhim: "",
    TenPhim: "",
    TheLoai: "",
    DaoDien: "",
    ThoiLuong: "",
    NgayKhoiChieu: "",
    DoTuoiChoPhep: "",
    HinhAnh: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const data = await api.getMovies()
      setMovies(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách phim",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const movieData = {
        ...formData,
        ThoiLuong: Number.parseInt(formData.ThoiLuong),
      }

      if (editingMovie) {
        await api.updateMovie(editingMovie.MaPhim, movieData)
        toast({
          title: "Thành công",
          description: "Cập nhật phim thành công",
        })
        setIsEditDialogOpen(false)
      } else {
        await api.createMovie(movieData)
        toast({
          title: "Thành công",
          description: "Thêm phim thành công",
        })
        setIsAddDialogOpen(false)
      }

      fetchMovies()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (movieId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phim này?")) return

    try {
      await api.deleteMovie(movieId)
      toast({
        title: "Thành công",
        description: "Xóa phim thành công",
      })
      fetchMovies()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phim",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie)
    setFormData({
      MaPhim: movie.MaPhim,
      TenPhim: movie.TenPhim,
      TheLoai: movie.TheLoai,
      DaoDien: movie.DaoDien,
      ThoiLuong: movie.ThoiLuong.toString(),
      NgayKhoiChieu: movie.NgayKhoiChieu.split("T")[0],
      DoTuoiChoPhep: movie.DoTuoiChoPhep,
      HinhAnh: movie.HinhAnh,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      MaPhim: "",
      TenPhim: "",
      TheLoai: "",
      DaoDien: "",
      ThoiLuong: "",
      NgayKhoiChieu: "",
      DoTuoiChoPhep: "",
      HinhAnh: "",
    })
    setEditingMovie(null)
  }

  const filteredMovies = movies.filter(
    (movie) =>
      movie.TenPhim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.TheLoai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.DaoDien.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const MovieForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="MaPhim">Mã phim</Label>
          <Input
            id="MaPhim"
            value={formData.MaPhim}
            onChange={(e) => setFormData({ ...formData, MaPhim: e.target.value })}
            required
            disabled={!!editingMovie}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="TenPhim">Tên phim</Label>
          <Input
            id="TenPhim"
            value={formData.TenPhim}
            onChange={(e) => setFormData({ ...formData, TenPhim: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="TheLoai">Thể loại</Label>
          <Input
            id="TheLoai"
            value={formData.TheLoai}
            onChange={(e) => setFormData({ ...formData, TheLoai: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="DaoDien">Đạo diễn</Label>
          <Input
            id="DaoDien"
            value={formData.DaoDien}
            onChange={(e) => setFormData({ ...formData, DaoDien: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ThoiLuong">Thời lượng (phút)</Label>
          <Input
            id="ThoiLuong"
            type="number"
            value={formData.ThoiLuong}
            onChange={(e) => setFormData({ ...formData, ThoiLuong: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="NgayKhoiChieu">Ngày khởi chiếu</Label>
          <Input
            id="NgayKhoiChieu"
            type="date"
            value={formData.NgayKhoiChieu}
            onChange={(e) => setFormData({ ...formData, NgayKhoiChieu: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="DoTuoiChoPhep">Độ tuổi cho phép</Label>
          <Input
            id="DoTuoiChoPhep"
            value={formData.DoTuoiChoPhep}
            onChange={(e) => setFormData({ ...formData, DoTuoiChoPhep: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="HinhAnh">URL hình ảnh</Label>
        <Textarea
          id="HinhAnh"
          value={formData.HinhAnh}
          onChange={(e) => setFormData({ ...formData, HinhAnh: e.target.value })}
          placeholder="https://example.com/image.jpg"
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
        <Button type="submit">{editingMovie ? "Cập nhật" : "Thêm mới"}</Button>
      </div>
    </form>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Quản lý phim</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phim</CardTitle>
          <CardDescription>Quản lý thông tin các bộ phim trong hệ thống</CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Tìm kiếm phim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm phim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm phim mới</DialogTitle>
                  <DialogDescription>Nhập thông tin phim mới vào hệ thống</DialogDescription>
                </DialogHeader>
                <MovieForm />
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
                  <TableHead>Mã phim</TableHead>
                  <TableHead>Tên phim</TableHead>
                  <TableHead>Thể loại</TableHead>
                  <TableHead>Đạo diễn</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead>Ngày khởi chiếu</TableHead>
                  <TableHead>Độ tuổi</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovies.map((movie) => (
                  <TableRow key={movie.MaPhim}>
                    <TableCell className="font-medium">{movie.MaPhim}</TableCell>
                    <TableCell>{movie.TenPhim}</TableCell>
                    <TableCell>{movie.TheLoai}</TableCell>
                    <TableCell>{movie.DaoDien}</TableCell>
                    <TableCell>{movie.ThoiLuong} phút</TableCell>
                    <TableCell>{new Date(movie.NgayKhoiChieu).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{movie.DoTuoiChoPhep}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(movie)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(movie.MaPhim)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredMovies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Không tìm thấy phim nào phù hợp" : "Chưa có phim nào"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phim</DialogTitle>
            <DialogDescription>Cập nhật thông tin phim</DialogDescription>
          </DialogHeader>
          <MovieForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
