"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Film, Users, Calendar, Ticket } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    users: 0,
    showtimes: 0,
    tickets: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [moviesData, usersData, showtimesData, ticketsData] = await Promise.allSettled([
        api.getMovies(),
        api.getUsers(),
        api.getShowtimes(),
        api.getAllTickets(),
      ])

      setStats({
        movies: moviesData.status === "fulfilled" ? moviesData.value.length : 0,
        users: usersData.status === "fulfilled" ? usersData.value.length : 0,
        showtimes: showtimesData.status === "fulfilled" ? showtimesData.value.suatChieu?.length || 0 : 0,
        tickets: ticketsData.status === "fulfilled" ? ticketsData.value.tickets?.length || 0 : 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Tổng số phim",
      value: stats.movies,
      description: "Phim trong hệ thống",
      icon: Film,
    },
    {
      title: "Tổng số người dùng",
      value: stats.users,
      description: "Người dùng đã đăng ký",
      icon: Users,
    },
    {
      title: "Tổng số suất chiếu",
      value: stats.showtimes,
      description: "Suất chiếu đã tạo",
      icon: Calendar,
    },
    {
      title: "Tổng số vé",
      value: stats.tickets,
      description: "Vé đã được đặt",
      icon: Ticket,
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Chào mừng đến với Admin Panel</CardTitle>
            <CardDescription>Quản lý toàn bộ hệ thống rạp phim từ đây</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Sử dụng menu bên trái để điều hướng đến các chức năng quản lý khác nhau:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Quản lý phim: Thêm, sửa, xóa thông tin phim</li>
                <li>Quản lý người dùng: Xem và quản lý tài khoản người dùng</li>
                <li>Quản lý phòng chiếu: Thiết lập các phòng chiếu</li>
                <li>Quản lý ghế: Cấu hình ghế cho từng phòng</li>
                <li>Quản lý suất chiếu: Lên lịch chiếu phim</li>
                <li>Quản lý vé: Theo dõi và quản lý vé đã bán</li>
                <li>Quản lý bắp nước: Quản lý các sản phẩm bán kèm</li>
                <li>Quản lý hóa đơn: Theo dõi doanh thu và hóa đơn</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Thống kê nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Phim đang chiếu</span>
                <span className="font-medium">{loading ? "..." : stats.movies}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Người dùng hoạt động</span>
                <span className="font-medium">{loading ? "..." : stats.users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Suất chiếu hôm nay</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vé đã bán</span>
                <span className="font-medium">{loading ? "..." : stats.tickets}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
