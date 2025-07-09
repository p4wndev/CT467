const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// --- GET: Lấy tất cả ghế ---
exports.getAllGhe = (req, res) => {
    pool.query('SELECT * FROM Ghe', (error, rows) => {
        if (error) {
            console.error('Lỗi khi lấy danh sách ghế:', error);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy danh sách ghế.' });
        }
        res.status(200).json(rows);
    });
};

// --- GET: Lấy ghế theo MaGhe ---
exports.getGheById = (req, res) => {
    const { MaGhe } = req.params;
    pool.query('SELECT * FROM Ghe WHERE MaGhe = ?', [MaGhe], (error, rows) => {
        if (error) {
            console.error('Lỗi khi lấy ghế theo ID:', error);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy ghế.' });
        }
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghế với mã này.' });
        }
        res.status(200).json(rows[0]);
    });
};

// --- POST: Tạo ghế mới ---
exports.createGhe = [verifyToken, requireRole('staff','admin'), (req, res) => {
    const { MaGhe, MaPhong, SoGhe, LoaiGhe } = req.body;

    if (!MaGhe || !MaPhong || !SoGhe || !LoaiGhe) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: MaGhe, MaPhong, SoGhe, LoaiGhe.' });
    }

    pool.query('SELECT MaGhe FROM Ghe WHERE MaGhe = ?', [MaGhe], (error, existingGhe) => {
        if (error) {
            console.error('Lỗi khi kiểm tra mã ghế:', error);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo ghế.' });
        }
        if (existingGhe.length > 0) {
            return res.status(409).json({ message: 'Mã ghế đã tồn tại. Vui lòng chọn mã khác.' });
        }

        pool.query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong], (error, existingPhong) => {
            if (error) {
                console.error('Lỗi khi kiểm tra mã phòng:', error);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo ghế.' });
            }
            if (existingPhong.length === 0) {
                return res.status(404).json({ message: 'Mã phòng không tồn tại. Vui lòng kiểm tra lại MaPhong.' });
            }

            pool.query(
                'INSERT INTO Ghe (MaGhe, MaPhong, SoGhe, LoaiGhe) VALUES (?, ?, ?, ?)',
                [MaGhe, MaPhong, SoGhe, LoaiGhe],
                (error, result) => {
                    if (error) {
                        console.error('Lỗi khi tạo ghế:', error);
                        return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo ghế.' });
                    }
                    res.status(201).json({ message: 'Ghế đã được tạo thành công!', gheId: result.insertId });
                }
            );
        });
    });
}];

// --- PUT: Cập nhật thông tin ghế ---
exports.updateGhe = [verifyToken, requireRole('staff','admin'), (req, res) => {
    const { MaGhe } = req.params;
    const { MaPhong, SoGhe, LoaiGhe } = req.body;

    if (!MaPhong && !SoGhe && !LoaiGhe) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một thông tin để cập nhật (MaPhong, SoGhe, hoặc LoaiGhe).' });
    }

    let updateQuery = 'UPDATE Ghe SET ';
    const updateValues = [];
    const updateFields = [];

    if (MaPhong) {
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

    if (MaPhong) {
        pool.query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong], (error, existingPhong) => {
            if (error) {
                console.error('Lỗi khi kiểm tra mã phòng:', error);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật ghế.' });
            }
            if (existingPhong.length === 0) {
                return res.status(404).json({ message: 'Mã phòng không tồn tại. Vui lòng kiểm tra lại MaPhong.' });
            }

            pool.query(updateQuery, updateValues, (error, result) => {
                if (error) {
                    console.error('Lỗi khi cập nhật ghế:', error);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật ghế.' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Không tìm thấy ghế với mã này để cập nhật.' });
                }
                res.status(200).json({ message: 'Thông tin ghế đã được cập nhật thành công!' });
            });
        });
    } else {
        pool.query(updateQuery, updateValues, (error, result) => {
            if (error) {
                console.error('Lỗi khi cập nhật ghế:', error);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật ghế.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy ghế với mã này để cập nhật.' });
            }
            res.status(200).json({ message: 'Thông tin ghế đã được cập nhật thành công!' });
        });
    }
}];

// --- DELETE: Xóa ghế ---
exports.deleteGhe = [verifyToken, requireRole('staff','admin'), (req, res) => {
    const { MaGhe } = req.params;
    pool.query('DELETE FROM Ghe WHERE MaGhe = ?', [MaGhe], (error, result) => {
        if (error) {
            console.error('Lỗi khi xóa ghế:', error);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa ghế.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ghế với mã này để xóa.' });
        }
        res.status(200).json({ message: 'Ghế đã được xóa thành công!' });
    });
}];