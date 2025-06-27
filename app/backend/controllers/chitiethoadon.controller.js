const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Lấy tất cả chi tiết hóa đơn
exports.getAllChiTietHoaDon = [verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `SELECT cthd.*, hd.MaHoaDon, bn.TenCombo
       FROM ChiTietHoaDon cthd
       JOIN HoaDon hd ON cthd.MaHoaDon = hd.MaHoaDon
       LEFT JOIN BapNuoc bn ON cthd.MaCombo = bn.MaCombo`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chi tiết hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Lấy chi tiết hóa đơn theo MaChiTietHoaDon
exports.getChiTietHoaDonById = [verifyToken, async (req, res) => {
  const { MaChiTietHoaDon } = req.params;
  try {
    const [rows] = await pool.promise().query(
      `SELECT cthd.*, hd.MaHoaDon, bn.TenCombo
       FROM ChiTietHoaDon cthd
       JOIN HoaDon hd ON cthd.MaHoaDon = hd.MaHoaDon
       LEFT JOIN BapNuoc bn ON cthd.MaCombo = bn.MaCombo
       WHERE cthd.MaChiTietHoaDon = ?`,
      [MaChiTietHoaDon]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết hóa đơn' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Tạo chi tiết hóa đơn mới (chỉ admin)
exports.createChiTietHoaDon = [verifyToken, requireRole('admin'), async (req, res) => {
  const { MaHoaDon, MaCombo, SoLuong, DonGia } = req.body;

  if (!MaHoaDon || !MaCombo || SoLuong === undefined || DonGia === undefined) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: MaHoaDon, MaCombo, SoLuong, DonGia' });
  }

  try {
    const [result] = await pool.promise().query(
      'INSERT INTO ChiTietHoaDon (MaChiTietHoaDon, MaHoaDon, MaCombo, SoLuong, DonGia) VALUES (?, ?, ?, ?, ?)',
      [null, MaHoaDon, MaCombo, SoLuong, DonGia]
    );
    res.status(201).json({ message: 'Tạo chi tiết hóa đơn thành công', MaChiTietHoaDon: result.insertId });
  } catch (error) {
    console.error('Lỗi khi tạo chi tiết hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Cập nhật chi tiết hóa đơn (chỉ admin)
exports.updateChiTietHoaDon = [verifyToken, requireRole('admin'), async (req, res) => {
  const { MaChiTietHoaDon } = req.params;
  const { MaHoaDon, MaCombo, SoLuong, DonGia } = req.body;

  try {
    const [result] = await pool.promise().query(
      'UPDATE ChiTietHoaDon SET MaHoaDon = ?, MaCombo = ?, SoLuong = ?, DonGia = ? WHERE MaChiTietHoaDon = ?',
      [MaHoaDon, MaCombo, SoLuong, DonGia, MaChiTietHoaDon]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết hóa đơn để cập nhật' });
    }
    res.status(200).json({ message: 'Cập nhật chi tiết hóa đơn thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật chi tiết hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Xóa chi tiết hóa đơn (chỉ admin)
exports.deleteChiTietHoaDon = [verifyToken, requireRole('admin'), async (req, res) => {
  const { MaChiTietHoaDon } = req.params;
  try {
    const [result] = await pool.promise().query(
      'DELETE FROM ChiTietHoaDon WHERE MaChiTietHoaDon = ?',
      [MaChiTietHoaDon]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết hóa đơn để xóa' });
    }
    res.status(200).json({ message: 'Xóa chi tiết hóa đơn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa chi tiết hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];