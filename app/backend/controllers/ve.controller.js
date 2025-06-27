const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const crypto = require('crypto'); 

// Giá vé cơ bản theo loại ghế (có thể lấy từ DB hoặc cấu hình)
const seatPrices = {
    'Standard': 100000, // 100,000 VND
    'VIP': 150000,    // 150,000 VND
    'Couple': 250000  // Ví dụ ghế đôi
};

const CANCELLATION_BUFFER_MINUTES = 15; // Thời gian tối thiểu trước suất chiếu để được phép hủy (phút)

// --- Chức năng cho NGƯỜI DÙNG ---

// @route   POST /api/ve/dat-ve
// @desc    Đặt vé mới
// @access  Private (Người dùng đã xác thực)
exports.createTicket = [verifyToken, async (req, res) => {
    // Lấy MaNguoiDung từ token đã giải mã
    const MaNguoiDung = req.user.MaNguoiDung;
    const { MaSuatChieu, selectedSeats } = req.body; // selectedSeats là một mảng các MaGhe

    if (!MaSuatChieu || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ MaSuatChieu và selectedSeats (mảng các MaGhe).' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Bắt đầu giao dịch

        // 1. Kiểm tra sự tồn tại của SuatChieu và Ghế
        const [showtimeRows] = await connection.query('SELECT * FROM SuatChieu WHERE MaSuatChieu = ?', [MaSuatChieu]);
        if (showtimeRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Mã suất chiếu không tồn tại.' });
        }

        // Lấy thời gian bắt đầu của suất chiếu
        const ThoiGianBatDauSuatChieu = new Date(showtimeRows[0].ThoiGianBatDau);
        const now = new Date();

        // Không cho phép đặt vé nếu suất chiếu đã bắt đầu hoặc quá gần giờ chiếu
        if (now.getTime() >= ThoiGianBatDauSuatChieu.getTime() - (CANCELLATION_BUFFER_MINUTES * 60 * 1000)) {
            await connection.rollback();
            return res.status(400).json({ message: 'Không thể đặt vé cho suất chiếu đã bắt đầu hoặc quá gần giờ chiếu.' });
        }

        let TongTien = 0;
        const ticketDetailsToInsert = [];

        for (const MaGhe of selectedSeats) {
            // Kiểm tra ghế có tồn tại không
            const [seatRows] = await connection.query('SELECT LoaiGhe FROM Ghe WHERE MaGhe = ?', [MaGhe]);
            if (seatRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: `Ghế với mã ${MaGhe} không tồn tại.` });
            }
            const LoaiGhe = seatRows[0].LoaiGhe;

            // Kiểm tra ghế đã được đặt cho suất chiếu này chưa và còn đang hoạt động
            const [bookedSeatRows] = await connection.query(
                'SELECT MaChiTietVe FROM ChiTietVe WHERE MaSuatChieu = ? AND MaGhe = ? AND TrangThai = TRUE',
                [MaSuatChieu, MaGhe]
            );
            if (bookedSeatRows.length > 0) {
                await connection.rollback();
                return res.status(409).json({ message: `Ghế ${MaGhe} đã được đặt cho suất chiếu này.` });
            }

            // Tính tổng tiền dựa trên loại ghế
            const price = seatPrices[LoaiGhe] || 0; // Nếu loại ghế không có giá, mặc định là 0
            if (price === 0) {
                 await connection.rollback();
                 return res.status(400).json({ message: `Loại ghế ${LoaiGhe} không có giá được định nghĩa.` });
            }
            TongTien += price;

            ticketDetailsToInsert.push({ MaGhe, LoaiGhe });
        }

        const generateShortId = (length = 8) => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        };

        // 2. Tạo bản ghi trong bảng Ve
        const MaVe = 'V' + generateShortId(6); // Tạo ID vé duy nhất
        const NgayDat = new Date().toISOString().slice(0, 10); // Lấy ngày hiện tại YYYY-MM-DD

        await connection.query(
            'INSERT INTO Ve (MaVe, MaNguoiDung, TongTien, NgayDat) VALUES (?, ?, ?, ?)',
            [MaVe, MaNguoiDung, TongTien, NgayDat]
        );

        // 3. Tạo bản ghi trong bảng ChiTietVe cho từng ghế
        for (const detail of ticketDetailsToInsert) {
            const MaChiTietVe = 'CTV' + generateShortId(6); // Tạo ID chi tiết vé duy nhất
            await connection.query(
                'INSERT INTO ChiTietVe (MaChiTietVe, MaVe, MaSuatChieu, MaGhe, TrangThai) VALUES (?, ?, ?, ?, ?)',
                [MaChiTietVe, MaVe, MaSuatChieu, detail.MaGhe, true] // TrangThai = TRUE (đã đặt)
            );
        }

        await connection.commit(); // Hoàn tất giao dịch
        res.status(201).json({ message: 'Vé đã được đặt thành công!', MaVe: MaVe, TongTien: TongTien });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Hoàn tác giao dịch nếu có lỗi
        }
        console.error('Lỗi khi đặt vé:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi đặt vé.' });
    } finally {
        if (connection) {
            connection.release(); // Giải phóng kết nối
        }
    }
}];

