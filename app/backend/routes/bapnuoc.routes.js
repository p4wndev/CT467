const express = require("express");
const router = express.Router();
const controller = require("../controllers/bapnuoc.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, controller.getAll);
router.post("/", verifyToken, requireRole("admin"), controller.create);
router.put("/:id", verifyToken, requireRole("admin"), controller.update);
router.delete("/:id", verifyToken, requireRole("admin"), controller.remove);

module.exports = router;
