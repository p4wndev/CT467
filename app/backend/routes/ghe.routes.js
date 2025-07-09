const express = require("express");
const router = express.Router();
const gheController = require("../controllers/ghe.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Lấy tất cả ghế 
router.get('/', gheController.getAllGhe);

// Lấy chi tiết ghế theo MaGhe
router.get('/:MaGhe', gheController.getGheById);

// Tạo ghế mới 
router.post('/', verifyToken, requireRole("staff","admin"),gheController.createGhe);

// Cập nhật thông tin ghế 
router.put('/:MaGhe', verifyToken, requireRole("admin"),gheController.updateGhe);

// Xóa ghế 
router.delete('/:MaGhe', verifyToken, requireRole("admin"), gheController.deleteGhe);

module.exports = router;
