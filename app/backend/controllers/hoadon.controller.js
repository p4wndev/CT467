const pool = require("../config/db");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Lấy tất cả hóa đơn (chỉ admin)
exports.getAllHoaDon = [verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `SELECT hd.*, nd.TenNguoiDung, v.TongTien AS TongTienVe
       FROM HoaDon hd
       JOIN NguoiDung nd ON hd.MaNguoiDung = nd.MaNguoiDung
       JOIN Ve v ON hd.MaVe = v.MaVe`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hóa đơn:", error);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
}];

// Lấy hóa đơn theo MaHoaDon (admin hoặc người dùng của hóa đơn)
exports.getHoaDonById = [verifyToken, async (req, res) => {
  const { MaHoaDon } = req.params;
  const MaNguoiDung = req.user.MaNguoiDung;

  try {
    const [rows] = await pool.promise().query(
      `SELECT hd.*, nd.TenNguoiDung, v.TongTien AS TongTienVe
       FROM HoaDon hd
       JOIN NguoiDung nd ON hd.MaNguoiDung = nd.MaNguoiDung
       JOIN Ve v ON hd.MaVe = v.MaVe
       WHERE hd.MaHoaDon = ? AND hd.MaNguoiDung = ?`,
      [MaHoaDon, MaNguoiDung]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Hóa đơn không tồn tại hoặc không có quyền truy cập" });
    }
    const hoaDon = rows[0];

    // Tính tổng tiền chi tiết hóa đơn
    const [chiTietRows] = await pool.promise().query(
      `SELECT DonGia, SoLuong FROM ChiTietHoaDon WHERE MaHoaDon = ?`,
      [MaHoaDon]
    );
    const tongTienChiTiet = chiTietRows.reduce((sum, row) => sum + (row.DonGia * row.SoLuong), 0);
    hoaDon.TongTien = tongTienChiTiet + (hoaDon.TongTienVe || 0);

    res.status(200).json(hoaDon);
  } catch (error) {
    console.error("Lỗi khi lấy hóa đơn:", error);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
}];

// Tạo hóa đơn mới (chỉ admin)
exports.createHoaDon = [verifyToken, requireRole("admin"), async (req, res) => {
  const { MaNguoiDung, MaVe, NgayMua } = req.body;

  if (!MaNguoiDung || !MaVe || !NgayMua) {
    return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
  }

  try {
    const [result] = await pool.promise().query(
      `INSERT INTO HoaDon (MaHoaDon, MaNguoiDung, MaVe, NgayMua, TongTien) 
       VALUES (?, ?, ?, ?, 0)`,
      [null, MaNguoiDung, MaVe, NgayMua]
    );
    res.status(201).json({ message: "Tạo hóa đơn thành công", MaHoaDon: result.insertId });
  } catch (error) {
    console.error("Lỗi khi tạo hóa đơn:", error);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
}];

// Cập nhật hóa đơn (chỉ admin, cập nhật TongTien tự động)
exports.updateHoaDon = [verifyToken, requireRole("admin"), async (req, res) => {
  const { MaHoaDon } = req.params;
  const { MaNguoiDung, MaVe, NgayMua } = req.body;

  try {
    const [result] = await pool.promise().query(
      `UPDATE HoaDon SET MaNguoiDung = ?, MaVe = ?, NgayMua = ? 
       WHERE MaHoaDon = ?`,
      [MaNguoiDung, MaVe, NgayMua, MaHoaDon]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Hóa đơn không tồn tại" });
    }

    // Tính lại TongTien
    const [chiTietRows] = await pool.promise().query(
      `SELECT DonGia, SoLuong FROM ChiTietHoaDon WHERE MaHoaDon = ?`,
      [MaHoaDon]
    );
    const tongTienChiTiet = chiTietRows.reduce((sum, row) => sum + (row.DonGia * row.SoLuong), 0);
    const [veRow] = await pool.promise().query(
      `SELECT TongTien AS TongTienVe FROM Ve WHERE MaVe = (SELECT MaVe FROM HoaDon WHERE MaHoaDon = ?)`,
      [MaHoaDon]
    );
    const tongTienVe = veRow[0]?.TongTienVe || 0;
    const tongTien = tongTienChiTiet + tongTienVe;

    await pool.promise().query(
      `UPDATE HoaDon SET TongTien = ? WHERE MaHoaDon = ?`,
      [tongTien, MaHoaDon]
    );

    res.status(200).json({ message: "Cập nhật hóa đơn thành công", TongTien: tongTien });
  } catch (error) {
    console.error("Lỗi khi cập nhật hóa đơn:", error);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
}];

// Xóa hóa đơn (chỉ admin)
exports.deleteHoaDon = [verifyToken, requireRole("admin"), async (req, res) => {
  const { MaHoaDon } = req.params;

  try {
    const [result] = await pool.promise().query(
      `DELETE FROM HoaDon WHERE MaHoaDon = ?`,
      [MaHoaDon]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Hóa đơn không tồn tại" });
    }
    res.status(200).json({ message: "Xóa hóa đơn thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa hóa đơn:", error);
    res.status(500).json({ message: "Lỗi server nội bộ" });
  }
}];
