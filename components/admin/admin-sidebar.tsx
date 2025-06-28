"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Film,
  Users,
  MapPin,
  Armchair,
  Calendar,
  Ticket,
  Coffee,
  Receipt,
  User,
  LogOut,
  ChevronUp,
  Home,
} from "lucide-react"

const menuItems = [
  {
    title: "Tổng quan",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Quản lý phim",
    url: "/admin/movies",
    icon: Film,
  },
  {
    title: "Quản lý người dùng",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Quản lý phòng chiếu",
    url: "/admin/rooms",
    icon: MapPin,
  },
  {
    title: "Quản lý ghế",
    url: "/admin/seats",
    icon: Armchair,
  },
  {
    title: "Quản lý suất chiếu",
    url: "/admin/showtimes",
    icon: Calendar,
  },
  {
    title: "Quản lý vé",
    url: "/admin/tickets",
    icon: Ticket,
  },
  {
    title: "Quản lý bắp nước",
    url: "/admin/concessions",
    icon: Coffee,
  },
  {
    title: "Quản lý hóa đơn",
    url: "/admin/invoices",
    icon: Receipt,
  },
]

export function AdminSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2 py-2">
          <Film className="h-6 w-6" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý hệ thống</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User />
                  <span>{user?.TenNguoiDung}</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Về trang chủ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
