const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movie.controller");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

// Ai có token cũng xem được phim
router.get("/", verifyToken, movieController.getAllMovies);
router.get("/:id", verifyToken, movieController.getMovieById);

// Chỉ admin mới thêm/sửa/xoá
router.post("/", verifyToken, requireRole("admin"), movieController.addMovie);
router.put(
  "/:id",
  verifyToken,
  requireRole("admin"),
  movieController.updateMovie
);
router.delete(
  "/:id",
  verifyToken,
  requireRole("admin"),
  movieController.deleteMovie
);

module.exports = router;
