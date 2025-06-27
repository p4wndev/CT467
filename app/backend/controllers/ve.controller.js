const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const crypto = require('crypto');

const seatPrices = {
    'Standard': 100000,
    'VIP': 150000,
    'Couple': 250000
};

const CANCELLATION_BUFFER_MINUTES = 15;

// --- Chức năng cho NGƯỜI DÙNG ---

// @route   POST /api/ve/dat-ve
// @desc    Đặt vé mới
// @access  Private (Người dùng đã xác thực)
exports.createTicket = [verifyToken, (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung;
    const { MaSuatChieu, selectedSeats } = req.body;

    if (!MaSuatChieu || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ MaSuatChieu và selectedSeats (mảng các MaGhe).' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
            }

            // 1. Kiểm tra sự tồn tại của SuatChieu và lấy GiaVe
            connection.query('SELECT MaSuatChieu, GiaVe, ThoiGianBatDau FROM SuatChieu WHERE MaSuatChieu = ?', [MaSuatChieu], (err, showtimeRows) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    console.error('Lỗi khi kiểm tra suất chiếu:', err);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
                }
                if (showtimeRows.length === 0) {
                    connection.rollback(() => connection.release());
                    return res.status(404).json({ message: 'Mã suất chiếu không tồn tại.' });
                }

                const ThoiGianBatDauSuatChieu = new Date(showtimeRows[0].ThoiGianBatDau);
                const GiaVe = showtimeRows[0].GiaVe;
                const now = new Date();

                if (now.getTime() >= ThoiGianBatDauSuatChieu.getTime() - (CANCELLATION_BUFFER_MINUTES * 60 * 1000)) {
                    connection.rollback(() => connection.release());
                    return res.status(400).json({ message: 'Không thể đặt vé cho suất chiếu đã bắt đầu hoặc quá gần giờ chiếu.' });
                }

                if (!GiaVe || isNaN(GiaVe) || GiaVe <= 0) {
                    connection.rollback(() => connection.release());
                    return res.status(400).json({ message: 'Giá vé của suất chiếu không hợp lệ.' });
                }

                let TongTien = 0;
                const ticketDetailsToInsert = [];

                const checkSeats = (index, callback) => {
                    if (index >= selectedSeats.length) return callback();

                    const MaGhe = selectedSeats[index];
                    connection.query('SELECT LoaiGhe FROM Ghe WHERE MaGhe = ?', [MaGhe], (err, seatRows) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi kiểm tra ghế:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
                        }
                        if (seatRows.length === 0) {
                            connection.rollback(() => connection.release());
                            return res.status(404).json({ message: `Ghế với mã ${MaGhe} không tồn tại.` });
                        }
                        const LoaiGhe = seatRows[0].LoaiGhe;

                        // Kiểm tra loại ghế hợp lệ
                        if (!['Đơn', 'VIP', 'Couple'].includes(LoaiGhe)) {
                            connection.rollback(() => connection.release());
                            return res.status(400).json({ message: `Loại ghế ${LoaiGhe} không hợp lệ.` });
                        }

                        connection.query(
                            'SELECT MaChiTietVe FROM ChiTietVe WHERE MaSuatChieu = ? AND MaGhe = ? AND TrangThai = TRUE',
                            [MaSuatChieu, MaGhe],
                            (err, bookedSeatRows) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    console.error('Lỗi khi kiểm tra ghế đã đặt:', err);
                                    return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
                                }
                                if (bookedSeatRows.length > 0) {
                                    connection.rollback(() => connection.release());
                                    return res.status(409).json({ message: `Ghế ${MaGhe} đã được đặt cho suất chiếu này.` });
                                }

                                // Logic tính giá mới
                                const price = LoaiGhe === 'Đơn' ? GiaVe : GiaVe + 4000;
                                TongTien += price;
                                ticketDetailsToInsert.push({ MaGhe, LoaiGhe });

                                checkSeats(index + 1, callback);
                            }
                        );
                    });
                };

                checkSeats(0, () => {
                    const generateShortId = (length = 8) => {
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        let result = '';
                        const charactersLength = characters.length;
                        for (let i = 0; i < length; i++) {
                            result += characters.charAt(Math.floor(Math.random() * charactersLength));
                        }
                        return result;
                    };

                    const MaVe = 'V' + generateShortId(6);
                    const NgayDat = new Date().toISOString().slice(0, 10);

                    connection.query(
                        'INSERT INTO Ve (MaVe, MaNguoiDung, TongTien, NgayDat) VALUES (?, ?, ?, ?)',
                        [MaVe, MaNguoiDung, TongTien, NgayDat],
                        (err) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error('Lỗi khi tạo vé:', err);
                                return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
                            }

                            const insertTicketDetails = (index, callback) => {
                                if (index >= ticketDetailsToInsert.length) return callback();

                                const detail = ticketDetailsToInsert[index];
                                const MaChiTietVe = 'CTV' + generateShortId(6);
                                connection.query(
                                    'INSERT INTO ChiTietVe (MaChiTietVe, MaVe, MaSuatChieu, MaGhe, TrangThai) VALUES (?, ?, ?, ?, ?)',
                                    [MaChiTietVe, MaVe, MaSuatChieu, detail.MaGhe, true],
                                    (err) => {
                                        if (err) {
                                            connection.rollback(() => connection.release());
                                            console.error('Lỗi khi tạo chi tiết vé:', err);
                                            return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
                                        }
                                        insertTicketDetails(index + 1, callback);
                                    }
                                );
                            };

                            insertTicketDetails(0, () => {
                                connection.commit((err) => {
                                    if (err) {
                                        connection.rollback(() => connection.release());
                                        console.error('Lỗi khi commit transaction:', err);
                                        return res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
                                    }
                                    connection.release();
                                    res.status(201).json({ message: 'Vé đã được đặt thành công!', MaVe: MaVe, TongTien: TongTien });
                                });
                            });
                        }
                    );
                });
            });
        });
    });
}];

