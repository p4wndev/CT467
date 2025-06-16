const express = require("express");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes"); // ⬅️ Thêm dòng này
const gheRoutes = require("./routes/ghe.routes");
const suatChieuRoutes = require("./routes/suatChieu.routes");
const veRoutes = require("./routes/ve.routes");
const movieRoutes = require("./routes/movie.routes");
const bapNuocRoutes = require("./routes/bapnuoc.routes");
const phongChieuRoutes = require("./routes/phongchieu.routes");
const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes); // ⬅️ Đăng ký route người dùng
app.use("/ghe", gheRoutes);
app.use("/suatChieu", suatChieuRoutes);
app.use("/ve", veRoutes);
app.use("/movies", movieRoutes);
app.use("/bapnuoc", bapNuocRoutes);
app.use("/phongchieu", phongChieuRoutes);

// Xử lý lỗi 404 (Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route không tồn tại." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
