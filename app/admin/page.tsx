"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApiClient } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Users, Armchair, Calendar, Ticket } from "lucide-react"

interface DashboardStats {
  userCount: number
  seatCount: number
  showtimeCount: number
  ticketCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    seatCount: 0,
    showtimeCount: 0,
    ticketCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const api = useApiClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // In a real application, you would fetch actual stats from your API
        // For now, we'll simulate with some dummy data

        // Simulate API calls
        // const userCount = await api.get("/users/count");
        // const seatCount = await api.get("/ghe/count");
        // const showtimeCount = await api.get("/suatChieu/count");
        // const ticketCount = await api.get("/ve/count");

        // Simulate response delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStats({
          userCount: 24,
          seatCount: 120,
          showtimeCount: 18,
          ticketCount: 156,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard statistics",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [api, toast])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your cinema management system</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.userCount}</div>
            <p className="text-xs text-muted-foreground">Registered users in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
            <Armchair className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.seatCount}</div>
            <p className="text-xs text-muted-foreground">Seats across all theaters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Showtimes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.showtimeCount}</div>
            <p className="text-xs text-muted-foreground">Upcoming movie showtimes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.ticketCount}</div>
            <p className="text-xs text-muted-foreground">Total tickets sold this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Loading recent activities...</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 rounded-md border p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New Ticket Purchase</p>
                      <p className="text-xs text-muted-foreground">User purchased 3 tickets for "Avengers: Endgame"</p>
                    </div>
                    <div className="text-xs text-muted-foreground">5 minutes ago</div>
                  </div>

                  <div className="flex items-center gap-4 rounded-md border p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New User Registration</p>
                      <p className="text-xs text-muted-foreground">A new user has registered to the system</p>
                    </div>
                    <div className="text-xs text-muted-foreground">1 hour ago</div>
                  </div>

                  <div className="flex items-center gap-4 rounded-md border p-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New Showtime Added</p>
                      <p className="text-xs text-muted-foreground">Admin added a new showtime for "Dune: Part Two"</p>
                    </div>
                    <div className="text-xs text-muted-foreground">3 hours ago</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm text-green-500">Online</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: "98%" }}></div>
                </div>
                <p className="text-xs text-muted-foreground">98% uptime</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Server</span>
                  <span className="text-sm text-green-500">Online</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: "100%" }}></div>
                </div>
                <p className="text-xs text-muted-foreground">100% uptime</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <span className="text-sm text-yellow-500">Warning</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: "82%" }}></div>
                </div>
                <p className="text-xs text-muted-foreground">82% used - 18% free</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
