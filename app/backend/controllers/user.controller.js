const pool = require("../config/db");

// GET /users
exports.getAllUsers = (req, res) => {
  pool.query(
    "SELECT MaNguoiDung, TenNguoiDung, Email, SoDienThoai, VaiTro FROM NguoiDung",
    (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi truy vấn CSDL" });
      res.json(results);
    }
  );
};

// GET /users/:id
exports.getUserById = (req, res) => {
  const { id } = req.params;

  pool.query(
    "SELECT MaNguoiDung, TenNguoiDung, Email, SoDienThoai, VaiTro FROM NguoiDung WHERE MaNguoiDung = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi truy vấn" });
      if (results.length === 0)
        return res.status(404).json({ error: "Không tìm thấy người dùng" });
      res.json(results[0]);
    }
  );
};

// PUT /users/:id
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { TenNguoiDung, Email, SoDienThoai, VaiTro } = req.body;

  pool.query(
    `UPDATE NguoiDung SET TenNguoiDung = ?, Email = ?, SoDienThoai = ?, VaiTro = ? WHERE MaNguoiDung = ?`,
    [TenNguoiDung, Email, SoDienThoai, VaiTro, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Lỗi cập nhật" });
      res.json({ message: "Cập nhật thành công" });
    }
  );
};

// DELETE /users/:id
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  pool.query(
    "DELETE FROM NguoiDung WHERE MaNguoiDung = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Lỗi xóa" });
      res.json({ message: "Xóa người dùng thành công" });
    }
  );
};
