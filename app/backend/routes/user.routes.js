const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Chỉ admin mới lấy danh sách người dùng
router.get("/", verifyToken, requireRole("admin"), userController.getAllUsers);

// Lấy thông tin 1 người dùng (admin hoặc chính họ)
router.get("/:id", verifyToken, userController.getUserById);

// Cập nhật thông tin (admin hoặc chính họ)
router.put("/:id", verifyToken, userController.updateUser);

// Xóa người dùng (chỉ admin)
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  userController.deleteUser
);
// Chỉ admin được nâng quyền
router.patch(
  "/:id/role",
  verifyToken,
  requireRole("admin"),
  userController.upgradeUserToStaff
);
module.exports = router;