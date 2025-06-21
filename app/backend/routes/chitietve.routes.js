const express = require("express");
const router = express.Router();
const chitietveController = require("../controllers/chitietve.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Lấy tất cả chi tiết vé (chỉ admin)
router.get("/", verifyToken, requireRole("admin"), chitietveController.getAllChiTietVe);

// Lấy chi tiết vé theo MaChiTietVe (admin hoặc người dùng liên quan)
router.get("/:MaChiTietVe", verifyToken, chitietveController.getChiTietVeById);

// Tạo chi tiết vé mới (chỉ admin)
router.post("/", verifyToken, requireRole("admin"), chitietveController.createChiTietVe);

// Cập nhật chi tiết vé (chỉ admin)
router.put("/:MaChiTietVe", verifyToken, requireRole("admin"), chitietveController.updateChiTietVe);

// Xóa chi tiết vé (chỉ admin)
router.delete("/:MaChiTietVe", verifyToken, requireRole("admin"), chitietveController.deleteChiTietVe);

module.exports = router;