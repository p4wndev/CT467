const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware'); // Import middleware

// --- GET: Lấy tất cả ghế ---
exports.getAllGhe = async (req, res) => {
    try {
        const [rows] = await pool.promise().query('SELECT * FROM Ghe');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ghế:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy danh sách ghế.' });
    }
};

// --- GET: Lấy ghế theo MaGhe ---
exports.getGheById = async (req, res) => {
    const { MaGhe } = req.params;
    try {
        const [rows] = await pool.promise().query('SELECT * FROM Ghe WHERE MaGhe = ?', [MaGhe]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghế với mã này.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Lỗi khi lấy ghế theo ID:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy ghế.' });
    }
};

// --- POST: Tạo ghế mới ---
exports.createGhe = [verifyToken, requireRole('admin'), async (req, res) => { 
    const { MaGhe, MaPhong, SoGhe, LoaiGhe } = req.body;

    if (!MaGhe || !MaPhong || !SoGhe || !LoaiGhe) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: MaGhe, MaPhong, SoGhe, LoaiGhe.' });
    }

    try {
        const [existingGhe] = await pool.promise().query('SELECT MaGhe FROM Ghe WHERE MaGhe = ?', [MaGhe]);
        if (existingGhe.length > 0) {
            return res.status(409).json({ message: 'Mã ghế đã tồn tại. Vui lòng chọn mã khác.' });
        }

        const [existingPhong] = await pool.promise().query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong]);
        if (existingPhong.length === 0) {
            return res.status(404).json({ message: 'Mã phòng không tồn tại. Vui lòng kiểm tra lại MaPhong.' });
        }

        const [result] = await pool.promise().query(
            'INSERT INTO Ghe (MaGhe, MaPhong, SoGhe, LoaiGhe) VALUES (?, ?, ?, ?)',
            [MaGhe, MaPhong, SoGhe, LoaiGhe]
        );
        res.status(201).json({ message: 'Ghế đã được tạo thành công!', gheId: result.insertId });
    } catch (error) {
        console.error('Lỗi khi tạo ghế:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi tạo ghế.' });
    }
}];

// --- PUT: Cập nhật thông tin ghế  ---
exports.updateGhe = [verifyToken, requireRole('admin'), async (req, res) => { 
    const { MaGhe } = req.params;
    const { MaPhong, SoGhe, LoaiGhe } = req.body;

    if (!MaPhong && !SoGhe && !LoaiGhe) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một thông tin để cập nhật (MaPhong, SoGhe, hoặc LoaiGhe).' });
    }

    try {
        let updateQuery = 'UPDATE Ghe SET ';
        const updateValues = [];
        const updateFields = [];

        if (MaPhong) {
            const [existingPhong] = await pool.promise().query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong]);
            if (existingPhong.length === 0) {
                return res.status(404).json({ message: 'Mã phòng không tồn tại. Vui lòng kiểm tra lại MaPhong.' });
            }
            updateFields.push('MaPhong = ?');
            updateValues.push(MaPhong);
        }
        if (SoGhe) {
            updateFields.push('SoGhe = ?');
            updateValues.push(SoGhe);
        }
        if (LoaiGhe) {
            updateFields.push('LoaiGhe = ?');
            updateValues.push(LoaiGhe);
        }

        updateQuery += updateFields.join(', ') + ' WHERE MaGhe = ?';
        updateValues.push(MaGhe);

        const [result] = await pool.promise().query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghế với mã này để cập nhật.' });
        }
        res.status(200).json({ message: 'Thông tin ghế đã được cập nhật thành công!' });
    } catch (error) {
        console.error('Lỗi khi cập nhật ghế:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật ghế.' });
    }
}];

// --- DELETE: Xóa ghế ---
exports.deleteGhe = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaGhe } = req.params;
    try {
        const [result] = await pool.promise().query('DELETE FROM Ghe WHERE MaGhe = ?', [MaGhe]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghế với mã này để xóa.' });
        }
        res.status(200).json({ message: 'Ghế đã được xóa thành công!' });
    } catch (error) {
        console.error('Lỗi khi xóa ghế:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi xóa ghế.' });
    }
}];
