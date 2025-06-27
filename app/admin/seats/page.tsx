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
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { SeatForm } from "@/components/admin/seat-form"

interface Seat {
  MaGhe: string
  MaPhong: string
  SoGhe: string
  LoaiGhe: string
}

export default function SeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSeat, setCurrentSeat] = useState<Seat | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const api = useApiClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchSeats()
  }, [])

  const fetchSeats = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch from your API
      // const data = await api.get("/ghe");

      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockSeats: Seat[] = [
        {
          MaGhe: "G001",
          MaPhong: "P001",
          SoGhe: "A1",
          LoaiGhe: "Standard",
        },
        {
          MaGhe: "G002",
          MaPhong: "P001",
          SoGhe: "A2",
          LoaiGhe: "Standard",
        },
        {
          MaGhe: "G003",
          MaPhong: "P001",
          SoGhe: "B1",
          LoaiGhe: "VIP",
        },
        {
          MaGhe: "G004",
          MaPhong: "P002",
          SoGhe: "A1",
          LoaiGhe: "Standard",
        },
        {
          MaGhe: "G005",
          MaPhong: "P002",
          SoGhe: "A2",
          LoaiGhe: "VIP",
        },
      ]

      setSeats(mockSeats)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load seats",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSeat = () => {
    setCurrentSeat(null)
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEditSeat = (seat: Seat) => {
    setCurrentSeat(seat)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (seat: Seat) => {
    setCurrentSeat(seat)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentSeat) return

    try {
      // In a real app, you would call your API
      // await api.delete(`/ghe/${currentSeat.MaGhe}`);

      // For demo purposes, we'll just update the state
      setSeats(seats.filter((seat) => seat.MaGhe !== currentSeat.MaGhe))

      toast({
        title: "Seat Deleted",
        description: `Seat ${currentSeat.SoGhe} has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete seat",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setCurrentSeat(null)
    }
  }

  const handleFormSubmit = async (seatData: Seat) => {
    try {
      if (isEditing) {
        // In a real app, you would call your API
        // await api.put(`/ghe/${seatData.MaGhe}`, seatData);

        // For demo purposes, we'll just update the state
        setSeats(seats.map((seat) => (seat.MaGhe === seatData.MaGhe ? seatData : seat)))

        toast({
          title: "Seat Updated",
          description: `Seat ${seatData.SoGhe} has been updated successfully.`,
        })
      } else {
        // In a real app, you would call your API
        // await api.post("/ghe", seatData);

        // For demo purposes, we'll just update the state
        setSeats([...seats, seatData])

        toast({
          title: "Seat Created",
          description: `Seat ${seatData.SoGhe} has been created successfully.`,
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing ? "Failed to update seat" : "Failed to create seat",
      })
    }
  }

  const filteredSeats = seats.filter(
    (seat) =>
      seat.MaGhe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.MaPhong.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.SoGhe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.LoaiGhe.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seats</h1>
          <p className="text-muted-foreground">Manage seats in theater rooms</p>
        </div>
        <Button onClick={handleAddSeat}>
          <Plus className="mr-2 h-4 w-4" />
          Add Seat
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search seats..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seat ID</TableHead>
              <TableHead>Room ID</TableHead>
              <TableHead>Seat Number</TableHead>
              <TableHead>Seat Type</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading seats...
                </TableCell>
              </TableRow>
            ) : filteredSeats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No seats found
                </TableCell>
              </TableRow>
            ) : (
              filteredSeats.map((seat) => (
                <TableRow key={seat.MaGhe}>
                  <TableCell>{seat.MaGhe}</TableCell>
                  <TableCell>{seat.MaPhong}</TableCell>
                  <TableCell>{seat.SoGhe}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        seat.LoaiGhe === "VIP"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      }`}
                    >
                      {seat.LoaiGhe}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSeat(seat)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(seat)}
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

      {/* Seat Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Seat" : "Add New Seat"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the seat's information below." : "Fill in the details to create a new seat."}
            </DialogDescription>
          </DialogHeader>
          <SeatForm
            seat={currentSeat}
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
              Are you sure you want to delete seat {currentSeat?.SoGhe} in room {currentSeat?.MaPhong}? This action
              cannot be undone.
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