// @route   GET /api/ve/lich-su
// @desc    Lấy lịch sử vé của người dùng hiện tại
// @access  Private (Người dùng đã xác thực)
exports.getUserTickets = [verifyToken, (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung;

    pool.query(
        `SELECT v.*, COUNT(ctv.MaChiTietVe) AS SoLuongGhe, GROUP_CONCAT(g.SoGhe) AS CacSoGhe, GROUP_CONCAT(sc.ThoiGianBatDau) AS ThoiGianChieu
         FROM Ve v
         LEFT JOIN ChiTietVe ctv ON v.MaVe = ctv.MaVe
         LEFT JOIN Ghe g ON ctv.MaGhe = g.MaGhe
         LEFT JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
         WHERE v.MaNguoiDung = ?
         GROUP BY v.MaVe
         ORDER BY v.NgayDat DESC`,
        [MaNguoiDung],
        (err, tickets) => {
            if (err) {
                console.error('Lỗi khi lấy lịch sử vé người dùng:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy lịch sử vé.' });
            }
            res.status(200).json(tickets);
        }
    );
}];

// @route   GET /api/ve/:MaVe
// @desc    Lấy chi tiết vé của người dùng (đảm bảo thuộc về họ)
// @access  Private (Người dùng đã xác thực)
exports.getTicketDetails = [verifyToken, (req, res) => {
    const { MaVe } = req.params;
    const MaNguoiDung = req.user.MaNguoiDung;

    pool.query('SELECT * FROM Ve WHERE MaVe = ? AND MaNguoiDung = ?', [MaVe, MaNguoiDung], (err, veRows) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin vé:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết vé.' });
        }
        if (veRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy vé hoặc bạn không có quyền truy cập vé này.' });
        }
        const ve = veRows[0];

        pool.query(
            `SELECT ctv.MaChiTietVe, ctv.MaSuatChieu, ctv.MaGhe, ctv.TrangThai AS TrangThaiChiTietVe,
                    sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.MaPhim, sc.MaPhong,
                    g.SoGhe, g.LoaiGhe
             FROM ChiTietVe ctv
             JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
             JOIN Ghe g ON ctv.MaGhe = g.MaGhe
             WHERE ctv.MaVe = ?`,
            [MaVe],
            (err, chiTietVeRows) => {
                if (err) {
                    console.error('Lỗi khi lấy chi tiết vé:', err);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết vé.' });
                }
                ve.chiTiet = chiTietVeRows;
                res.status(200).json(ve);
            }
        );
    });
}];

