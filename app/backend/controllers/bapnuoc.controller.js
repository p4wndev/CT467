const pool = require("../config/db");

exports.getAll = (req, res) => {
  pool.query("SELECT * FROM BapNuoc", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { MaCombo, TenCombo, GiaCombo, MoTa } = req.body;

  pool.query(
    "INSERT INTO BapNuoc (MaCombo, TenCombo, GiaCombo, MoTa) VALUES (?, ?, ?, ?)",
    [MaCombo, TenCombo, GiaCombo, MoTa],
    (err) => {
      if (err) return res.status(500).json({ error: "Lỗi thêm combo" });
      res.json({ message: "Thêm combo thành công" });
    }
  );
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { TenCombo, GiaCombo, MoTa } = req.body;

  pool.query(
    "UPDATE BapNuoc SET TenCombo=?, GiaCombo=?, MoTa=? WHERE MaCombo=?",
    [TenCombo, GiaCombo, MoTa, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Lỗi cập nhật combo" });
      res.json({ message: "Cập nhật thành công" });
    }
  );
};

exports.remove = (req, res) => {
  pool.query("DELETE FROM BapNuoc WHERE MaCombo=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi xoá combo" });
    res.json({ message: "Xoá thành công" });
  });
};
