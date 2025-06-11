const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "Không có token" });

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = decoded; // Gắn user vào req
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token không hợp lệ hoặc hết hạn" });
  }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.VaiTro !== role) {
      return res
        .status(403)
        .json({ error: `Chỉ ${role} mới được phép truy cập` });
    }
    next();
  };
};
