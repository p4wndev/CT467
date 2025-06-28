const jwt = require("jsonwebtoken")

const jwtSecret = process.env.JWT_SECRET || "CT467"

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (!token) {
    console.log("❌ No token provided")
    return res.status(403).json({ error: "Không có token" })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    console.log("✅ Token verified for user:", decoded.MaNguoiDung, "- Role:", decoded.VaiTro)
    req.user = decoded
    next()
  } catch (err) {
    console.error("❌ Token verification error:", err.message)

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token đã hết hạn" })
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token không hợp lệ" })
    } else {
      return res.status(401).json({ error: "Token không hợp lệ hoặc hết hạn" })
    }
  }
}

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log("❌ No user in request")
      return res.status(401).json({ error: "Chưa xác thực" })
    }

    if (!roles.includes(req.user.VaiTro)) {
      console.log("❌ Insufficient role:", req.user.VaiTro, "Required:", roles)
      return res.status(403).json({
        error: `Chỉ ${roles.join(" hoặc ")} mới được phép truy cập`,
      })
    }

    console.log("✅ Role check passed:", req.user.VaiTro)
    next()
  }
}
