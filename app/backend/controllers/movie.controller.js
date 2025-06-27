const pool = require("../config/db");

// Lấy tất cả phim
exports.getAllMovies = (req, res) => {
  pool.query("SELECT * FROM Phim", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    res.json(results);
  });
};

// Lấy phim theo ID
exports.getMovieById = (req, res) => {
  const { id } = req.params;
  pool.query("SELECT * FROM Phim WHERE MaPhim = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    if (results.length === 0)
      return res.status(404).json({ error: "Không tìm thấy phim" });
    res.json(results[0]);
  });
};

// Thêm phim mới
exports.addMovie = (req, res) => {
  const {
    MaPhim,
    TenPhim,
    TheLoai,
    DaoDien,
    ThoiLuong,
    NgayKhoiChieu,
    DoTuoiChoPhep,
    HinhAnh,
  } = req.body;

  if (!MaPhim || !TenPhim) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  const sql = `
    INSERT INTO Phim (MaPhim, TenPhim, TheLoai, DaoDien, ThoiLuong, NgayKhoiChieu, DoTuoiChoPhep, HinhAnh)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    MaPhim,
    TenPhim,
    TheLoai,
    DaoDien,
    ThoiLuong,
    NgayKhoiChieu,
    DoTuoiChoPhep,
    HinhAnh,
  ];

  pool.query(sql, values, (err) => {
    if (err)
      return res.status(500).json({ error: "Không thể thêm phim (trùng mã?)" });
    res.json({ message: "Thêm phim thành công" });
  });
};

// Cập nhật phim
exports.updateMovie = (req, res) => {
  const { id } = req.params;
  const {
    TenPhim,
    TheLoai,
    DaoDien,
    ThoiLuong,
    NgayKhoiChieu,
    DoTuoiChoPhep,
    HinhAnh,
  } = req.body;

  const sql = `
    UPDATE Phim SET
      TenPhim = ?, TheLoai = ?, DaoDien = ?, ThoiLuong = ?,
      NgayKhoiChieu = ?, DoTuoiChoPhep = ?, HinhAnh = ?
    WHERE MaPhim = ?`;

  const values = [
    TenPhim,
    TheLoai,
    DaoDien,
    ThoiLuong,
    NgayKhoiChieu,
    DoTuoiChoPhep,
    HinhAnh,
    id,
  ];

  pool.query(sql, values, (err) => {
    if (err)
      return res.status(500).json({ error: "Không thể cập nhật thông tin" });
    res.json({ message: "Cập nhật thành công" });
  });
};

// Xoá phim
exports.deleteMovie = (req, res) => {
  const { id } = req.params;
  pool.query("DELETE FROM Phim WHERE MaPhim = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Không thể xoá phim" });
    res.json({ message: "Xoá phim thành công" });
  });
};
