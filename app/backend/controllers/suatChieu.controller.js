const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const crypto = require('crypto'); // Dùng để tạo ID duy nhất

// @route   POST /api/suat-chieu
// @desc    Tạo suất chiếu mới
// @access  Private (Admin)
exports.createSuatChieu = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!MaPhim || !MaPhong || !ThoiGianBatDau || !ThoiGianKetThuc || GiaVe === undefined) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin suất chiếu.' });
    }

    // Kiểm tra định dạng thời gian (nếu cần, có thể dùng thư viện như moment.js hoặc dayjs)
    try {
        const startDate = new Date(ThoiGianBatDau);
        const endDate = new Date(ThoiGianKetThuc);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Thời gian bắt đầu hoặc kết thúc không hợp lệ.' });
        }
        if (startDate >= endDate) {
            return res.status(400).json({ message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' });
        }
    } catch (error) {
        return res.status(400).json({ message: 'Định dạng thời gian không đúng. Sử dụng định dạng DATETIME hợp lệ.' });
    }


    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Kiểm tra sự tồn tại của MaPhim
        const [phimRows] = await connection.query('SELECT MaPhim FROM Phim WHERE MaPhim = ?', [MaPhim]);
        if (phimRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Mã phim không tồn tại.' });
        }

        // 2. Kiểm tra sự tồn tại của MaPhong
        const [phongRows] = await connection.query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong]);
        if (phongRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Mã phòng không tồn tại.' });
        }

        // 3. Kiểm tra trùng lịch suất chiếu trong cùng một phòng
        // Suất chiếu mới không được trùng thời gian với bất kỳ suất chiếu nào khác trong cùng phòng đó
        const [overlappingShowtimes] = await connection.query(
            `SELECT MaSuatChieu FROM SuatChieu
             WHERE MaPhong = ?
             AND (
                 (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                 (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                 (ThoiGianBatDau >= ? AND ThoiGianKetThuc <= ?)
             )`,
            [MaPhong, ThoiGianKetThuc, ThoiGianBatDau, ThoiGianBatDau, ThoiGianBatDau, ThoiGianBatDau, ThoiGianKetThuc]
        );

        if (overlappingShowtimes.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Phòng chiếu này đã có suất chiếu khác trùng thời gian.' });
        }

        // Tạo MaSuatChieu bằng UUID
        const MaSuatChieu = 'SC_' + crypto.randomUUID();

        // 4. Thêm suất chiếu vào database
        await connection.query(
            'INSERT INTO SuatChieu (MaSuatChieu, MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe) VALUES (?, ?, ?, ?, ?, ?)',
            [MaSuatChieu, MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe]
        );

        await connection.commit();
        res.status(201).json({ message: 'Suất chiếu đã được tạo thành công!', MaSuatChieu: MaSuatChieu });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Lỗi khi tạo suất chiếu:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}];

