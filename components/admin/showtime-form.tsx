"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"

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

interface ShowtimeFormProps {
  showtime: Showtime | null
  isEditing: boolean
  onSubmit: (showtimeData: Showtime) => void
  onCancel: () => void
}

export function ShowtimeForm({ showtime, isEditing, onSubmit, onCancel }: ShowtimeFormProps) {
  const [formData, setFormData] = useState<Showtime>({
    MaSuatChieu: "",
    MaPhim: "",
    TenPhim: "",
    MaPhong: "",
    TenPhong: "",
    ThoiGianBatDau: "",
    ThoiGianKetThuc: "",
    GiaVe: 0,
  })

  // Mock data for movies and rooms - in a real app, you would fetch this from your API
  const movies = [
    { id: "P001", title: "Avengers: Endgame" },
    { id: "P002", title: "Dune: Part Two" },
    { id: "P003", title: "The Batman" },
  ]

  const rooms = [
    { id: "P001", name: "Room 1" },
    { id: "P002", name: "Room 2" },
    { id: "P003", name: "Room 3" },
  ]

  useEffect(() => {
    if (showtime && isEditing) {
      setFormData(showtime)
    }
  }, [showtime, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMovieChange = (value: string) => {
    const selectedMovie = movies.find((movie) => movie.id === value)
    setFormData((prev) => ({
      ...prev,
      MaPhim: value,
      TenPhim: selectedMovie?.title || "",
    }))
  }

  const handleRoomChange = (value: string) => {
    const selectedRoom = rooms.find((room) => room.id === value)
    setFormData((prev) => ({
      ...prev,
      MaPhong: value,
      TenPhong: selectedRoom?.name || "",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {isEditing && (
          <div className="grid gap-2">
            <Label htmlFor="MaSuatChieu">Showtime ID</Label>
            <Input id="MaSuatChieu" name="MaSuatChieu" value={formData.MaSuatChieu} disabled />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="MaPhim">Movie</Label>
          <Select value={formData.MaPhim} onValueChange={handleMovieChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a movie" />
            </SelectTrigger>
            <SelectContent>
              {movies.map((movie) => (
                <SelectItem key={movie.id} value={movie.id}>
                  {movie.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ThoiGianBatDau">Start Time</Label>
          <Input
            id="ThoiGianBatDau"
            name="ThoiGianBatDau"
            type="datetime-local"
            value={formData.ThoiGianBatDau ? formData.ThoiGianBatDau.slice(0, 16) : ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ThoiGianKetThuc">End Time</Label>
          <Input
            id="ThoiGianKetThuc"
            name="ThoiGianKetThuc"
            type="datetime-local"
            value={formData.ThoiGianKetThuc ? formData.ThoiGianKetThuc.slice(0, 16) : ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="GiaVe">Price (VND)</Label>
          <Input
            id="GiaVe"
            name="GiaVe"
            type="number"
            min="0"
            step="1000"
            value={formData.GiaVe}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Update Showtime" : "Create Showtime"}</Button>
      </DialogFooter>
    </form>
  )
}
