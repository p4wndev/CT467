const express = require("express");
const router = express.Router();
const veController = require("../controllers/ve.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// --- Routes cho Vé (User-facing) ---
// Đặt vé mới
router.post('/dat-ve', veController.createTicket);

// Lấy lịch sử vé của người dùng hiện tại
router.get('/lich-su', veController.getUserTickets); 

// Lấy chi tiết vé của người dùng 
router.get('/:MaVe', veController.getTicketDetails); 

// Hủy vé (người dùng)
router.put('/:MaVe/huy', veController.cancelTicket); 


// --- Routes cho Vé (Admin-facing) ---
// Lấy tất cả vé
router.get('/',verifyToken, requireRole("staff","admin"), veController.getAllTicketsAdmin); 

// Lấy chi tiết vé bất kỳ
router.get('/:MaVe', verifyToken, requireRole("staff","admin"),veController.getTicketDetailsAdmin); 

// Cập nhật trạng thái của một chi tiết vé cụ thể (Admin)
router.put('/chi-tiet/:MaChiTietVe/trang-thai', verifyToken, requireRole("staff","admin"),veController.updateTicketDetailStatusAdmin); 

// Hủy toàn bộ vé và các chi tiết vé liên quan (soft delete - Admin)
router.put('/:MaVe/huy-toan-bo', verifyToken, requireRole("staff","admin"),veController.adminCancelTicket); 

module.exports = router;