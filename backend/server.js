const express = require("express");
const cors = require("cors");
const db = require("./db");
const { requireAuth, requireRole } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const invoiceRoutes = require("./routes/invoices");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", requireAuth, orderRoutes);
app.use("/api", requireAuth, invoiceRoutes);
app.use("/api", reportRoutes);

/* =========================
   GET - Kiểm tra server
========================= */
app.get("/", (req, res) => {
  res.json({
    message: "Backend quản lý quán cà phê đang chạy!",
  });
});

/* =========================
   GET - Lấy tất cả món
========================= */
app.get("/api/products", requireAuth, (req, res) => {
  const sql = "SELECT * FROM products ORDER BY id";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Lỗi lấy danh sách món",
      });
    }

    res.json(results);
  });
});

/* =========================
   POST - Thêm món
========================= */
app.post("/api/products", requireAuth, requireRole("admin"), (req, res) => {
  const { name, price } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({
      message: "Tên món và giá là bắt buộc",
    });
  }

  const sql = `
        INSERT INTO products (name, price)
        VALUES (?, ?)
    `;

  db.query(sql, [name, price], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Lỗi thêm món",
      });
    }

    res.status(201).json({
      message: "Thêm món thành công",
      id: result.insertId,
    });
  });
});

/* =========================
   PUT - Sửa món
========================= */
app.put("/api/products/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({
      message: "Tên món và giá là bắt buộc",
    });
  }

  const sql = `
        UPDATE products
        SET name = ?, price = ?
        WHERE id = ?
    `;

  db.query(sql, [name, price, id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Lỗi cập nhật món",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy món",
      });
    }

    res.json({
      message: "Cập nhật món thành công",
    });
  });
});

/* =========================
   GET - Lấy danh sách bàn
========================= */
app.get("/api/tables", requireAuth, (req, res) => {
  const sql = "SELECT * FROM cafe_tables ORDER BY id";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Lỗi lấy danh sách bàn",
      });
    }

    res.json(results);
  });
});

/* =========================
   PUT - Cập nhật trạng thái bàn
========================= */
app.put("/api/tables/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Trống", "Đang sử dụng"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Trạng thái bàn không hợp lệ",
    });
  }

  const sql = `
        UPDATE cafe_tables
        SET status = ?
        WHERE id = ?
    `;

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Lỗi cập nhật trạng thái bàn",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bàn",
      });
    }

    res.json({
      message: "Cập nhật trạng thái bàn thành công",
    });
  });
});

/* =========================
   DELETE - Xóa món
========================= */
app.delete("/api/products/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM products WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Lỗi xóa món",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy món",
      });
    }

    res.json({
      message: "Xóa món thành công",
    });
  });
});

app.use("/api", userRoutes);

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
