const express = require("express");
const db = require("../db");
const { parsePositiveId } = require("../utils/orderValidation");
const { validateDate, validatePaymentMethod } = require("../utils/paymentValidation");
const { setVietnamTimezone } = require("../utils/reportValidation");

const router = express.Router();
const pool = db.promise();

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function getInvoiceById(executor, invoiceId) {
  const [invoices] = await executor.execute(
    `SELECT p.id AS invoice_id, p.order_id, p.amount, p.payment_method,
            p.paid_by, p.paid_at, o.table_id, t.table_number,
            o.status AS order_status, o.note, o.total_amount,
            o.created_at AS order_created_at, o.closed_at,
            u.full_name AS cashier_name, u.username AS cashier_username
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     JOIN cafe_tables t ON t.id = o.table_id
     JOIN users u ON u.id = p.paid_by
     WHERE p.id = ?`,
    [invoiceId],
  );
  if (invoices.length === 0) return null;

  const [items] = await executor.execute(
    `SELECT id AS order_item_id, product_id, product_name,
            unit_price, quantity, subtotal
     FROM order_items
     WHERE order_id = ?
     ORDER BY id`,
    [invoices[0].order_id],
  );
  return { ...invoices[0], items };
}

function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "Đơn hàng này đã được thanh toán",
      code: "PAYMENT_ALREADY_EXISTS",
    });
  }
  console.error("Lỗi xử lý hóa đơn:", error);
  return res.status(500).json({ message: "Lỗi xử lý hóa đơn" });
}

router.post("/orders/:orderId/checkout", async (req, res) => {
  const parsedOrderId = parsePositiveId(req.params.orderId, "Mã đơn hàng");
  const parsedMethod = validatePaymentMethod(req.body.payment_method);
  const validationError = parsedOrderId.error || parsedMethod.error;
  if (validationError) return res.status(400).json({ message: validationError });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute(
      `SELECT id, table_id, status, total_amount
       FROM orders WHERE id = ? FOR UPDATE`,
      [parsedOrderId.value],
    );
    if (orders.length === 0) throw new HttpError(404, "Không tìm thấy đơn hàng");

    const [existingPayments] = await connection.execute(
      "SELECT id FROM payments WHERE order_id = ? LIMIT 1",
      [parsedOrderId.value],
    );
    if (existingPayments.length > 0) {
      throw new HttpError(409, "Đơn hàng này đã được thanh toán", "PAYMENT_ALREADY_EXISTS");
    }
    if (orders[0].status !== "OPEN") {
      throw new HttpError(409, "Chỉ có thể thanh toán đơn hàng đang mở", "ORDER_NOT_OPEN");
    }

    const [paymentResult] = await connection.execute(
      `INSERT INTO payments (order_id, amount, payment_method, paid_by)
       VALUES (?, ?, ?, ?)`,
      [parsedOrderId.value, orders[0].total_amount, parsedMethod.value, req.user.id],
    );
    await connection.execute(
      "UPDATE orders SET status = 'COMPLETED', closed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [parsedOrderId.value],
    );
    await connection.execute("UPDATE cafe_tables SET status = 'Trống' WHERE id = ?", [orders[0].table_id]);

    const invoice = await getInvoiceById(connection, paymentResult.insertId);
    await connection.commit();
    return res.status(201).json({ message: "Thanh toán thành công", invoice });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

router.get("/invoices", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  if (search.length > 100) return res.status(400).json({ message: "Từ khóa tìm kiếm quá dài" });
  const fromDate = validateDate(req.query.date_from, "Ngày bắt đầu");
  const toDate = validateDate(req.query.date_to, "Ngày kết thúc");
  const validationError = fromDate.error || toDate.error;
  if (validationError) return res.status(400).json({ message: validationError });
  if (fromDate.value && toDate.value && fromDate.value > toDate.value) {
    return res.status(400).json({ message: "Ngày bắt đầu phải trước ngày kết thúc" });
  }

  const conditions = [];
  const params = [];
  if (search) {
    conditions.push(`(CAST(p.id AS CHAR) LIKE ? OR CAST(o.id AS CHAR) LIKE ?
      OR t.table_number LIKE ? OR u.full_name LIKE ?)`);
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }
  if (fromDate.value) {
    conditions.push("p.paid_at >= ?");
    params.push(fromDate.value);
  }
  if (toDate.value) {
    conditions.push("p.paid_at < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(toDate.value);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [rows] = await pool.execute(
      `SELECT p.id AS invoice_id, p.order_id, p.amount, p.payment_method,
              p.paid_at, t.table_number, u.full_name AS cashier_name,
              o.status AS order_status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       JOIN cafe_tables t ON t.id = o.table_id
       JOIN users u ON u.id = p.paid_by
       ${whereClause}
       ORDER BY p.paid_at DESC, p.id DESC`,
      params,
    );
    return res.json({ invoices: rows });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/invoices/:invoiceId", async (req, res) => {
  const parsedInvoiceId = parsePositiveId(req.params.invoiceId, "Mã hóa đơn");
  if (parsedInvoiceId.error) return res.status(400).json({ message: parsedInvoiceId.error });
  try {
    const invoice = await getInvoiceById(pool, parsedInvoiceId.value);
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    return res.json({ invoice });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/dashboard/summary", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await setVietnamTimezone(connection);
    const [rows] = await connection.execute(
      `SELECT COALESCE(SUM(amount), 0) AS today_revenue,
              COUNT(*) AS paid_orders_today
       FROM payments
       WHERE paid_at >= CURRENT_DATE
         AND paid_at < DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY)`,
    );
    return res.json(rows[0]);
  } catch (error) {
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

module.exports = router;