// @route   GET /api/ve/lich-su
// @desc    Lấy lịch sử vé của người dùng hiện tại
// @access  Private (Người dùng đã xác thực)
exports.getUserTickets = [verifyToken, async (req, res) => {
    const MaNguoiDung = req.user.MaNguoiDung; // Lấy MaNguoiDung từ token

    try {
        const [tickets] = await pool.query(
            `SELECT v.*, COUNT(ctv.MaChiTietVe) AS SoLuongGhe, GROUP_CONCAT(g.SoGhe) AS CacSoGhe, GROUP_CONCAT(sc.ThoiGianChieu) AS ThoiGianChieu
             FROM Ve v
             LEFT JOIN ChiTietVe ctv ON v.MaVe = ctv.MaVe
             LEFT JOIN Ghe g ON ctv.MaGhe = g.MaGhe
             LEFT JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
             WHERE v.MaNguoiDung = ?
             GROUP BY v.MaVe
             ORDER BY v.NgayDat DESC`,
            [MaNguoiDung]
        );
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử vé người dùng:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy lịch sử vé.' });
    }
}];

// @route   GET /api/ve/:MaVe
// @desc    Lấy chi tiết vé của người dùng (đảm bảo thuộc về họ)
// @access  Private (Người dùng đã xác thực)
exports.getTicketDetails = [verifyToken, async (req, res) => {
    const { MaVe } = req.params;
    const MaNguoiDung = req.user.MaNguoiDung; // Lấy MaNguoiDung từ token

    try {
        // Lấy thông tin vé và đảm bảo nó thuộc về người dùng đang đăng nhập
        const [veRows] = await pool.query('SELECT * FROM Ve WHERE MaVe = ? AND MaNguoiDung = ?', [MaVe, MaNguoiDung]);
        if (veRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy vé hoặc bạn không có quyền truy cập vé này.' });
        }
        const ve = veRows[0];

        // Lấy chi tiết các ghế trong vé đó
        const [chiTietVeRows] = await pool.query(
            `SELECT ctv.MaChiTietVe, ctv.MaSuatChieu, ctv.MaGhe, ctv.TrangThai AS TrangThaiChiTietVe,
                    sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.MaPhim, sc.MaPhong,
                    g.SoGhe, g.LoaiGhe
             FROM ChiTietVe ctv
             JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
             JOIN Ghe g ON ctv.MaGhe = g.MaGhe
             WHERE ctv.MaVe = ?`,
            [MaVe]
        );

        // Ghép thông tin chi tiết vào đối tượng vé chính
        ve.chiTiet = chiTietVeRows;

        res.status(200).json(ve);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết vé người dùng:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết vé.' });
    }
}];

