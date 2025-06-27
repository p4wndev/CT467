"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LayoutDashboard, Users, Ticket, Calendar, Armchair, LogOut } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function DashboardNav() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Seats",
      href: "/admin/seats",
      icon: <Armchair className="h-5 w-5" />,
    },
    {
      title: "Showtimes",
      href: "/admin/showtimes",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Tickets",
      href: "/admin/tickets",
      icon: <Ticket className="h-5 w-5" />,
    },
  ]

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
            pathname === item.href
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400",
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
      <Button
        variant="ghost"
        className="flex w-full items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
        onClick={logout}
      >
        <LogOut className="h-5 w-5" />
        Logout
      </Button>
    </nav>
  )
}