// @route   PUT /api/ve/:MaVe/huy
// @desc    Hủy vé (cập nhật trạng thái trong ChiTietVe thành FALSE) - User
// @access  Private (Người dùng đã xác thực)
exports.cancelTicket = [verifyToken, (req, res) => {
    const { MaVe } = req.params;
    const MaNguoiDung = req.user.MaNguoiDung;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
            }

            connection.query('SELECT MaVe FROM Ve WHERE MaVe = ? AND MaNguoiDung = ?', [MaVe, MaNguoiDung], (err, veRows) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    console.error('Lỗi khi kiểm tra vé:', err);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                }
                if (veRows.length === 0) {
                    connection.rollback(() => connection.release());
                    return res.status(404).json({ message: 'Không tìm thấy vé hoặc bạn không có quyền hủy vé này.' });
                }

                connection.query(
                    `SELECT ctv.MaChiTietVe, ctv.MaSuatChieu, sc.ThoiGianBatDau, ctv.TrangThai
                     FROM ChiTietVe ctv
                     JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
                     WHERE ctv.MaVe = ? AND ctv.TrangThai = TRUE`,
                    [MaVe],
                    (err, chiTietVeRows) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi lấy chi tiết vé:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                        }
                        if (chiTietVeRows.length === 0) {
                            connection.rollback(() => connection.release());
                            return res.status(400).json({ message: 'Vé đã được hủy hoặc không có ghế nào đang hoạt động để hủy.' });
                        }

                        const now = new Date();
                        for (const detail of chiTietVeRows) {
                            const showtimeStart = new Date(detail.ThoiGianBatDau);
                            if (now.getTime() >= showtimeStart.getTime() - (CANCELLATION_BUFFER_MINUTES * 60 * 1000)) {
                                connection.rollback(() => connection.release());
                                return res.status(400).json({ message: `Không thể hủy vé vì suất chiếu ${detail.MaSuatChieu} đã quá thời hạn hủy (phải hủy trước ${CANCELLATION_BUFFER_MINUTES} phút).` });
                            }
                        }

                        connection.query(
                            'UPDATE ChiTietVe SET TrangThai = FALSE WHERE MaVe = ? AND TrangThai = TRUE',
                            [MaVe],
                            (err, updateResult) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    console.error('Lỗi khi cập nhật trạng thái vé:', err);
                                    return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                                }
                                if (updateResult.affectedRows === 0) {
                                    connection.rollback(() => connection.release());
                                    return res.status(400).json({ message: 'Không có chi tiết vé nào được cập nhật. Có thể đã bị hủy trước đó.' });
                                }

                                connection.commit((err) => {
                                    if (err) {
                                        connection.rollback(() => connection.release());
                                        console.error('Lỗi khi commit transaction:', err);
                                        return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                                    }
                                    connection.release();
                                    res.status(200).json({ message: 'Vé đã được hủy thành công!' });
                                });
                            }
                        );
                    }
                );
            });
        });
    });
}];

// --- Chức năng cho ADMIN ---

