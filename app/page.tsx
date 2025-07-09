"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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

export default function HomePage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loadingMovies, setLoadingMovies] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      fetchMovies()
    }
  }, [loading, user])

  const fetchMovies = async () => {
    try {
      const data = await api.getMovies()
      setMovies(data)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phim",
        variant: "destructive",
      })
    } finally {
      setLoadingMovies(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Chào mừng đến với Cinema Manager</h1>
            <p className="text-xl text-muted-foreground mb-8">Hệ thống quản lý rạp phim và đặt vé trực tuyến</p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Đăng ký</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Phim đang chiếu</h1>
          <p className="text-muted-foreground">Khám phá và đặt vé cho các bộ phim mới nhất</p>
        </div>

        {loadingMovies ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Hiện tại chưa có phim nào được chiếu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <Card key={movie.MaPhim} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[2/3] relative">
                  <img
                    src={movie.HinhAnh || "/placeholder.svg?height=400&width=300"}
                    alt={movie.TenPhim}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2">{movie.DoTuoiChoPhep}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{movie.TenPhim}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(movie.NgayKhoiChieu).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1 h-3 w-3" />
                        {movie.ThoiLuong} phút
                      </div>
                      <div className="text-sm">
                        <strong>Thể loại:</strong> {movie.TheLoai}
                      </div>
                      <div className="text-sm">
                        <strong>Đạo diễn:</strong> {movie.DaoDien}
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/movies/${movie.MaPhim}/showtimes`}>Đặt vé</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
