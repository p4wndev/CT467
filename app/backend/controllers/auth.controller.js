const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro, MatKhau } =
    req.body;

  if (!MaNguoiDung || !TenNguoiDung || !MatKhau) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  try {
    const hash = await bcrypt.hash(MatKhau, 10);

    pool.query(
      `INSERT INTO NguoiDung (MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro, MatKhau)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [MaNguoiDung, TenNguoiDung, SoDienThoai, Email, "user", hash],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Tài khoản đã tồn tại hoặc lỗi hệ thống" });
        res.json({ message: "Đăng ký thành công" });
      }
    );
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

exports.login = async (req, res) => {
  const { MaNguoiDung, MatKhau } = req.body;

  if (!MaNguoiDung || !MatKhau) {
    return res.status(400).json({ error: "Thiếu MaNguoiDung hoặc MatKhau" });
  }

  // Kiểm tra tài khoản admin cứng trong .env
  if (MaNguoiDung === adminUsername && MatKhau === adminPassword) {
    // Tạo token admin
    const token = jwt.sign(
      { MaNguoiDung: adminUsername, VaiTro: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.json({ message: "Đăng nhập thành công (admin)", token });
  }

  // Nếu không phải admin cố định, kiểm tra trong database như cũ
  pool.query(
    "SELECT * FROM NguoiDung WHERE MaNguoiDung = ?",
    [MaNguoiDung],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ error: "Tài khoản không tồn tại" });
      }

      const user = results[0];
      const match = await bcrypt.compare(MatKhau, user.MatKhau);

      if (!match) {
        return res.status(401).json({ error: "Sai mật khẩu" });
      }

      const token = jwt.sign(
        { MaNguoiDung: user.MaNguoiDung, VaiTro: user.VaiTro },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ message: "Đăng nhập thành công", token });
    }
  );
};
