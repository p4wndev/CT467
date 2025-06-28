const express = require("express");
const router = express.Router();
const hoaDonController = require("../controllers/hoadon.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Lấy tất cả hóa đơn (chỉ admin)
router.get("/", verifyToken, requireRole("admin"), hoaDonController.getAllHoaDon);

// Lấy hóa đơn theo MaHoaDon (admin hoặc người dùng của hóa đơn)
router.get("/:MaHoaDon", verifyToken, hoaDonController.getHoaDonById);

// Tạo hóa đơn mới (chỉ admin)
router.post("/", verifyToken, requireRole("admin"), hoaDonController.createHoaDon);

// Cập nhật hóa đơn (chỉ admin)
router.put("/:MaHoaDon", verifyToken, requireRole("admin"), hoaDonController.updateHoaDon);

// Xóa hóa đơn (chỉ admin)
router.delete("/:MaHoaDon", verifyToken, requireRole("admin"), hoaDonController.deleteHoaDon);

module.exports = router;
