const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const crypto = require('crypto');

// @route   POST /api/suat-chieu
// @desc    Tạo suất chiếu mới
// @access  Private (Admin)
exports.createSuatChieu = [verifyToken, requireRole("staff","admin"), (req, res) => {
    const { MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!MaPhim || !MaPhong || !ThoiGianBatDau || !ThoiGianKetThuc || GiaVe === undefined) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin suất chiếu.' });
    }

    // Kiểm tra định dạng thời gian
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

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
            }

            // 1. Kiểm tra sự tồn tại của MaPhim
            connection.query('SELECT MaPhim FROM Phim WHERE MaPhim = ?', [MaPhim], (err, phimRows) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    console.error('Lỗi khi kiểm tra mã phim:', err);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
                }
                if (phimRows.length === 0) {
                    connection.rollback(() => connection.release());
                    return res.status(404).json({ message: 'Mã phim không tồn tại.' });
                }

                // 2. Kiểm tra sự tồn tại của MaPhong
                connection.query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong], (err, phongRows) => {
                    if (err) {
                        connection.rollback(() => connection.release());
                        console.error('Lỗi khi kiểm tra mã phòng:', err);
                        return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
                    }
                    if (phongRows.length === 0) {
                        connection.rollback(() => connection.release());
                        return res.status(404).json({ message: 'Mã phòng không tồn tại.' });
                    }

                    // 3. Kiểm tra trùng lịch suất chiếu
                    connection.query(
                        `SELECT MaSuatChieu FROM SuatChieu
                         WHERE MaPhong = ?
                         AND (
                             (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                             (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                             (ThoiGianBatDau >= ? AND ThoiGianKetThuc <= ?)
                         )`,
                        [MaPhong, ThoiGianKetThuc, ThoiGianBatDau, ThoiGianBatDau, ThoiGianBatDau, ThoiGianBatDau, ThoiGianKetThuc],
                        (err, overlappingShowtimes) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error('Lỗi khi kiểm tra trùng lịch:', err);
                                return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
                            }
                            if (overlappingShowtimes.length > 0) {
                                connection.rollback(() => connection.release());
                                return res.status(409).json({ message: 'Phòng chiếu này đã có suất chiếu khác trùng thời gian.' });
                            }

                            // Tạo MaSuatChieu bằng UUID
                            const MaSuatChieu = 'SC_' + crypto.randomUUID();

                            // 4. Thêm suất chiếu vào database
                            connection.query(
                                'INSERT INTO SuatChieu (MaSuatChieu, MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe) VALUES (?, ?, ?, ?, ?, ?)',
                                [MaSuatChieu, MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe],
                                (err, result) => {
                                    if (err) {
                                        connection.rollback(() => connection.release());
                                        console.error('Lỗi khi tạo suất chiếu:', err);
                                        return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
                                    }

                                    connection.commit((err) => {
                                        if (err) {
                                            connection.rollback(() => connection.release());
                                            console.error('Lỗi khi commit transaction:', err);
                                            return res.status(500).json({ message: 'Lỗi server nội bộ khi tạo suất chiếu.' });
                                        }
                                        connection.release();
                                        res.status(201).json({ message: 'Suất chiếu đã được tạo thành công!', MaSuatChieu: MaSuatChieu });
                                    });
                                }
                            );
                        }
                    );
                });
            });
        });
    });
}];

// @route   GET /api/suat-chieu
// @desc    Lấy tất cả suất chiếu (có thể có bộ lọc)
// @access  Public (hoặc Private cho Admin/User)
exports.getAllSuatChieu = [(req, res) => {
    const {
        maPhim,
        maPhong,
        ngayChieu,
        tuThoiGian,
        denThoiGian,
        minGiaVe,
        maxGiaVe,
        sortBy = 'sc.ThoiGianBatDau',
        order = 'ASC',
        page = 1,
        limit = 10
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
    if (ngayChieu) {
        conditions.push('DATE(sc.ThoiGianBatDau) = ?');
        queryParams.push(ngayChieu);
        countQueryParams.push(ngayChieu);
    } else {
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
    baseQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(parsedLimit, offset);

    // Thực thi truy vấn đếm tổng số bản ghi
    pool.query(countQuery, countQueryParams, (err, totalRowsResult) => {
        if (err) {
            console.error('Lỗi khi đếm tổng số suất chiếu:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy danh sách suất chiếu.' });
        }

        const totalSuatChieu = totalRowsResult[0].total;
        const totalPages = Math.ceil(totalSuatChieu / parsedLimit);

        // Thực thi truy vấn lấy dữ liệu chính
        pool.query(baseQuery, queryParams, (err, suatChieuList) => {
            if (err) {
                console.error('Lỗi khi lấy danh sách suất chiếu:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy danh sách suất chiếu.' });
            }

            res.status(200).json({
                totalItems: totalSuatChieu,
                totalPages: totalPages,
                currentPage: parsedPage,
                itemsPerPage: parsedLimit,
                suatChieu: suatChieuList
            });
        });
    });
}];

