"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"

interface Seat {
  MaGhe: string
  MaPhong: string
  SoGhe: string
  LoaiGhe: string
}

interface SeatFormProps {
  seat: Seat | null
  isEditing: boolean
  onSubmit: (seatData: Seat) => void
  onCancel: () => void
}

export function SeatForm({ seat, isEditing, onSubmit, onCancel }: SeatFormProps) {
  const [formData, setFormData] = useState<Seat>({
    MaGhe: "",
    MaPhong: "",
    SoGhe: "",
    LoaiGhe: "Standard",
  })

  // Mock data for rooms - in a real app, you would fetch this from your API
  const rooms = [
    { id: "P001", name: "Room 1" },
    { id: "P002", name: "Room 2" },
    { id: "P003", name: "Room 3" },
  ]

  useEffect(() => {
    if (seat && isEditing) {
      setFormData(seat)
    }
  }, [seat, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoomChange = (value: string) => {
    setFormData((prev) => ({ ...prev, MaPhong: value }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, LoaiGhe: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="MaGhe">Seat ID</Label>
          <Input
            id="MaGhe"
            name="MaGhe"
            value={formData.MaGhe}
            onChange={handleChange}
            disabled={isEditing} // Seat ID cannot be changed when editing
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="MaPhong">Room</Label>
          <Select value={formData.MaPhong} onValueChange={handleRoomChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="SoGhe">Seat Number</Label>
          <Input id="SoGhe" name="SoGhe" value={formData.SoGhe} onChange={handleChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="LoaiGhe">Seat Type</Label>
          <Select value={formData.LoaiGhe} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a seat type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Couple">Couple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Update Seat" : "Create Seat"}</Button>
      </DialogFooter>
    </form>
  )
}