// @route   GET /api/admin/ve
// @desc    Lấy tất cả vé (cho Admin)
// @access  Private (Admin)
exports.getAllTicketsAdmin = [verifyToken, requireRole("staff","admin"),  (req, res) => {
    const {
        status,
        userId,
        minTotal,
        maxTotal,
        startDate,
        endDate,
        maSuatChieu,
        sortBy = 'v.NgayDat',
        order = 'DESC',
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
        SELECT v.MaVe, v.MaNguoiDung, v.TongTien, v.NgayDat,
               nd.TenNguoiDung, nd.Email,
               GROUP_CONCAT(DISTINCT CONCAT(ctv.MaChiTietVe, ':', ctv.TrangThai, ':', g.SoGhe, ':', sc.ThoiGianBatDau, ':', sc.MaPhim) ORDER BY ctv.MaChiTietVe ASC SEPARATOR ';') AS ChiTietVeFormatted
        FROM Ve v
        JOIN NguoiDung nd ON v.MaNguoiDung = nd.MaNguoiDung
        LEFT JOIN ChiTietVe ctv ON v.MaVe = ctv.MaVe
        LEFT JOIN Ghe g ON ctv.MaGhe = g.MaGhe
        LEFT JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT v.MaVe) AS total
        FROM Ve v
        JOIN NguoiDung nd ON v.MaNguoiDung = nd.MaNguoiDung
        LEFT JOIN ChiTietVe ctv ON v.MaVe = ctv.MaVe
        LEFT JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
    `;

    const queryParams = [];
    const countQueryParams = [];
    const conditions = [];

    if (userId) {
        conditions.push('v.MaNguoiDung = ?');
        queryParams.push(userId);
        countQueryParams.push(userId);
    }
    if (minTotal !== undefined) {
        conditions.push('v.TongTien >= ?');
        queryParams.push(parseFloat(minTotal));
        countQueryParams.push(parseFloat(minTotal));
    }
    if (maxTotal !== undefined) {
        conditions.push('v.TongTien <= ?');
        queryParams.push(parseFloat(maxTotal));
        countQueryParams.push(parseFloat(maxTotal));
    }
    if (startDate) {
        conditions.push('v.NgayDat >= ?');
        queryParams.push(startDate);
        countQueryParams.push(startDate);
    }
    if (endDate) {
        conditions.push('v.NgayDat <= ?');
        queryParams.push(endDate);
        countQueryParams.push(endDate);
    }
    if (maSuatChieu) {
        conditions.push('EXISTS (SELECT 1 FROM ChiTietVe sub_ctv WHERE sub_ctv.MaVe = v.MaVe AND sub_ctv.MaSuatChieu = ?)');
        queryParams.push(maSuatChieu);
        countQueryParams.push(maSuatChieu);
    }
    if (status !== undefined) {
        const statusBool = status === 'true';
        conditions.push('EXISTS (SELECT 1 FROM ChiTietVe sub_ctv WHERE sub_ctv.MaVe = v.MaVe AND sub_ctv.TrangThai = ?)');
        queryParams.push(statusBool);
        countQueryParams.push(statusBool);
    }

    if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    baseQuery += ' GROUP BY v.MaVe, v.MaNguoiDung, v.TongTien, v.NgayDat, nd.TenNguoiDung, nd.Email';

    const validSortColumns = {
        'MaVe': 'v.MaVe',
        'MaNguoiDung': 'v.MaNguoiDung',
        'TongTien': 'v.TongTien',
        'NgayDat': 'v.NgayDat',
        'TenNguoiDung': 'nd.TenNguoiDung',
        'Email': 'nd.Email'
    };
    const finalSortBy = validSortColumns[sortBy] || 'v.NgayDat';
    const finalOrder = (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC') ? order.toUpperCase() : 'DESC';

    baseQuery += ` ORDER BY ${finalSortBy} ${finalOrder}`;
    baseQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(parsedLimit, offset);

    pool.query(countQuery, countQueryParams, (err, totalRowsResult) => {
        if (err) {
            console.error('Lỗi khi đếm tổng số vé:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy tất cả vé.' });
        }

        const totalTickets = totalRowsResult[0].total;
        const totalPages = Math.ceil(totalTickets / parsedLimit);

        pool.query(baseQuery, queryParams, (err, tickets) => {
            if (err) {
                console.error('Lỗi khi lấy tất cả vé:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy tất cả vé.' });
            }

            const formattedTickets = tickets.map(ticket => {
                const chiTietVe = [];
                if (ticket.ChiTietVeFormatted) {
                    const details = ticket.ChiTietVeFormatted.split(';');
                    details.forEach(detail => {
                        const parts = detail.split(':');
                        if (parts.length === 5) {
                            chiTietVe.push({
                                MaChiTietVe: parts[0],
                                TrangThai: parts[1] === 'true',
                                SoGhe: parts[2],
                                ThoiGianBatDauSuatChieu: parts[3],
                                MaPhimSuatChieu: parts[4]
                            });
                        }
                    });
                }
                const { ChiTietVeFormatted, ...rest } = ticket;
                return { ...rest, ChiTietVe: chiTietVe };
            });

            res.status(200).json({
                totalItems: totalTickets,
                totalPages: totalPages,
                currentPage: parsedPage,
                itemsPerPage: parsedLimit,
                tickets: formattedTickets
            });
        });
    });
}];

// @route   GET /api/admin/ve/:MaVe
// @desc    Lấy chi tiết vé bất kỳ (cho Admin)
// @access  Private (Admin)
exports.getTicketDetailsAdmin = [verifyToken, requireRole("staff","admin"),  (req, res) => {
    const { MaVe } = req.params;

    pool.query(
        `SELECT v.*, nd.TenNguoiDung, nd.Email
         FROM Ve v
         JOIN NguoiDung nd ON v.MaNguoiDung = nd.MaNguoiDung
         WHERE MaVe = ?`,
        [MaVe],
        (err, veRows) => {
            if (err) {
                console.error('Lỗi khi lấy thông tin vé:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết vé.' });
            }
            if (veRows.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy vé với mã này.' });
            }
            const ve = veRows[0];

            pool.query(
                `SELECT ctv.MaChiTietVe, ctv.MaSuatChieu, ctv.MaGhe, ctv.TrangThai AS TrangThaiChiTietVe,
                        sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.MaPhim, sc.MaPhong,
                        g.SoGhe, g.LoaiGhe
                 FROM ChiTietVe ctv
                 JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
                 JOIN Ghe g ON ctv.MaGhe = g.MaGhe
                 WHERE ctv.MaVe = ?`,
                [MaVe],
                (err, chiTietVeRows) => {
                    if (err) {
                        console.error('Lỗi khi lấy chi tiết vé:', err);
                        return res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết vé.' });
                    }
                    ve.chiTiet = chiTietVeRows;
                    res.status(200).json(ve);
                }
            );
        }
    );
}];

// @route   PUT /api/admin/ve/chi-tiet/:MaChiTietVe/trang-thai
// @desc    Cập nhật trạng thái của một chi tiết vé cụ thể (cho Admin)
// @access  Private (Admin)
exports.updateTicketDetailStatusAdmin = [verifyToken, requireRole("staff","admin"),  (req, res) => {
    const { MaChiTietVe } = req.params;
    const { TrangThai } = req.body;

    if (typeof TrangThai !== 'boolean') {
        return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái hợp lệ (true/false).' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
            }

            connection.query('SELECT MaChiTietVe FROM ChiTietVe WHERE MaChiTietVe = ?', [MaChiTietVe], (err, existingDetail) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    console.error('Lỗi khi kiểm tra chi tiết vé:', err);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
                }
                if (existingDetail.length === 0) {
                    connection.rollback(() => connection.release());
                    return res.status(404).json({ message: 'Không tìm thấy chi tiết vé với mã này.' });
                }

                connection.query(
                    'UPDATE ChiTietVe SET TrangThai = ? WHERE MaChiTietVe = ?',
                    [TrangThai, MaChiTietVe],
                    (err, result) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi cập nhật trạng thái chi tiết vé:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
                        }
                        if (result.affectedRows === 0) {
                            connection.rollback(() => connection.release());
                            return res.status(400).json({ message: 'Trạng thái chi tiết vé không thay đổi. Có thể đã ở trạng thái yêu cầu.' });
                        }

                        connection.query('SELECT MaVe FROM ChiTietVe WHERE MaChiTietVe = ?', [MaChiTietVe], (err, ticketDetail) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error('Lỗi khi lấy mã vé:', err);
                                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
                            }
                            if (ticketDetail.length === 0) {
                                connection.rollback(() => connection.release());
                                return res.status(404).json({ message: 'Không tìm thấy vé liên quan đến chi tiết vé.' });
                            }

                            const currentMaVe = ticketDetail[0].MaVe;
                            connection.query(
                                `SELECT ctv.MaGhe, g.LoaiGhe
                                 FROM ChiTietVe ctv
                                 JOIN Ghe g ON ctv.MaGhe = g.MaGhe
                                 WHERE ctv.MaVe = ? AND ctv.TrangThai = TRUE`,
                                [currentMaVe],
                                (err, activeDetails) => {
                                    if (err) {
                                        connection.rollback(() => connection.release());
                                        console.error('Lỗi khi lấy chi tiết vé hoạt động:', err);
                                        return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
                                    }

                                    let newTongTien = 0;
                                    activeDetails.forEach(detail => {
                                        newTongTien += seatPrices[detail.LoaiGhe] || 0;
                                    });

                                    connection.query(
                                        'UPDATE Ve SET TongTien = ? WHERE MaVe = ?',
                                        [newTongTien, currentMaVe],
                                        (err) => {
                                            if (err) {
                                                connection.rollback(() => connection.release());
                                                console.error('Lỗi khi cập nhật tổng tiền vé:', err);
                                                return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
                                            }

                                            connection.commit((err) => {
                                                if (err) {
                                                    connection.rollback(() => connection.release());
                                                    console.error('Lỗi khi commit transaction:', err);
                                                    return res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
                                                }
                                                connection.release();
                                                res.status(200).json({ message: 'Trạng thái chi tiết vé đã được cập nhật thành công!' });
                                            });
                                        }
                                    );
                                }
                            );
                        });
                    }
                );
            });
        });
    });
}];

// @route   PUT /api/admin/ve/:MaVe/huy-toan-bo
// @desc    Hủy toàn bộ vé và tất cả các chi tiết vé liên quan (soft delete - Admin)
// @access  Private (Admin)
exports.adminCancelTicket = [verifyToken, requireRole("staff","admin"),  (req, res) => {
    const { MaVe } = req.params;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Lỗi khi lấy kết nối:', err);
            return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                console.error('Lỗi khi bắt đầu transaction:', err);
                return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
            }

            connection.query('SELECT MaVe FROM Ve WHERE MaVe = ?', [MaVe], (err, veRows) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    console.error('Lỗi khi kiểm tra vé:', err);
                    return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                }
                if (veRows.length === 0) {
                    connection.rollback(() => connection.release());
                    return res.status(404).json({ message: 'Không tìm thấy vé với mã này.' });
                }

                connection.query(
                    'UPDATE ChiTietVe SET TrangThai = FALSE WHERE MaVe = ?',
                    [MaVe],
                    (err, updateResult) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            console.error('Lỗi khi cập nhật trạng thái chi tiết vé:', err);
                            return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                        }
                        if (updateResult.affectedRows === 0) {
                            connection.rollback(() => connection.release());
                            return res.status(400).json({ message: 'Không có chi tiết vé nào được cập nhật. Vé có thể đã được hủy hoặc không có ghế nào.' });
                        }

                        connection.query('UPDATE Ve SET TongTien = 0 WHERE MaVe = ?', [MaVe], (err) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error('Lỗi khi cập nhật tổng tiền vé:', err);
                                return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                            }

                            connection.commit((err) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    console.error('Lỗi khi commit transaction:', err);
                                    return res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
                                }
                                connection.release();
                                res.status(200).json({ message: 'Vé và các chi tiết vé đã được hủy thành công (cập nhật trạng thái)!' });
                            });
                        });
                    }
                );
            });
        });
    });
}];