const express = require("express");
const router = express.Router();
const suatChieuController = require("../controllers/suatChieu.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.post('/taoSuatChieu',verifyToken, requireRole("staff","admin"), suatChieuController.createSuatChieu); // Yêu cầu Admin
router.get('/danhSach', suatChieuController.getAllSuatChieu); // Có thể Public
router.get('/:MaSuatChieu', suatChieuController.getSuatChieuById); // Có thể Public
router.put('/:MaSuatChieu',verifyToken, requireRole("staff","admin"), suatChieuController.updateSuatChieu); // Yêu cầu Admin
router.delete('/:MaSuatChieu', verifyToken, requireRole("staff","admin"),suatChieuController.deleteSuatChieu); // Yêu cầu Admin

module.exports = router;