// @route   PUT /api/ve/:MaVe/huy
// @desc    Hủy vé (cập nhật trạng thái trong ChiTietVe thành FALSE) - User
// @access  Private (Người dùng đã xác thực)
exports.cancelTicket = [verifyToken, async (req, res) => {
    const { MaVe } = req.params;
    const MaNguoiDung = req.user.MaNguoiDung; // Lấy MaNguoiDung từ token

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Kiểm tra vé có tồn tại và thuộc về người dùng này không
        const [veRows] = await connection.query('SELECT MaVe FROM Ve WHERE MaVe = ? AND MaNguoiDung = ?', [MaVe, MaNguoiDung]);
        if (veRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy vé hoặc bạn không có quyền hủy vé này.' });
        }

        // 2. Lấy thông tin suất chiếu liên quan đến các chi tiết vé này
        const [chiTietVeRows] = await connection.query(
            `SELECT ctv.MaChiTietVe, ctv.MaSuatChieu, sc.ThoiGianBatDau, ctv.TrangThai
             FROM ChiTietVe ctv
             JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
             WHERE ctv.MaVe = ? AND ctv.TrangThai = TRUE`, // Chỉ lấy các chi tiết vé đang hoạt động
            [MaVe]
        );

        if (chiTietVeRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Vé đã được hủy hoặc không có ghế nào đang hoạt động để hủy.' });
        }

        // 3. Kiểm tra điều kiện thời gian hủy (tất cả các chi tiết vé phải thỏa mãn)
        const now = new Date();
        for (const detail of chiTietVeRows) {
            const showtimeStart = new Date(detail.ThoiGianBatDau);
            // Vé không được hủy nếu thời gian hiện tại đã vượt quá giờ chiếu trừ đi thời gian buffer
            if (now.getTime() >= showtimeStart.getTime() - (CANCELLATION_BUFFER_MINUTES * 60 * 1000)) {
                await connection.rollback();
                return res.status(400).json({ message: `Không thể hủy vé vì suất chiếu ${detail.MaSuatChieu} đã quá thời hạn hủy (phải hủy trước ${CANCELLATION_BUFFER_MINUTES} phút).` });
            }
        }

        // 4. Cập nhật trạng thái các chi tiết vé thành FALSE (đã hủy)
        const [updateResult] = await connection.query(
            'UPDATE ChiTietVe SET TrangThai = FALSE WHERE MaVe = ? AND TrangThai = TRUE',
            [MaVe]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Không có chi tiết vé nào được cập nhật. Có thể đã bị hủy trước đó.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Vé đã được hủy thành công!' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Lỗi khi hủy vé:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}];


// --- Chức năng cho ADMIN ---

// @route   GET /api/admin/ve
// @desc    Lấy tất cả vé (cho Admin)
// @access  Private (Admin)
exports.getAllTicketsAdmin = [verifyToken, requireRole('admin'), async (req, res) => {
    try {
        // Lấy các tham số từ query string
        // Ví dụ: /api/admin/ve?status=true&userId=MaND001&limit=10&page=1&sortBy=NgayDat&order=DESC&minTotal=50000&maxTotal=200000&startDate=2025-01-01&endDate=2025-01-31&maSuatChieu=SC_abc
        const {
            status,        // Lọc theo trạng thái chi tiết vé (true/false)
            userId,        // Lọc theo MaNguoiDung của vé
            minTotal,      // Lọc theo TongTien tối thiểu của vé
            maxTotal,      // Lọc theo TongTien tối đa của vé
            startDate,     // Lọc theo NgayDat của vé (từ ngày này)
            endDate,       // Lọc theo NgayDat của vé (đến ngày này)
            maSuatChieu,   // Lọc theo MaSuatChieu (vé phải có ít nhất 1 chi tiết cho suất chiếu này)
            sortBy = 'v.NgayDat', // Cột sắp xếp mặc định
            order = 'DESC',       // Thứ tự sắp xếp mặc định
            page = 1,             // Trang hiện tại mặc định
            limit = 10            // Số bản ghi mỗi trang mặc định
        } = req.query;

        // Chuyển đổi page và limit sang số nguyên
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);

        // Kiểm tra hợp lệ cho page và limit
        if (isNaN(parsedPage) || parsedPage <= 0) {
            return res.status(400).json({ message: 'Số trang (page) không hợp lệ.' });
        }
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({ message: 'Giới hạn bản ghi (limit) không hợp lệ.' });
        }

        const offset = (parsedPage - 1) * parsedLimit;

        // Xây dựng câu truy vấn động
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
        const countQueryParams = []; // Mảng tham số riêng cho count query
        const conditions = [];

        // --- Lọc (Filtering) ---
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
        if (startDate) { // Lọc từ ngày này trở đi (theo NgayDat của vé)
            conditions.push('v.NgayDat >= ?');
            queryParams.push(startDate);
            countQueryParams.push(startDate);
        }
        if (endDate) { // Lọc đến ngày này trở về trước (theo NgayDat của vé)
            conditions.push('v.NgayDat <= ?');
            queryParams.push(endDate);
            countQueryParams.push(endDate);
        }

        // Lọc theo MaSuatChieu: vé phải chứa ít nhất một chi tiết vé của suất chiếu này
        if (maSuatChieu) {
            conditions.push('EXISTS (SELECT 1 FROM ChiTietVe sub_ctv WHERE sub_ctv.MaVe = v.MaVe AND sub_ctv.MaSuatChieu = ?)');
            queryParams.push(maSuatChieu);
            countQueryParams.push(maSuatChieu);
        }

        // Lọc theo trạng thái chi tiết vé: vé phải chứa ít nhất một chi tiết vé có trạng thái đó
        if (status !== undefined) {
            const statusBool = status === 'true'; // Chuyển đổi 'true'/'false' từ query string thành boolean
            conditions.push('EXISTS (SELECT 1 FROM ChiTietVe sub_ctv WHERE sub_ctv.MaVe = v.MaVe AND sub_ctv.TrangThai = ?)');
            queryParams.push(statusBool);
            countQueryParams.push(statusBool);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            baseQuery += whereClause;
            countQuery += whereClause;
        }

        // Luôn GROUP BY để kết hợp các chi tiết vé vào một dòng vé chính
        baseQuery += ' GROUP BY v.MaVe, v.MaNguoiDung, v.TongTien, v.NgayDat, nd.TenNguoiDung, nd.Email';

        // --- Sắp xếp (Sorting) ---
        // Đảm bảo chỉ sắp xếp theo các cột hợp lệ để tránh SQL Injection
        const validSortColumns = {
            'MaVe': 'v.MaVe',
            'MaNguoiDung': 'v.MaNguoiDung',
            'TongTien': 'v.TongTien',
            'NgayDat': 'v.NgayDat',
            'TenNguoiDung': 'nd.TenNguoiDung',
            'Email': 'nd.Email'
            // Thêm các cột khác nếu muốn sắp xếp
        };
        const finalSortBy = validSortColumns[sortBy] || 'v.NgayDat'; // Mặc định là NgayDat nếu không hợp lệ
        const finalOrder = (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC') ? order.toUpperCase() : 'DESC';
        
        baseQuery += ` ORDER BY ${finalSortBy} ${finalOrder}`;

        // --- Phân trang (Pagination) ---
        baseQuery += ` LIMIT ? OFFSET ?`;
        queryParams.push(parsedLimit, offset);

        // Thực thi truy vấn đếm tổng số bản ghi
        const [totalRowsResult] = await pool.query(countQuery, countQueryParams);
        const totalTickets = totalRowsResult[0].total;
        const totalPages = Math.ceil(totalTickets / parsedLimit);

        // Thực thi truy vấn lấy dữ liệu chính
        const [tickets] = await pool.query(baseQuery, queryParams);

        // Xử lý dữ liệu ChiTietVeFormatted để dễ sử dụng hơn
        const formattedTickets = tickets.map(ticket => {
            const chiTietVe = [];
            if (ticket.ChiTietVeFormatted) {
                // Tách từng chi tiết vé
                const details = ticket.ChiTietVeFormatted.split(';');
                details.forEach(detail => {
                    const parts = detail.split(':');
                    if (parts.length === 5) {
                        chiTietVe.push({
                            MaChiTietVe: parts[0],
                            TrangThai: parts[1] === 'true', // Chuyển lại về boolean
                            SoGhe: parts[2],
                            ThoiGianBatDauSuatChieu: parts[3],
                            MaPhimSuatChieu: parts[4]
                        });
                    }
                });
            }
            // Loại bỏ trường ChiTietVeFormatted gốc và thêm mảng đã xử lý
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

    } catch (error) {
        console.error('Lỗi khi lấy tất cả vé (Admin) với tùy chọn:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy tất cả vé.' });
    }
}];

// @route   GET /api/admin/ve/:MaVe
// @desc    Lấy chi tiết vé bất kỳ (cho Admin)
// @access  Private (Admin)
exports.getTicketDetailsAdmin = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaVe } = req.params;

    try {
        const [veRows] = await pool.query(
            `SELECT v.*, nd.TenNguoiDung, nd.Email
             FROM Ve v
             JOIN NguoiDung nd ON v.MaNguoiDung = nd.MaNguoiDung
             WHERE MaVe = ?`,
            [MaVe]
        );
        if (veRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy vé với mã này.' });
        }
        const ve = veRows[0];

        // Lấy chi tiết các ghế trong vé đó, bao gồm trạng thái của từng chi tiết
        const [chiTietVeRows] = await pool.query(
            `SELECT ctv.MaChiTietVe, ctv.MaSuatChieu, ctv.MaGhe, ctv.TrangThai AS TrangThaiChiTietVe,
                    sc.ThoiGianBatDau, sc.ThoiGianKetThuc, sc.MaPhim, sc.MaPhong,
                    g.SoGhe, g.LoaiGhe
             FROM ChiTietVe ctv
             JOIN SuatChieu sc ON ctv.MaSuatChieu = sc.MaSuatChieu
             JOIN Ghe g ON ctv.MaGhe = g.MaGhe
             WHERE ctv.MaVe = ?`,
            [MaVe]
        );

        ve.chiTiet = chiTietVeRows;

        res.status(200).json(ve);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết vé (Admin):', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi lấy chi tiết vé.' });
    }
}];


