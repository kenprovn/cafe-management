const express = require("express");
const cors = require("cors");
const db = require("./db");
const { requireAuth, requireRole } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const invoiceRoutes = require("./routes/invoices");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");
const {
  parseProductId,
  productNameKey,
  validateProductImageUrl,
  validateProductName,
  validateProductPrice,
} = require("./utils/productValidation");

const app = express();
const pool = db.promise();
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

function isAllowedDevelopmentOrigin(origin) {
  if (!origin) return true;

  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" || url.port !== "5173") return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;

    const octets = url.hostname.split(".").map(Number);
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      return false;
    }

    return octets[0] === 10
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168);
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedDevelopmentOrigin(origin));
  },
}));
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
app.get("/api/products", requireAuth, async (req, res) => {
  try {
    const [products] = await pool.execute("SELECT id, name, price, image_url FROM products ORDER BY id");
    return res.json(products);
  } catch (error) {
    console.error("Lỗi lấy danh sách món:", error.message);
    return res.status(500).json({ message: "Lỗi lấy danh sách món", code: "PRODUCT_LIST_ERROR" });
  }
});

/* =========================
   POST - Thêm món
========================= */
app.post("/api/products", requireAuth, requireRole("admin"), async (req, res) => {
  const name = validateProductName(req.body.name);
  const price = validateProductPrice(req.body.price);
  const imageUrl = validateProductImageUrl(req.body.image_url);
  const validationError = name.error || price.error || imageUrl.error;
  if (validationError) return res.status(400).json({ message: validationError, code: "VALIDATION_ERROR" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.execute("SELECT id, name FROM products FOR UPDATE");
    if (products.some((product) => productNameKey(product.name) === productNameKey(name.value))) {
      await connection.rollback();
      return res.status(409).json({ message: "Tên món đã tồn tại trong thực đơn", code: "PRODUCT_NAME_EXISTS" });
    }
    const [result] = await connection.execute(
      "INSERT INTO products (name, price, image_url) VALUES (?, ?, ?)",
      [name.value, price.value, imageUrl.value],
    );
    await connection.commit();
    return res.status(201).json({ message: "Thêm món thành công", id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi thêm món:", error.message);
    return res.status(500).json({ message: "Lỗi thêm món", code: "PRODUCT_CREATE_ERROR" });
  } finally {
    connection.release();
  }
});

/* =========================
   PUT - Sửa món
========================= */
app.put("/api/products/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseProductId(req.params.id);
  const name = validateProductName(req.body.name);
  const price = validateProductPrice(req.body.price);
  const imageUrl = validateProductImageUrl(req.body.image_url);
  const validationError = id.error || name.error || price.error || imageUrl.error;
  if (validationError) return res.status(400).json({ message: validationError, code: "VALIDATION_ERROR" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.execute("SELECT id, name FROM products FOR UPDATE");
    if (!products.some((product) => product.id === id.value)) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy món", code: "PRODUCT_NOT_FOUND" });
    }
    if (products.some((product) => product.id !== id.value && productNameKey(product.name) === productNameKey(name.value))) {
      await connection.rollback();
      return res.status(409).json({ message: "Tên món đã tồn tại trong thực đơn", code: "PRODUCT_NAME_EXISTS" });
    }
    await connection.execute(
      "UPDATE products SET name = ?, price = ?, image_url = ? WHERE id = ?",
      [name.value, price.value, imageUrl.value, id.value],
    );
    await connection.commit();
    return res.json({ message: "Cập nhật món thành công" });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật món:", error.message);
    return res.status(500).json({ message: "Lỗi cập nhật món", code: "PRODUCT_UPDATE_ERROR" });
  } finally {
    connection.release();
  }
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
app.delete("/api/products/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseProductId(req.params.id);
  if (id.error) return res.status(400).json({ message: id.error, code: "VALIDATION_ERROR" });

  try {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id.value]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy món", code: "PRODUCT_NOT_FOUND" });
    }
    return res.json({ message: "Xóa món thành công" });
  } catch (error) {
    console.error("Lỗi xóa món:", error.message);
    return res.status(500).json({ message: "Lỗi xóa món", code: "PRODUCT_DELETE_ERROR" });
  }
});

app.use("/api", userRoutes);

/* =========================
   START SERVER
========================= */
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`🌐 Trong cùng Wi-Fi/LAN, dùng IPv4 của máy chủ với port ${PORT}`);
});