// @route   GET /api/suat-chieu/:MaSuatChieu
// @desc    Lấy thông tin chi tiết một suất chiếu
// @access  Public (hoặc Private cho Admin/User)
exports.getSuatChieuById = (req, res) => {
    const { MaSuatChieu } = req.params;

    pool.query(
        `SELECT sc.*, p.TenPhim, pc.TenPhong
         FROM SuatChieu sc
         JOIN Phim p ON sc.MaPhim = p.MaPhim
         JOIN PhongChieu pc ON sc.MaPhong = pc.MaPhong
         WHERE sc.MaSuatChieu = ?`,
        [MaSuatChieu],
        (err, suatChieuRows) => {
            if (err) {
                console.error('Lỗi khi lấy chi tiết suất chiếu:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết suất chiếu.' });
            }
            if (suatChieuRows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy suất chiếu với mã này.' });
            }
            res.status(200).json(suatChieuRows[0]);
        }
    );
};

// @route   PUT /api/suat-chieu/:MaSuatChieu呼び
// @desc    Cập nhật thông tin suất chiếu
// @access  Private (Admin)
exports.updateSuatChieu = [verifyToken, requireRole("staff","admin"), (req, res) => {
    const { MaSuatChieu } = req.params;
    const { MaPhim, MaPhong, ThoiGianBatDau, ThoiGianKetThuc, GiaVe } = req.body;

    if (!MaPhim && !MaPhong && !ThoiGianBatDau && !ThoiGianKetThuc && GiaVe === undefined) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một thông tin để cập nhật.' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
            }

            let updateQuery = 'UPDATE SuatChieu SET ';
            const updateValues = [];
            const updateFields = [];

            // Kiểm tra và thêm vào updateFields/updateValues nếu có dữ liệu
            const checkFields = (callback) => {
                if (MaPhim) {
                    connection.query('SELECT MaPhim FROM Phim WHERE MaPhim = ?', [MaPhim], (err, phimRows) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi kiểm tra mã phim:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
                        }
                        if (phimRows.length === 0) {
                            connection.rollback(() => connection.release());
                            return res.status(404).json({ message: 'Mã phim không tồn tại.' });
                        }
                        updateFields.push('MaPhim = ?');
                        updateValues.push(MaPhim);
                        callback();
                    });
                } else {
                    callback();
                }
            };

            checkFields(() => {
                if (MaPhong) {
                    connection.query('SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?', [MaPhong], (err, phongRows) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi kiểm tra mã phòng:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
                        }
                        if (phongRows.length === 0) {
                            connection.rollback(() => connection.release());
                            return res.status(404).json({ message: 'Mã phòng không tồn tại.' });
                        }
                        updateFields.push('MaPhong = ?');
                        updateValues.push(MaPhong);
                        checkTime();
                    });
                } else {
                    checkTime();
                }
            });

            const checkTime = () => {
                if (ThoiGianBatDau) {
                    const startDate = new Date(ThoiGianBatDau);
                    if (isNaN(startDate.getTime())) {
                        connection.rollback(() => connection.release());
                        return res.status(400).json({ message: 'Thời gian bắt đầu không hợp lệ.' });
                    }
                    updateFields.push('ThoiGianBatDau = ?');
                    updateValues.push(ThoiGianBatDau);
                }
                if (ThoiGianKetThuc) {
                    const endDate = new Date(ThoiGianKetThuc);
                    if (isNaN(endDate.getTime())) {
                        connection.rollback(() => connection.release());
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
                    connection.release();
                    return res.status(400).json({ message: 'Không có thông tin nào để cập nhật.' });
                }

                // Lấy thông tin suất chiếu hiện tại
                connection.query('SELECT MaPhong, ThoiGianBatDau, ThoiGianKetThuc FROM SuatChieu WHERE MaSuatChieu = ?', [MaSuatChieu], (err, currentShowtimeRows) => {
                    if (err) {
                        connection.rollback(() => connection.release());
                        console.error('Lỗi khi lấy thông tin suất chiếu:', err);
                        return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
                    }
                    if (currentShowtimeRows.length === 0) {
                        connection.rollback(() => connection.release());
                        return res.status(404).json({ message: 'Không tìm thấy suất chiếu để cập nhật.' });
                    }
                    const currentShowtime = currentShowtimeRows[0];

                    // Lấy giá trị mới của phòng và thời gian
                    const newMaPhong = MaPhong || currentShowtime.MaPhong;
                    const newThoiGianBatDau = ThoiGianBatDau || currentShowtime.ThoiGianBatDau;
                    const newThoiGianKetThuc = ThoiGianKetThuc || currentShowtime.ThoiGianKetThuc;

                    // Kiểm tra hợp lệ thời gian mới
                    if (new Date(newThoiGianBatDau) >= new Date(newThoiGianKetThuc)) {
                        connection.rollback(() => connection.release());
                        return res.status(400).json({ message: 'Thời gian bắt đầu phải trước thời gian kết thúc.' });
                    }

                    // Kiểm tra trùng lịch suất chiếu
                    connection.query(
                        `SELECT MaSuatChieu FROM SuatChieu
                         WHERE MaPhong = ?
                         AND MaSuatChieu != ?
                         AND (
                             (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                             (ThoiGianBatDau < ? AND ThoiGianKetThuc > ?) OR
                             (ThoiGianBatDau >= ? AND ThoiGianKetThuc <= ?)
                         )`,
                        [newMaPhong, MaSuatChieu, newThoiGianKetThuc, newThoiGianBatDau, newThoiGianBatDau, newThoiGianBatDau, newThoiGianBatDau, newThoiGianKetThuc],
                        (err, overlappingShowtimes) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error('Lỗi khi kiểm tra trùng lịch:', err);
                                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
                            }
                            if (overlappingShowtimes.length > 0) {
                                connection.rollback(() => connection.release());
                                return res.status(409).json({ message: 'Phòng chiếu này đã có suất chiếu khác trùng thời gian sau khi cập nhật.' });
                            }

                            updateQuery += updateFields.join(', ') + ' WHERE MaSuatChieu = ?';
                            updateValues.push(MaSuatChieu);

                            connection.query(updateQuery, updateValues, (err, result) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    console.error('Lỗi khi cập nhật suất chiếu:', err);
                                    return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
                                }
                                if (result.affectedRows === 0) {
                                    connection.rollback(() => connection.release());
                                    return res.status(404).json({ message: 'Không tìm thấy suất chiếu với mã này để cập nhật.' });
                                }

                                connection.commit((err) => {
                                    if (err) {
                                        connection.rollback(() => connection.release());
                                        console.error('Lỗi khi commit transaction:', err);
                                        return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật suất chiếu.' });
                                    }
                                    connection.release();
                                    res.status(200).json({ message: 'Thông tin suất chiếu đã được cập nhật thành công!' });
                                });
                            });
                        }
                    );
                });
            };
        });
    });
}];

