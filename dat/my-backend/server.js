const express = require("express");
const pool = require("./db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 👉 Thêm người dùng
app.post("/users", (req, res) => {
  const { MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro } = req.body;
  console.log(MaNguoiDung);
  if (!MaNguoiDung || !TenNguoiDung) {
    return res
      .status(400)
      .json({ error: "Thiếu MaNguoiDung hoặc TenNguoiDung" });
  }

  const sql = `
    INSERT INTO NguoiDung (MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro)
    VALUES (?, ?, ?, ?, ?)
  `;

  pool.query(
    sql,
    [MaNguoiDung, TenNguoiDung, SoDienThoai, Email, VaiTro],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Thêm người dùng thành công", data: req.body });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
