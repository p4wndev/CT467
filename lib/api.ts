// Default API URL as fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

console.log("🌐 API Configuration:")
console.log("📍 Base URL:", API_BASE_URL)

class ApiClient {
  private getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000
      return payload.exp && payload.exp < currentTime
    } catch {
      return true
    }
  }

  private handleAuthError() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    // Kiểm tra token trước khi gửi request
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token && this.isTokenExpired(token)) {
      console.log("Token đã hết hạn, chuyển hướng đến login")
      this.handleAuthError()
      throw new Error("Token đã hết hạn")
    }

    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    console.log(`🔗 API Request: ${options.method || "GET"} ${endpoint}`)

    try {
      const response = await fetch(url, config)

      // Xử lý lỗi 401 (Unauthorized)
      if (response.status === 401) {
        console.log("Nhận được lỗi 401, token không hợp lệ")
        this.handleAuthError()
        throw new Error("Phiên đăng nhập đã hết hạn")
      }

      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError)
        throw new Error("Invalid response format")
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data)
        throw new Error(data.error || data.message || `HTTP ${response.status}`)
      }

      console.log(`✅ API Success: ${options.method || "GET"} ${endpoint}`)
      return data
    } catch (error) {
      console.error("❌ API Request failed:", {
        endpoint,
        method: options.method || "GET",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

  // Auth endpoints
  async login(credentials: { MaNguoiDung: string; MatKhau: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  // Movies endpoints
  async getMovies() {
    return this.request("/movies")
  }

  async getMovie(id: string) {
    return this.request(`/movies/${id}`)
  }

  async createMovie(movieData: any) {
    return this.request("/movies", {
      method: "POST",
      body: JSON.stringify(movieData),
    })
  }

  async updateMovie(id: string, movieData: any) {
    return this.request(`/movies/${id}`, {
      method: "PUT",
      body: JSON.stringify(movieData),
    })
  }

  async deleteMovie(id: string) {
    return this.request(`/movies/${id}`, {
      method: "DELETE",
    })
  }

  // Users endpoints
  async getUsers() {
    return this.request("/users")
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    })
  }

  async upgradeUserToStaff(id: string) {
    return this.request(`/users/${id}/role`, {
      method: "PATCH",
    })
  }

  // Rooms endpoints
  async getRooms() {
    return this.request("/phongchieu")
  }

  async createRoom(roomData: any) {
    return this.request("/phongchieu", {
      method: "POST",
      body: JSON.stringify(roomData),
    })
  }

  async updateRoom(id: string, roomData: any) {
    return this.request(`/phongchieu/${id}`, {
      method: "PUT",
      body: JSON.stringify(roomData),
    })
  }

  async deleteRoom(id: string) {
    return this.request(`/phongchieu/${id}`, {
      method: "DELETE",
    })
  }

  // Seats endpoints
  async getSeats() {
    return this.request("/ghe")
  }

  async getSeat(id: string) {
    return this.request(`/ghe/${id}`)
  }

  async createSeat(seatData: any) {
    return this.request("/ghe", {
      method: "POST",
      body: JSON.stringify(seatData),
    })
  }

  async updateSeat(id: string, seatData: any) {
    return this.request(`/ghe/${id}`, {
      method: "PUT",
      body: JSON.stringify(seatData),
    })
  }

  async deleteSeat(id: string) {
    return this.request(`/ghe/${id}`, {
      method: "DELETE",
    })
  }

  // Showtimes endpoints
  async getShowtimes(params?: any) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/suatChieu/danhSach${queryString}`)
  }

  async getShowtime(id: string) {
    return this.request(`/suatChieu/${id}`)
  }

  async createShowtime(showtimeData: any) {
    return this.request("/suatChieu/taoSuatChieu", {
      method: "POST",
      body: JSON.stringify(showtimeData),
    })
  }

  async updateShowtime(id: string, showtimeData: any) {
    return this.request(`/suatChieu/${id}`, {
      method: "PUT",
      body: JSON.stringify(showtimeData),
    })
  }

  async deleteShowtime(id: string) {
    return this.request(`/suatChieu/${id}`, {
      method: "DELETE",
    })
  }

  // Tickets endpoints
  async getUserTickets() {
    return this.request("/ve/lich-su")
  }

  async getTicket(id: string) {
    return this.request(`/ve/${id}`)
  }

  async createTicket(ticketData: any) {
    return this.request("/ve/dat-ve", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  }

  async cancelTicket(id: string) {
    return this.request(`/ve/${id}/huy`, {
      method: "PUT",
    })
  }

  // Admin ticket endpoints
  async getAllTickets(params?: any) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/ve${queryString}`)
  }

  async adminCancelTicket(id: string) {
    return this.request(`/ve/${id}/huy-toan-bo`, {
      method: "PUT",
    })
  }

  // Concessions endpoints
  async getConcessions() {
    return this.request("/bapnuoc")
  }

  async createConcession(concessionData: any) {
    return this.request("/bapnuoc", {
      method: "POST",
      body: JSON.stringify(concessionData),
    })
  }

  async updateConcession(id: string, concessionData: any) {
    return this.request(`/bapnuoc/${id}`, {
      method: "PUT",
      body: JSON.stringify(concessionData),
    })
  }

  async deleteConcession(id: string) {
    return this.request(`/bapnuoc/${id}`, {
      method: "DELETE",
    })
  }

  // Invoices endpoints
  async getInvoices() {
    return this.request("/hoadon")
  }

  async getInvoice(id: string) {
    return this.request(`/hoadon/${id}`)
  }

  async createInvoice(invoiceData: any) {
    return this.request("/hoadon", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    })
  }

  async updateInvoice(id: string, invoiceData: any) {
    return this.request(`/hoadon/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoiceData),
    })
  }

  async deleteInvoice(id: string) {
    return this.request(`/hoadon/${id}`, {
      method: "DELETE",
    })
  }

  // Health check
  async healthCheck() {
    return this.request("/health")
  }
}

export const api = new ApiClient()