// @route   DELETE /api/suat-chieu/:MaSuatChieu
// @desc    Xóa suất chiếu
// @access  Private (Admin)
exports.deleteSuatChieu = [verifyToken, requireRole("staff","admin"), (req, res) => {
    const { MaSuatChieu } = req.params;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
            }

            // Kiểm tra chi tiết vé đang hoạt động
            connection.query(
                'SELECT MaChiTietVe FROM ChiTietVe WHERE MaSuatChieu = ? AND TrangThai = TRUE',
                [MaSuatChieu],
                (err, activeTicketDetails) => {
                    if (err) {
                        connection.rollback(() => connection.release());
                        console.error('Lỗi khi kiểm tra chi tiết vé:', err);
                        return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
                    }
                    if (activeTicketDetails.length > 0) {
                        connection.rollback(() => connection.release());
                        return res.status(400).json({ message: 'Không thể xóa suất chiếu này vì có vé đang hoạt động liên quan. Vui lòng hủy các vé đó trước.' });
                    }

                    // Xóa chi tiết vé đã hủy
                    connection.query('DELETE FROM ChiTietVe WHERE MaSuatChieu = ?', [MaSuatChieu], (err) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi xóa chi tiết vé:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
                        }

                        // Xóa suất chiếu
                        connection.query('DELETE FROM SuatChieu WHERE MaSuatChieu = ?', [MaSuatChieu], (err, result) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error('Lỗi khi xóa suất chiếu:', err);
                                return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
                            }
                            if (result.affectedRows === 0) {
                                connection.rollback(() => connection.release());
                                return res.status(404).json({ message: 'Không tìm thấy suất chiếu với mã này để xóa.' });
                            }

                            connection.commit((err) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    console.error('Lỗi khi commit transaction:', err);
                                    return res.status(500).json({ message: 'Lỗi server nội bộ khi xóa suất chiếu.' });
                                }
                                connection.release();
                                res.status(200).json({ message: 'Suất chiếu đã được xóa thành công!' });
                            });
                        });
                    });
                }
            );
        });
    });
}];