// @route   PUT /api/admin/ve/chi-tiet/:MaChiTietVe/trang-thai
// @desc    Cập nhật trạng thái của một chi tiết vé cụ thể (cho Admin)
//          VD: đánh dấu là đã sử dụng, đã hoàn tiền, hoặc hủy một ghế riêng lẻ
// @access  Private (Admin)
exports.updateTicketDetailStatusAdmin = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaChiTietVe } = req.params; // Lấy MaChiTietVe từ URL params
    const { TrangThai } = req.body; // true/false

    if (typeof TrangThai !== 'boolean') { // Kiểm tra kiểu dữ liệu của TrangThai
        return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái hợp lệ (true/false).' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Kiểm tra xem chi tiết vé có tồn tại không
        const [existingDetail] = await connection.query('SELECT MaChiTietVe FROM ChiTietVe WHERE MaChiTietVe = ?', [MaChiTietVe]);
        if (existingDetail.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy chi tiết vé với mã này.' });
        }

        const [result] = await connection.query(
            'UPDATE ChiTietVe SET TrangThai = ? WHERE MaChiTietVe = ?',
            [TrangThai, MaChiTietVe]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Trạng thái chi tiết vé không thay đổi. Có thể đã ở trạng thái yêu cầu.' });
        }

        // Tùy chọn: Cập nhật lại TongTien trong bảng Ve nếu TrangThai thay đổi thành FALSE
        // Lấy MaVe từ MaChiTietVe
        const [ticketDetail] = await connection.query('SELECT MaVe FROM ChiTietVe WHERE MaChiTietVe = ?', [MaChiTietVe]);
        if (ticketDetail.length > 0) {
            const currentMaVe = ticketDetail[0].MaVe;
            // Tính lại tổng tiền của vé dựa trên các chi tiết vé còn active
            const [activeDetails] = await connection.query(
                `SELECT ctv.MaGhe, g.LoaiGhe
                 FROM ChiTietVe ctv
                 JOIN Ghe g ON ctv.MaGhe = g.MaGhe
                 WHERE ctv.MaVe = ? AND ctv.TrangThai = TRUE`,
                [currentMaVe]
            );
            let newTongTien = 0;
            activeDetails.forEach(detail => {
                newTongTien += seatPrices[detail.LoaiGhe] || 0;
            });
            await connection.query('UPDATE Ve SET TongTien = ? WHERE MaVe = ?', [newTongTien, currentMaVe]);
        }


        await connection.commit();
        res.status(200).json({ message: 'Trạng thái chi tiết vé đã được cập nhật thành công!' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Lỗi khi cập nhật trạng thái chi tiết vé (Admin):', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi cập nhật trạng thái chi tiết vé.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}];

// @route   PUT /api/admin/ve/:MaVe/huy-toan-bo
// @desc    Hủy toàn bộ vé và tất cả các chi tiết vé liên quan (soft delete - Admin)
// @access  Private (Admin)
exports.adminCancelTicket = [verifyToken, requireRole('admin'), async (req, res) => {
    const { MaVe } = req.params;

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Bắt đầu giao dịch

        // 1. Kiểm tra vé chính có tồn tại không
        const [veRows] = await connection.query('SELECT MaVe FROM Ve WHERE MaVe = ?', [MaVe]);
        if (veRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Không tìm thấy vé với mã này.' });
        }

        // 2. Cập nhật trạng thái của TẤT CẢ các chi tiết vé liên quan thành FALSE (đã hủy)
        const [updateResult] = await connection.query(
            'UPDATE ChiTietVe SET TrangThai = FALSE WHERE MaVe = ?',
            [MaVe]
        );

        if (updateResult.affectedRows === 0) {
            // Có thể vé không có chi tiết hoặc đã bị hủy hết
            await connection.rollback();
            return res.status(400).json({ message: 'Không có chi tiết vé nào được cập nhật. Vé có thể đã được hủy hoặc không có ghế nào.' });
        }

        // 3. Cập nhật Tổng tiền của vé về 0 (nếu tất cả chi tiết vé đã được hủy)
        await connection.query('UPDATE Ve SET TongTien = 0 WHERE MaVe = ?', [MaVe]);

        await connection.commit(); // Hoàn tất giao dịch
        res.status(200).json({ message: 'Vé và các chi tiết vé đã được hủy thành công (cập nhật trạng thái)!' });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Hoàn tác giao dịch nếu có lỗi
        }
        console.error('Lỗi khi hủy vé (Admin):', error);
        res.status(500).json({ message: 'Lỗi server nội bộ khi hủy vé.' });
    } finally {
        if (connection) {
            connection.release(); // Giải phóng kết nối
        }
    }
}];