// @route   GET /api/suat-chieu
// @desc    Lấy tất cả suất chiếu (có thể có bộ lọc)
// @access  Public (hoặc Private cho Admin/User)
exports.getAllSuatChieu = [verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const {
            maPhim,           // Lọc theo MaPhim
            maPhong,          // Lọc theo MaPhong
            ngayChieu,        // Lọc theo ngày cụ thể (YYYY-MM-DD)
            tuThoiGian,       // Lọc theo ThoiGianBatDau từ (DATETIME: 'YYYY-MM-DD HH:MM:SS')
            denThoiGian,      // Lọc theo ThoiGianBatDau đến (DATETIME: 'YYYY-MM-DD HH:MM:SS')
            minGiaVe,         // Lọc theo GiaVe tối thiểu
            maxGiaVe,         // Lọc theo GiaVe tối đa
            sortBy = 'sc.ThoiGianBatDau', // Cột sắp xếp mặc định
            order = 'ASC',                // Thứ tự sắp xếp mặc định
            page = 1,                     // Trang hiện tại mặc định
            limit = 10                    // Số bản ghi mỗi trang mặc định
        } = req.query;

        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);

        if (isNaN(parsedPage) || parsedPage <= 0) {
            return res.status(400).json({ message: 'Số trang (page) không hợp lệ.' });
        }
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({ message: 'Giới hạn bản ghi (limit) không hợp lệ.' });
        }

        const offset = (parsedPage - 1) * parsedLimit;

        let baseQuery = `
            SELECT sc.MaSuatChieu, sc.MaPhim, sc.MaPhong, sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.GiaVe,
                   p.TenPhim, p.ThoiLuong,
                   pc.TenPhong, pc.SoLuongGhe
            FROM SuatChieu sc
            JOIN Phim p ON sc.MaPhim = p.MaPhim
            JOIN PhongChieu pc ON sc.MaPhong = pc.MaPhong
        `;

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM SuatChieu sc
            JOIN Phim p ON sc.MaPhim = p.MaPhim
            JOIN PhongChieu pc ON sc.MaPhong = pc.MaPhong
        `;

        const queryParams = [];
        const countQueryParams = [];
        const conditions = [];

        // --- Lọc (Filtering) ---
        if (maPhim) {
            conditions.push('sc.MaPhim = ?');
            queryParams.push(maPhim);
            countQueryParams.push(maPhim);
        }
        if (maPhong) {
            conditions.push('sc.MaPhong = ?');
            queryParams.push(maPhong);
            countQueryParams.push(maPhong);
        }

        // Lọc theo ngày cụ thể (chỉ ngày, bỏ qua giờ, phút, giây)
        if (ngayChieu) {
            // Đảm bảo ngayChieu có định dạng 'YYYY-MM-DD'
            conditions.push('DATE(sc.ThoiGianBatDau) = ?');
            queryParams.push(ngayChieu);
            countQueryParams.push(ngayChieu);
        } else {
            // Lọc theo khoảng thời gian DATETIME (linh hoạt hơn)
            if (tuThoiGian) {
                conditions.push('sc.ThoiGianBatDau >= ?');
                queryParams.push(tuThoiGian);
                countQueryParams.push(tuThoiGian);
            }
            if (denThoiGian) {
                conditions.push('sc.ThoiGianBatDau <= ?');
                queryParams.push(denThoiGian);
                countQueryParams.push(denThoiGian);
            }
        }
        
        if (minGiaVe !== undefined) {
            conditions.push('sc.GiaVe >= ?');
            queryParams.push(parseFloat(minGiaVe));
            countQueryParams.push(parseFloat(minGiaVe));
        }
        if (maxGiaVe !== undefined) {
            conditions.push('sc.GiaVe <= ?');
            queryParams.push(parseFloat(maxGiaVe));
            countQueryParams.push(parseFloat(maxGiaVe));
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            baseQuery += whereClause;
            countQuery += whereClause;
        }

        // --- Sắp xếp (Sorting) ---
        const validSortColumns = {
            'MaSuatChieu': 'sc.MaSuatChieu',
            'MaPhim': 'sc.MaPhim',
            'MaPhong': 'sc.MaPhong',
            'ThoiGianBatDau': 'sc.ThoiGianBatDau',
            'ThoiGianKetThuc': 'sc.ThoiGianKetThuc',
            'GiaVe': 'sc.GiaVe',
            'TenPhim': 'p.TenPhim',
            'TenPhong': 'pc.TenPhong'
        };
        const finalSortBy = validSortColumns[sortBy] || 'sc.ThoiGianBatDau';
        const finalOrder = (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC') ? order.toUpperCase() : 'ASC';

        baseQuery += ` ORDER BY ${finalSortBy} ${finalOrder}`;

        // --- Phân trang (Pagination) ---
        baseQuery += ` LIMIT ? OFFSET ?`;
        queryParams.push(parsedLimit, offset);

        // Thực thi truy vấn đếm tổng số bản ghi
        const [totalRowsResult] = await pool.promise().query(countQuery, countQueryParams);
        const totalSuatChieu = totalRowsResult[0].total;
        const totalPages = Math.ceil(totalSuatChieu / parsedLimit);

        // Thực thi truy vấn lấy dữ liệu chính
        const [suatChieuList] = await pool.promise().query(baseQuery, queryParams);

        res.status(200).json({
            totalItems: totalSuatChieu,
            totalPages: totalPages,
            currentPage: parsedPage,
            itemsPerPage: parsedLimit,
            suatChieu: suatChieuList
        });

    } catch (error) {
        console.error('Lỗi khi lấy danh sách suất chiếu:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy danh sách suất chiếu.' });
    }
}];

// @route   GET /api/suat-chieu/:MaSuatChieu
// @desc    Lấy thông tin chi tiết một suất chiếu
// @access  Public (hoặc Private cho Admin/User)
exports.getSuatChieuById = async (req, res) => {
    const { MaSuatChieu } = req.params;

    try {
        const [suatChieuRows] = await pool.promise().query(
            `SELECT sc.*, p.TenPhim, pc.TenPhong
             FROM SuatChieu sc
             JOIN Phim p ON sc.MaPhim = p.MaPhim
             JOIN PhongChieu pc ON sc.MaPhong = pc.MaPhong
             WHERE sc.MaSuatChieu = ?`,
            [MaSuatChieu]
        );

        if (suatChieuRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy suất chiếu với mã này.' });
        }
        res.status(200).json(suatChieuRows[0]);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết suất chiếu:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết suất chiếu.' });
    }
};

// @route   PUT /api/suat-chieu/:MaSuatChieu
// @desc    Cập nhật thông tin suất chiếu
// @access  Private (Admin)
exports.updateSuatChieu = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaSuatChieu } = req.params;
    const { MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe } = req.body;

    if (!MaPhim && !MaPhong && !ThoiGianBatDau && !ThoiGianKetThuc && GiaVe === undefined) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một thông tin để cập nhật.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let updateQuery = 'UPDATE SuatChieu SET ';
        const updateValues = [];
        const updateFields = [];

        // Kiểm tra và thêm vào updateFields/updateValues nếu có dữ liệu
        if (MaPhim) {
            const [phimRows] = await connection.query('SELECT MaPhim FROM Phim WHERE MaPhim = ?', [MaPhim]);
            if (phimRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Mã phim không tồn tại.' });
            }
            updateFields.push('MaPhim = ?');
            updateValues.push(MaPhim);
        }
        if (MaPhong) {
            const [phongRows] = await connection.query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong]);
            if (phongRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Mã phòng không tồn tại.' });
            }
            updateFields.push('MaPhong = ?');
            updateValues.push(MaPhong);
        }
        if (ThoiGianBatDau) {
            const startDate = new Date(ThoiGianBatDau);
            if (isNaN(startDate.getTime())) {
                await connection.rollback();
                return res.status(400).json({ message: 'Thời gian bắt đầu không hợp lệ.' });
            }
            updateFields.push('ThoiGianBatDau = ?');
            updateValues.push(ThoiGianBatDau);
        }
        if (ThoiGianKetThuc) {
            const endDate = new Date(ThoiGianKetThuc);
            if (isNaN(endDate.getTime())) {
                await connection.rollback();
                return res.status(400).json({ message: 'Thời gian kết thúc không hợp lệ.' });
            }
            updateFields.push('ThoiGianKetThuc = ?');
            updateValues.push(ThoiGianKetThuc);
        }
        if (GiaVe !== undefined) {
            updateFields.push('GiaVe = ?');
            updateValues.push(GiaVe);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Không có thông tin nào để cập nhật.' });
        }

        // Lấy thông tin suất chiếu hiện tại để kiểm tra trùng lịch nếu thời gian/phòng thay đổi
        const [currentShowtimeRows] = await connection.query('SELECT MaPhong, ThoiGianBatDau, ThoiGianKetThuc FROM SuatChieu WHERE MaSuatChieu = ?', [MaSuatChieu]);
        if (currentShowtimeRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy suất chiếu để cập nhật.' });
        }
        const currentShowtime = currentShowtimeRows[0];

        // Lấy giá trị mới của phòng và thời gian để kiểm tra trùng lặp
        const newMaPhong = MaPhong || currentShowtime.MaPhong;
        const newThoiGianBatDau = ThoiGianBatDau || currentShowtime.ThoiGianBatDau;
        const newThoiGianKetThuc = ThoiGianKetThuc || currentShowtime.ThoiGianKetThuc;

        // Kiểm tra hợp lệ thời gian mới (nếu có thay đổi)
        if (new Date(newThoiGianBatDau) >= new Date(newThoiGianKetThuc)) {
            await connection.rollback();
            return res.status(400).json({ message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' });
        }

        // Kiểm tra trùng lịch suất chiếu sau khi cập nhật
        const [overlappingShowtimes] = await connection.query(
            `SELECT MaSuatChieu FROM SuatChieu
             WHERE MaPhong = ?
             AND MaSuatChieu != ? -- Loại trừ chính suất chiếu đang cập nhật
             AND (
                 (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                 (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                 (ThoiGianBatDau >= ? AND ThoiGianKetThuc <= ?)
             )`,
            [newMaPhong, MaSuatChieu, newThoiGianKetThuc, newThoiGianBatDau, newThoiGianBatDau, newThoiGianBatDau, newThoiGianBatDau, newThoiGianKetThuc]
        );

        if (overlappingShowtimes.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Phòng chiếu này đã có suất chiếu khác trùng thời gian sau khi cập nhật.' });
        }

        updateQuery += updateFields.join(', ') + ' WHERE MaSuatChieu = ?';
        updateValues.push(MaSuatChieu);

        const [result] = await connection.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy suất chiếu với mã này để cập nhật.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Thông tin suất chiếu đã được cập nhật thành công!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Lỗi khi cập nhật suất chiếu:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}];

// @route   DELETE /api/suat-chieu/:MaSuatChieu
// @desc    Xóa suất chiếu
// @access  Private (Admin)
exports.deleteSuatChieu = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaSuatChieu } = req.params;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Kiểm tra xem có chi tiết vé nào đang hoạt động liên quan đến suất chiếu này không
        // Nếu có, không cho phép xóa để tránh làm mất dữ liệu vé của người dùng
        const [activeTicketDetails] = await connection.query(
            'SELECT MaChiTietVe FROM ChiTietVe WHERE MaSuatChieu = ? AND TrangThai = TRUE',
            [MaSuatChieu]
        );

        if (activeTicketDetails.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Không thể xóa suất chiếu này vì có vé đang hoạt động liên quan. Vui lòng hủy các vé đó trước.' });
        }

        // Tùy chọn: Xóa các chi tiết vé ĐÃ HỦY liên quan trước
        // Hoặc để database tự động xử lý CASCADE DELETE nếu bạn đã cấu hình FOREIGN KEY ON DELETE CASCADE
        await connection.query('DELETE FROM ChiTietVe WHERE MaSuatChieu = ?', [MaSuatChieu]);


        // Xóa suất chiếu
        const [result] = await connection.query('DELETE FROM SuatChieu WHERE MaSuatChieu = ?', [MaSuatChieu]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy suất chiếu với mã này để xóa.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Suất chiếu đã được xóa thành công!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Lỗi khi xóa suất chiếu:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}];
