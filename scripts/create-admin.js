const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
require("dotenv").config()

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "ct467-database.cjc2ywku69ul.ap-southeast-2.rds.amazonaws.com",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "CT467-DATABASE",
  database: process.env.DB_NAME || "quan_ly_rap_phim",
  port: process.env.DB_PORT || 3306,
}

async function createAdminAccount() {
  let connection

  try {
    console.log("🔗 Connecting to database...")
    connection = await mysql.createConnection(dbConfig)
    console.log("✅ Connected to database successfully!")

    // Tạo tài khoản admin
    const adminData = {
      MaNguoiDung: "admin",
      TenNguoiDung: "Administrator",
      Email: "admin1@cinema.com",
      SoDienThoai: "01234567895",
      VaiTro: "admin",
      MatKhau: "CT467",
    }

    // Hash password
    console.log("🔒 Hashing password...")
    const hashedPassword = await bcrypt.hash(adminData.MatKhau, 10)
    console.log("✅ Password hashed successfully!")

    // Kiểm tra xem admin đã tồn tại chưa
    console.log("🔍 Checking if admin account exists...")
    const [existingAdmin] = await connection.execute("SELECT MaNguoiDung FROM NguoiDung WHERE MaNguoiDung = ?", [
      adminData.MaNguoiDung,
    ])

    if (existingAdmin.length > 0) {
      console.log("⚠️ Admin account already exists, updating...")
      await connection.execute(
        "UPDATE NguoiDung SET TenNguoiDung = ?, Email = ?, SoDienThoai = ?, VaiTro = ?, MatKhau = ? WHERE MaNguoiDung = ?",
        [
          adminData.TenNguoiDung,
          adminData.Email,
          adminData.SoDienThoai,
          adminData.VaiTro,
          hashedPassword,
          adminData.MaNguoiDung,
        ],
      )
      console.log("✅ Admin account updated successfully!")
    } else {
      console.log("➕ Creating new admin account...")
      await connection.execute(
        "INSERT INTO NguoiDung (MaNguoiDung, TenNguoiDung, Email, SoDienThoai, VaiTro, MatKhau) VALUES (?, ?, ?, ?, ?, ?)",
        [
          adminData.MaNguoiDung,
          adminData.TenNguoiDung,
          adminData.Email,
          adminData.SoDienThoai,
          adminData.VaiTro,
          hashedPassword,
        ],
      )
      console.log("✅ Admin account created successfully!")
    }

    // Tạo tài khoản staff test
    const staffData = {
      MaNguoiDung: "staff01",
      TenNguoiDung: "Staff Test",
      Email: "staff@cinema.com",
      SoDienThoai: "0987654321",
      VaiTro: "staff",
      MatKhau: "staff123",
    }

    const hashedStaffPassword = await bcrypt.hash(staffData.MatKhau, 10)

    const [existingStaff] = await connection.execute("SELECT MaNguoiDung FROM NguoiDung WHERE MaNguoiDung = ?", [
      staffData.MaNguoiDung,
    ])

    if (existingStaff.length > 0) {
      console.log("⚠️ Staff account already exists, updating...")
      await connection.execute(
        "UPDATE NguoiDung SET TenNguoiDung = ?, Email = ?, SoDienThoai = ?, VaiTro = ?, MatKhau = ? WHERE MaNguoiDung = ?",
        [
          staffData.TenNguoiDung,
          staffData.Email,
          staffData.SoDienThoai,
          staffData.VaiTro,
          hashedStaffPassword,
          staffData.MaNguoiDung,
        ],
      )
      console.log("✅ Staff account updated successfully!")
    } else {
      console.log("➕ Creating staff test account...")
      await connection.execute(
        "INSERT INTO NguoiDung (MaNguoiDung, TenNguoiDung, Email, SoDienThoai, VaiTro, MatKhau) VALUES (?, ?, ?, ?, ?, ?)",
        [
          staffData.MaNguoiDung,
          staffData.TenNguoiDung,
          staffData.Email,
          staffData.SoDienThoai,
          staffData.VaiTro,
          hashedStaffPassword,
        ],
      )
      console.log("✅ Staff account created successfully!")
    }

    // Tạo tài khoản user test
    const userData = {
      MaNguoiDung: "user01",
      TenNguoiDung: "User Test",
      Email: "user@cinema.com",
      SoDienThoai: "0111222333",
      VaiTro: "user",
      MatKhau: "user123",
    }

    const hashedUserPassword = await bcrypt.hash(userData.MatKhau, 10)

    const [existingUser] = await connection.execute("SELECT MaNguoiDung FROM NguoiDung WHERE MaNguoiDung = ?", [
      userData.MaNguoiDung,
    ])

    if (existingUser.length > 0) {
      console.log("⚠️ User account already exists, updating...")
      await connection.execute(
        "UPDATE NguoiDung SET TenNguoiDung = ?, Email = ?, SoDienThoai = ?, VaiTro = ?, MatKhau = ? WHERE MaNguoiDung = ?",
        [
          userData.TenNguoiDung,
          userData.Email,
          userData.SoDienThoai,
          userData.VaiTro,
          hashedUserPassword,
          userData.MaNguoiDung,
        ],
      )
      console.log("✅ User account updated successfully!")
    } else {
      console.log("➕ Creating user test account...")
      await connection.execute(
        "INSERT INTO NguoiDung (MaNguoiDung, TenNguoiDung, Email, SoDienThoai, VaiTro, MatKhau) VALUES (?, ?, ?, ?, ?, ?)",
        [
          userData.MaNguoiDung,
          userData.TenNguoiDung,
          userData.Email,
          userData.SoDienThoai,
          userData.VaiTro,
          hashedUserPassword,
        ],
      )
      console.log("✅ User account created successfully!")
    }

    // Hiển thị thông tin tài khoản
    console.log("\n" + "=".repeat(50))
    console.log("🎉 ACCOUNTS CREATED SUCCESSFULLY!")
    console.log("=".repeat(50))
    console.log("👑 ADMIN ACCOUNT:")
    console.log("   Username: admin")
    console.log("   Password: CT467")
    console.log("   Role: admin")
    console.log("")
    console.log("👨‍💼 STAFF ACCOUNT:")
    console.log("   Username: staff01")
    console.log("   Password: staff123")
    console.log("   Role: staff")
    console.log("")
    console.log("👤 USER ACCOUNT:")
    console.log("   Username: user01")
    console.log("   Password: user123")
    console.log("   Role: user")
    console.log("=".repeat(50))
  } catch (error) {
    console.error("❌ Error creating admin account:", error)
    console.error("Error details:", {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
    })
  } finally {
    if (connection) {
      await connection.end()
      console.log("🔌 Database connection closed.")
    }
  }
}

// Chạy script
createAdminAccount()
