const pool = require("../config/db");

exports.getAll = (req, res) => {
  pool.query("SELECT * FROM PhongChieu", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { MaPhong, TenPhong, SoLuongGhe, LoaiPhong } = req.body;

  pool.query(
    "INSERT INTO PhongChieu (MaPhong, TenPhong, SoLuongGhe, LoaiPhong) VALUES (?, ?, ?, ?)",
    [MaPhong, TenPhong, SoLuongGhe, LoaiPhong],
    (err) => {
      if (err) return res.status(500).json({ error: "Lỗi thêm phòng chiếu" });
      res.json({ message: "Thêm phòng chiếu thành công" });
    }
  );
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { TenPhong, SoLuongGhe, LoaiPhong } = req.body;

  pool.query(
    "UPDATE PhongChieu SET TenPhong=?, SoLuongGhe=?, LoaiPhong=? WHERE MaPhong=?",
    [TenPhong, SoLuongGhe, LoaiPhong, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Lỗi cập nhật" });
      res.json({ message: "Cập nhật thành công" });
    }
  );
};

exports.remove = (req, res) => {
  pool.query(
    "DELETE FROM PhongChieu WHERE MaPhong=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Lỗi xoá" });
      res.json({ message: "Xoá thành công" });
    }
  );
};
