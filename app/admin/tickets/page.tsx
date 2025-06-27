"use client"

import { useState, useEffect } from "react"
import { useApiClient } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Ban, Calendar, User, Film } from "lucide-react"
import { format } from "date-fns"

interface Ticket {
  MaVe: string
  MaNguoiDung: string
  TenNguoiDung: string
  TongTien: number
  NgayDat: string
  ChiTietVe: TicketDetail[]
}

interface TicketDetail {
  MaChiTietVe: string
  TrangThai: boolean
  SoGhe: string
  ThoiGianBatDauSuatChieu: string
  MaPhimSuatChieu: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)

  const api = useApiClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch from your API
      // const data = await api.get("/ve");

      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockTickets: Ticket[] = [
        {
          MaVe: "V001",
          MaNguoiDung: "user1",
          TenNguoiDung: "John Doe",
          TongTien: 240000,
          NgayDat: "2025-06-10",
          ChiTietVe: [
            {
              MaChiTietVe: "CTV001",
              TrangThai: true,
              SoGhe: "A1",
              ThoiGianBatDauSuatChieu: "2025-06-15T10:00:00",
              MaPhimSuatChieu: "P001",
            },
            {
              MaChiTietVe: "CTV002",
              TrangThai: true,
              SoGhe: "A2",
              ThoiGianBatDauSuatChieu: "2025-06-15T10:00:00",
              MaPhimSuatChieu: "P001",
            },
          ],
        },
        {
          MaVe: "V002",
          MaNguoiDung: "user2",
          TenNguoiDung: "Jane Smith",
          TongTien: 150000,
          NgayDat: "2025-06-11",
          ChiTietVe: [
            {
              MaChiTietVe: "CTV003",
              TrangThai: true,
              SoGhe: "B1",
              ThoiGianBatDauSuatChieu: "2025-06-15T14:00:00",
              MaPhimSuatChieu: "P002",
            },
          ],
        },
        {
          MaVe: "V003",
          MaNguoiDung: "user1",
          TenNguoiDung: "John Doe",
          TongTien: 0, // Cancelled ticket
          NgayDat: "2025-06-12",
          ChiTietVe: [
            {
              MaChiTietVe: "CTV004",
              TrangThai: false,
              SoGhe: "C1",
              ThoiGianBatDauSuatChieu: "2025-06-16T18:00:00",
              MaPhimSuatChieu: "P003",
            },
          ],
        },
      ]

      setTickets(mockTickets)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tickets",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewTicket = (ticket: Ticket) => {
    setCurrentTicket(ticket)
    setIsViewDialogOpen(true)
  }

  const handleCancelTicketClick = (ticket: Ticket) => {
    setCurrentTicket(ticket)
    setIsCancelDialogOpen(true)
  }

  const handleCancelTicketConfirm = async () => {
    if (!currentTicket) return

    try {
      // In a real app, you would call your API
      // await api.put(`/ve/${currentTicket.MaVe}/huy-toan-bo`);

      // For demo purposes, we'll just update the state
      setTickets(
        tickets.map((ticket) => {
          if (ticket.MaVe === currentTicket.MaVe) {
            return {
              ...ticket,
              TongTien: 0,
              ChiTietVe: ticket.ChiTietVe.map((detail) => ({
                ...detail,
                TrangThai: false,
              })),
            }
          }
          return ticket
        }),
      )

      toast({
        title: "Ticket Cancelled",
        description: `Ticket ${currentTicket.MaVe} has been cancelled successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel ticket",
      })
    } finally {
      setIsCancelDialogOpen(false)
      setCurrentTicket(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (error) {
      return dateString
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), "MMM dd, yyyy HH:mm")
    } catch (error) {
      return dateTimeString
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  const getTicketStatus = (ticket: Ticket) => {
    const allCancelled = ticket.ChiTietVe.every((detail) => !detail.TrangThai)
    if (allCancelled) return "Cancelled"

    const someCancelled = ticket.ChiTietVe.some((detail) => !detail.TrangThai)
    if (someCancelled) return "Partially Cancelled"

    return "Active"
  }

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.MaVe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.MaNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.TenNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground">Manage customer tickets</p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search tickets..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading tickets...
                </TableCell>
              </TableRow>
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => {
                const status = getTicketStatus(ticket)
                return (
                  <TableRow key={ticket.MaVe}>
                    <TableCell className="font-medium">{ticket.MaVe}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {ticket.TenNguoiDung}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(ticket.NgayDat)}
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(ticket.TongTien)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          status === "Active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : status === "Partially Cancelled"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>{ticket.ChiTietVe.map((detail) => detail.SoGhe).join(", ")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {status !== "Cancelled" && (
                            <DropdownMenuItem
                              onClick={() => handleCancelTicketClick(ticket)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel Ticket
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Viewing details for ticket {currentTicket?.MaVe}</DialogDescription>
          </DialogHeader>

          {currentTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket ID</p>
                  <p>{currentTicket.MaVe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                  <p>{formatDate(currentTicket.NgayDat)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p>{currentTicket.TenNguoiDung}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                  <p>{formatPrice(currentTicket.TongTien)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p>{getTicketStatus(currentTicket)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Ticket Details</p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seat</TableHead>
                        <TableHead>Showtime</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTicket.ChiTietVe.map((detail) => (
                        <TableRow key={detail.MaChiTietVe}>
                          <TableCell>{detail.SoGhe}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4 text-muted-foreground" />
                              {formatDateTime(detail.ThoiGianBatDauSuatChieu)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                detail.TrangThai
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {detail.TrangThai ? "Active" : "Cancelled"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Ticket Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel ticket {currentTicket?.MaVe} for {currentTicket?.TenNguoiDung}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              No, Keep Ticket
            </Button>
            <Button variant="destructive" onClick={handleCancelTicketConfirm}>
              Yes, Cancel Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
