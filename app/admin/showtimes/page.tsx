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
import { Plus, MoreHorizontal, Pencil, Trash, Calendar, Clock } from "lucide-react"
import { ShowtimeForm } from "@/components/admin/showtime-form"
import { format } from "date-fns"

interface Showtime {
  MaSuatChieu: string
  MaPhim: string
  TenPhim: string
  MaPhong: string
  TenPhong: string
  ThoiGianBatDau: string
  ThoiGianKetThuc: string
  GiaVe: number
}

export default function ShowtimesPage() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentShowtime, setCurrentShowtime] = useState<Showtime | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const api = useApiClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchShowtimes()
  }, [])

  const fetchShowtimes = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch from your API
      // const data = await api.get("/suatChieu/danhSach");

      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockShowtimes: Showtime[] = [
        {
          MaSuatChieu: "SC_001",
          MaPhim: "P001",
          TenPhim: "Avengers: Endgame",
          MaPhong: "P001",
          TenPhong: "Room 1",
          ThoiGianBatDau: "2025-06-15T10:00:00",
          ThoiGianKetThuc: "2025-06-15T13:00:00",
          GiaVe: 120000,
        },
        {
          MaSuatChieu: "SC_002",
          MaPhim: "P002",
          TenPhim: "Dune: Part Two",
          MaPhong: "P002",
          TenPhong: "Room 2",
          ThoiGianBatDau: "2025-06-15T14:00:00",
          ThoiGianKetThuc: "2025-06-15T17:00:00",
          GiaVe: 150000,
        },
        {
          MaSuatChieu: "SC_003",
          MaPhim: "P001",
          TenPhim: "Avengers: Endgame",
          MaPhong: "P001",
          TenPhong: "Room 1",
          ThoiGianBatDau: "2025-06-15T18:00:00",
          ThoiGianKetThuc: "2025-06-15T21:00:00",
          GiaVe: 150000,
        },
      ]

      setShowtimes(mockShowtimes)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load showtimes",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddShowtime = () => {
    setCurrentShowtime(null)
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEditShowtime = (showtime: Showtime) => {
    setCurrentShowtime(showtime)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (showtime: Showtime) => {
    setCurrentShowtime(showtime)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentShowtime) return

    try {
      // In a real app, you would call your API
      // await api.delete(`/suatChieu/${currentShowtime.MaSuatChieu}`);

      // For demo purposes, we'll just update the state
      setShowtimes(showtimes.filter((showtime) => showtime.MaSuatChieu !== currentShowtime.MaSuatChieu))

      toast({
        title: "Showtime Deleted",
        description: `Showtime for ${currentShowtime.TenPhim} has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete showtime",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setCurrentShowtime(null)
    }
  }

  const handleFormSubmit = async (showtimeData: Showtime) => {
    try {
      if (isEditing) {
        // In a real app, you would call your API
        // await api.put(`/suatChieu/${showtimeData.MaSuatChieu}`, showtimeData);

        // For demo purposes, we'll just update the state
        setShowtimes(
          showtimes.map((showtime) => (showtime.MaSuatChieu === showtimeData.MaSuatChieu ? showtimeData : showtime)),
        )

        toast({
          title: "Showtime Updated",
          description: `Showtime for ${showtimeData.TenPhim} has been updated successfully.`,
        })
      } else {
        // In a real app, you would call your API
        // await api.post("/suatChieu/taoSuatChieu", showtimeData);

        // For demo purposes, we'll just update the state
        // Generate a random ID for the new showtime
        const newShowtime = {
          ...showtimeData,
          MaSuatChieu: `SC_${Math.floor(Math.random() * 1000)}`,
        }
        setShowtimes([...showtimes, newShowtime])

        toast({
          title: "Showtime Created",
          description: `Showtime for ${showtimeData.TenPhim} has been created successfully.`,
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing ? "Failed to update showtime" : "Failed to create showtime",
      })
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

  const filteredShowtimes = showtimes.filter(
    (showtime) =>
      showtime.TenPhim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.TenPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDateTime(showtime.ThoiGianBatDau).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Showtimes</h1>
          <p className="text-muted-foreground">Manage movie showtimes</p>
        </div>
        <Button onClick={handleAddShowtime}>
          <Plus className="mr-2 h-4 w-4" />
          Add Showtime
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search showtimes..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Movie</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading showtimes...
                </TableCell>
              </TableRow>
            ) : filteredShowtimes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No showtimes found
                </TableCell>
              </TableRow>
            ) : (
              filteredShowtimes.map((showtime) => (
                <TableRow key={showtime.MaSuatChieu}>
                  <TableCell className="font-medium">{showtime.TenPhim}</TableCell>
                  <TableCell>{showtime.TenPhong}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime(showtime.ThoiGianBatDau)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime(showtime.ThoiGianKetThuc)}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(showtime.GiaVe)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditShowtime(showtime)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(showtime)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Showtime Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Showtime" : "Add New Showtime"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the showtime's information below." : "Fill in the details to create a new showtime."}
            </DialogDescription>
          </DialogHeader>
          <ShowtimeForm
            showtime={currentShowtime}
            isEditing={isEditing}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the showtime for {currentShowtime?.TenPhim} at{" "}
              {currentShowtime ? formatDateTime(currentShowtime.ThoiGianBatDau) : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
