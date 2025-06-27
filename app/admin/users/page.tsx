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
import { UserForm } from "@/components/admin/user-form"

interface User {
  MaNguoiDung: string
  TenNguoiDung: string
  Email: string
  SoDienThoai: string
  VaiTro: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const api = useApiClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch from your API
      // const data = await api.get("/users");

      // For demo purposes, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockUsers: User[] = [
        {
          MaNguoiDung: "user1",
          TenNguoiDung: "John Doe",
          Email: "john@example.com",
          SoDienThoai: "0123456789",
          VaiTro: "user",
        },
        {
          MaNguoiDung: "user2",
          TenNguoiDung: "Jane Smith",
          Email: "jane@example.com",
          SoDienThoai: "0987654321",
          VaiTro: "user",
        },
        {
          MaNguoiDung: "admin1",
          TenNguoiDung: "Admin User",
          Email: "admin@example.com",
          SoDienThoai: "0123123123",
          VaiTro: "admin",
        },
      ]

      setUsers(mockUsers)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = () => {
    setCurrentUser(null)
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setCurrentUser(user)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setCurrentUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentUser) return

    try {
      // In a real app, you would call your API
      // await api.delete(`/users/${currentUser.MaNguoiDung}`);

      // For demo purposes, we'll just update the state
      setUsers(users.filter((user) => user.MaNguoiDung !== currentUser.MaNguoiDung))

      toast({
        title: "User Deleted",
        description: `${currentUser.TenNguoiDung} has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setCurrentUser(null)
    }
  }

  const handleFormSubmit = async (userData: User) => {
    try {
      if (isEditing) {
        // In a real app, you would call your API
        // await api.put(`/users/${userData.MaNguoiDung}`, userData);

        // For demo purposes, we'll just update the state
        setUsers(users.map((user) => (user.MaNguoiDung === userData.MaNguoiDung ? userData : user)))

        toast({
          title: "User Updated",
          description: `${userData.TenNguoiDung} has been updated successfully.`,
        })
      } else {
        // In a real app, you would call your API
        // await api.post("/users", userData);

        // For demo purposes, we'll just update the state
        setUsers([...users, userData])

        toast({
          title: "User Created",
          description: `${userData.TenNguoiDung} has been created successfully.`,
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing ? "Failed to update user" : "Failed to create user",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.MaNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.TenNguoiDung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts in the system</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search users..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.MaNguoiDung}>
                  <TableCell>{user.MaNguoiDung}</TableCell>
                  <TableCell>{user.TenNguoiDung}</TableCell>
                  <TableCell>{user.Email}</TableCell>
                  <TableCell>{user.SoDienThoai}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.VaiTro === "admin"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {user.VaiTro}
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
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(user)}
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

      {/* User Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the user's information below." : "Fill in the details to create a new user."}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={currentUser}
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
              Are you sure you want to delete {currentUser?.TenNguoiDung}? This action cannot be undone.
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
