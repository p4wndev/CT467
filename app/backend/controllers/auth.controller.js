const pool = require("../config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// Default values as fallback
const adminUsername = process.env.ADMIN_USERNAME || "admin"
const adminPassword = process.env.ADMIN_PASSWORD || "CT467"
const jwtSecret = process.env.JWT_SECRET || "CT467"

console.log("🔐 Auth Controller Configuration:")
console.log("👑 Admin Username:", adminUsername)
console.log("🔑 JWT Secret:", jwtSecret ? "✅ Set" : "❌ Missing")

exports.register = async (req, res) => {
  const { MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro, MatKhau } = req.body

  console.log("📝 Registration attempt for user:", MaNguoiDung)

  if (!MaNguoiDung || !TenNguoiDung || !MatKhau) {
    console.log("❌ Registration failed: Missing required fields")
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" })
  }

  try {
    const hash = await bcrypt.hash(MatKhau, 10)
    console.log("🔒 Password hashed successfully")

    pool.query(
      `INSERT INTO NguoiDung (MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro, MatKhau)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [MaNguoiDung, TenNguoiDung, SoDienThoai, Email, "user", hash],
      (err) => {
        if (err) {
          console.error("❌ Registration database error:", err)
          return res.status(500).json({ error: "Tài khoản đã tồn tại hoặc lỗi hệ thống" })
        }
        console.log("✅ User registered successfully:", MaNguoiDung)
        res.json({ message: "Đăng ký thành công" })
      },
    )
  } catch (err) {
    console.error("❌ Registration error:", err)
    res.status(500).json({ error: "Lỗi server" })
  }
}

exports.login = async (req, res) => {
  const { MaNguoiDung, MatKhau } = req.body

  console.log("🔐 Login attempt for user:", MaNguoiDung)

  if (!MaNguoiDung || !MatKhau) {
    console.log("❌ Login failed: Missing credentials")
    return res.status(400).json({ error: "Thiếu MaNguoiDung hoặc MatKhau" })
  }

  try {
    // Tìm user trong database trước
    const [results] = await pool.promise().query("SELECT * FROM NguoiDung WHERE MaNguoiDung = ?", [MaNguoiDung])

    if (results.length === 0) {
      console.log("❌ Login failed: User not found in database -", MaNguoiDung)
      return res.status(401).json({ error: "Tài khoản không tồn tại" })
    }

    const user = results[0]
    console.log("👤 User found in database:", user.MaNguoiDung, "- Role:", user.VaiTro)

    // Kiểm tra password
    const match = await bcrypt.compare(MatKhau, user.MatKhau)

    if (!match) {
      console.log("❌ Login failed: Wrong password for user -", MaNguoiDung)
      return res.status(401).json({ error: "Sai mật khẩu" })
    }

    // Tạo token với thời gian hết hạn 24 giờ
    const token = jwt.sign(
      {
        MaNguoiDung: user.MaNguoiDung,
        VaiTro: user.VaiTro,
        TenNguoiDung: user.TenNguoiDung,
      },
      jwtSecret,
      { expiresIn: "24h" },
    )

    console.log("✅ Login successful for user:", user.MaNguoiDung, "- Role:", user.VaiTro)

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        MaNguoiDung: user.MaNguoiDung,
        TenNguoiDung: user.TenNguoiDung,
        Email: user.Email,
        VaiTro: user.VaiTro,
      },
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return res.status(500).json({ error: "Lỗi server nội bộ" })
  }
}
