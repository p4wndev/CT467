const express = require("express");
const router = express.Router();
const chitiethoadonController = require("../controllers/chitiethoadon.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Lấy tất cả chi tiết hóa đơn (chỉ admin)
router.get("/", verifyToken, requireRole("admin"), chitiethoadonController.getAllChiTietHoaDon);

// Lấy chi tiết hóa đơn theo MaChiTietHoaDon (admin hoặc người dùng liên quan)
router.get("/:MaChiTietHoaDon", verifyToken, chitiethoadonController.getChiTietHoaDonById);

// Tạo chi tiết hóa đơn mới (chỉ admin)
router.post("/", verifyToken, requireRole("admin"), chitiethoadonController.createChiTietHoaDon);

// Cập nhật chi tiết hóa đơn (chỉ admin)
router.put("/:MaChiTietHoaDon", verifyToken, requireRole("admin"), chitiethoadonController.updateChiTietHoaDon);

// Xóa chi tiết hóa đơn (chỉ admin)
router.delete("/:MaChiTietHoaDon", verifyToken, requireRole("admin"), chitiethoadonController.deleteChiTietHoaDon);

module.exports = router;