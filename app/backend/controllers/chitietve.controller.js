const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Lấy tất cả chi tiết vé
exports.getAllChiTietVe = [verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `SELECT ctv.*, v.MaVe, sc.MaSuatChieu, g.SoGhe, g.LoaiGhe
       FROM ChiTietVe ctv
       JOIN Ve v ON ctv.MaVe = v.MaVe
       JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
       JOIN Ghe g ON ctv.MaGhe = g.MaGhe`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chi tiết vé:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Lấy chi tiết vé theo MaChiTietVe
exports.getChiTietVeById = [verifyToken, async (req, res) => {
  const { MaChiTietVe } = req.params;
  try {
    const [rows] = await pool.promise().query(
      `SELECT ctv.*, v.MaVe, sc.MaSuatChieu, g.SoGhe, g.LoaiGhe
       FROM ChiTietVe ctv
       JOIN Ve v ON ctv.MaVe = v.MaVe
       JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
       JOIN Ghe g ON ctv.MaGhe = g.MaGhe
       WHERE ctv.MaChiTietVe = ?`,
      [MaChiTietVe]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết vé' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết vé:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Tạo chi tiết vé mới (chỉ admin)
exports.createChiTietVe = [verifyToken, requireRole('admin'), async (req, res) => {
  const { MaVe, MaSuatChieu, MaGhe, TrangThai = true } = req.body;

  if (!MaVe || !MaSuatChieu || !MaGhe) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: MaVe, MaSuatChieu, MaGhe' });
  }

  try {
    const [result] = await pool.promise().query(
      'INSERT INTO ChiTietVe (MaChiTietVe, MaVe, MaSuatChieu, MaGhe, TrangThai) VALUES (?, ?, ?, ?, ?)',
      [null, MaVe, MaSuatChieu, MaGhe, TrangThai]
    );
    res.status(201).json({ message: 'Tạo chi tiết vé thành công', MaChiTietVe: result.insertId });
  } catch (error) {
    console.error('Lỗi khi tạo chi tiết vé:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Cập nhật chi tiết vé (chỉ admin)
exports.updateChiTietVe = [verifyToken, requireRole('admin'), async (req, res) => {
  const { MaChiTietVe } = req.params;
  const { MaVe, MaSuatChieu, MaGhe, TrangThai } = req.body;

  try {
    const [result] = await pool.promise().query(
      'UPDATE ChiTietVe SET MaVe = ?, MaSuatChieu = ?, MaGhe = ?, TrangThai = ? WHERE MaChiTietVe = ?',
      [MaVe, MaSuatChieu, MaGhe, TrangThai, MaChiTietVe]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết vé để cập nhật' });
    }
    res.status(200).json({ message: 'Cập nhật chi tiết vé thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật chi tiết vé:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];

// Xóa chi tiết vé (chỉ admin)
exports.deleteChiTietVe = [verifyToken, requireRole('admin'), async (req, res) => {
  const { MaChiTietVe } = req.params;
  try {
    const [result] = await pool.promise().query(
      'DELETE FROM ChiTietVe WHERE MaChiTietVe = ?',
      [MaChiTietVe]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết vé để xóa' });
    }
    res.status(200).json({ message: 'Xóa chi tiết vé thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa chi tiết vé:', error);
    res.status(500).json({ message: 'Lỗi server nội bộ' });
  }
}];
