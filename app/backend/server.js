const express = require("express")
const cors = require("cors")
require("dotenv").config()

// Default environment variables
const config = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "CT467",
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "CT467",
  NODE_ENV: process.env.NODE_ENV || "development",
}

console.log("🚀 Starting Cinema Management System Backend")
console.log("⚙️ Server Configuration:")
console.log("📍 Port:", config.PORT)
console.log("🔐 JWT Secret:", config.JWT_SECRET ? "✅ Set" : "❌ Missing")
console.log("👑 Admin Username:", config.ADMIN_USERNAME)
console.log("🌍 Environment:", config.NODE_ENV)
console.log("⏰ Started at:", new Date().toISOString())

// Import routes
const authRoutes = require("./routes/auth.routes")
const userRoutes = require("./routes/user.routes")
const gheRoutes = require("./routes/ghe.routes")
const suatChieuRoutes = require("./routes/suatChieu.routes")
const veRoutes = require("./routes/ve.routes")
const movieRoutes = require("./routes/movie.routes")
const bapNuocRoutes = require("./routes/bapnuoc.routes")
const phongChieuRoutes = require("./routes/phongchieu.routes")
const chitietveRoutes = require("./routes/chitietve.routes")
const hoadonRoutes = require("./routes/hoadon.routes")
const chitiethoadonRoutes = require("./routes/chitiethoadon.routes")

// Test database connection
const pool = require("./config/db")

const app = express()

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`📝 ${timestamp} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/ghe", gheRoutes)
app.use("/suatChieu", suatChieuRoutes)
app.use("/ve", veRoutes)
app.use("/movies", movieRoutes)
app.use("/bapnuoc", bapNuocRoutes)
app.use("/phongchieu", phongChieuRoutes)
app.use("/chitietve", chitietveRoutes)
app.use("/hoadon", hoadonRoutes)
app.use("/chitiethoadon", chitiethoadonRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        database: "❌ Disconnected",
        error: err.message,
        environment: {
          NODE_ENV: config.NODE_ENV,
          PORT: config.PORT,
          DB_HOST: process.env.DB_HOST || "ct467-database.cjc2ywku69ul.ap-southeast-2.rds.amazonaws.com",
          DB_NAME: process.env.DB_NAME || "quan_ly_rap_phim",
        },
      })
    } else {
      connection.release()
      res.json({
        status: "✅ OK",
        timestamp: new Date().toISOString(),
        database: "✅ Connected",
        environment: {
          NODE_ENV: config.NODE_ENV,
          PORT: config.PORT,
          DB_HOST: process.env.DB_HOST || "ct467-database.cjc2ywku69ul.ap-southeast-2.rds.amazonaws.com",
          DB_NAME: process.env.DB_NAME || "quan_ly_rap_phim",
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      })
    }
  })
})

// API routes list
app.get("/api-routes", (req, res) => {
  const routes = [
    { method: "POST", path: "/auth/login", description: "User login" },
    { method: "POST", path: "/auth/register", description: "User registration" },
    { method: "GET", path: "/movies", description: "Get all movies" },
    { method: "GET", path: "/users", description: "Get all users (admin only)" },
    { method: "GET", path: "/phongchieu", description: "Get all cinema rooms" },
    { method: "GET", path: "/ghe", description: "Get all seats" },
    { method: "GET", path: "/suatChieu/danhSach", description: "Get all showtimes" },
    { method: "GET", path: "/ve/lich-su", description: "Get user tickets" },
    { method: "GET", path: "/bapnuoc", description: "Get all concessions" },
    { method: "GET", path: "/hoadon", description: "Get all invoices (admin only)" },
  ]

  res.json({
    title: "Cinema Management API",
    version: "1.0.0",
    routes: routes,
    documentation: "Available endpoints for the cinema management system",
  })
})

// 404 handler
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`)
  res.status(404).json({
    message: "Route không tồn tại.",
    availableRoutes: "/api-routes",
    requestedPath: req.path,
    method: req.method,
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", {
    message: err.message,
    stack: config.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  res.status(500).json({
    message: "Lỗi server nội bộ",
    error: config.NODE_ENV === "development" ? err.message : "Internal server error",
    timestamp: new Date().toISOString(),
  })
})

const server = app.listen(config.PORT, () => {
  console.log("\n" + "=".repeat(50))
  console.log(`🚀 Server is running at http://localhost:${config.PORT}`)
  console.log(`📋 Health check: http://localhost:${config.PORT}/health`)
  console.log(`📚 API routes: http://localhost:${config.PORT}/api-routes`)
  console.log(`🔧 Environment: ${config.NODE_ENV}`)
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`)
  console.log("=".repeat(50) + "\n")
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("✅ Process terminated")
    pool.end(() => {
      console.log("✅ Database pool closed")
      process.exit(0)
    })
  })
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  server.close(() => {
    console.log("✅ Process terminated")
    pool.end(() => {
      console.log("✅ Database pool closed")
      process.exit(0)
    })
  })
})
