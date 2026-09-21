const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  VIETNAM_TIMEZONE,
  setVietnamTimezone,
  validateReportRange,
} = require("../utils/reportValidation");

const router = express.Router();
const pool = db.promise();

function sendReportError(res, error) {
  console.error("Lỗi tạo báo cáo:", error.message);
  return res.status(500).json({
    message: "Không thể tạo báo cáo. Vui lòng thử lại.",
    code: "REPORT_ERROR",
  });
}

router.get(
  "/reports/overview",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const parsedRange = validateReportRange(req.query.date_from, req.query.date_to);
    if (parsedRange.error) {
      return res.status(400).json({
        message: parsedRange.error,
        code: "INVALID_REPORT_RANGE",
      });
    }

    const { dateFrom, dateTo, start, endExclusive } = parsedRange.value;
    const rangeParams = [start, endExclusive];
    const connection = await pool.getConnection();

    try {
      await setVietnamTimezone(connection);

      const [summaryRows] = await connection.execute(
        `SELECT COALESCE(SUM(p.amount), 0) AS total_revenue,
                COUNT(*) AS paid_order_count,
                COALESCE(AVG(p.amount), 0) AS average_invoice_value,
                COALESCE((
                  SELECT SUM(oi.quantity)
                  FROM payments paid
                  JOIN order_items oi ON oi.order_id = paid.order_id
                  WHERE paid.paid_at >= ? AND paid.paid_at < ?
                ), 0) AS total_quantity_sold
         FROM payments p
         WHERE p.paid_at >= ? AND p.paid_at < ?`,
        [...rangeParams, ...rangeParams],
      );

      const [dailyRevenue] = await connection.execute(
        `WITH RECURSIVE calendar AS (
           SELECT CAST(? AS DATE) AS report_date
           UNION ALL
           SELECT DATE_ADD(report_date, INTERVAL 1 DAY)
           FROM calendar
           WHERE report_date < CAST(? AS DATE)
         ), daily_payments AS (
           SELECT DATE(p.paid_at) AS report_date,
                  SUM(p.amount) AS revenue,
                  COUNT(*) AS paid_order_count
           FROM payments p
           WHERE p.paid_at >= ? AND p.paid_at < ?
           GROUP BY DATE(p.paid_at)
         )
         SELECT DATE_FORMAT(c.report_date, '%Y-%m-%d') AS date,
                COALESCE(d.revenue, 0) AS revenue,
                COALESCE(d.paid_order_count, 0) AS paid_order_count
         FROM calendar c
         LEFT JOIN daily_payments d ON d.report_date = c.report_date
         ORDER BY c.report_date`,
        [dateFrom, dateTo, ...rangeParams],
      );

      const [topProductsByQuantity] = await connection.execute(
        `SELECT oi.product_name,
                SUM(oi.quantity) AS total_quantity,
                SUM(oi.subtotal) AS revenue
         FROM payments p
         JOIN order_items oi ON oi.order_id = p.order_id
         WHERE p.paid_at >= ? AND p.paid_at < ?
         GROUP BY oi.product_name
         ORDER BY total_quantity DESC, revenue DESC, oi.product_name
         LIMIT 10`,
        rangeParams,
      );

      const [topProductsByRevenue] = await connection.execute(
        `SELECT oi.product_name,
                SUM(oi.subtotal) AS revenue,
                SUM(oi.quantity) AS total_quantity
         FROM payments p
         JOIN order_items oi ON oi.order_id = p.order_id
         WHERE p.paid_at >= ? AND p.paid_at < ?
         GROUP BY oi.product_name
         ORDER BY revenue DESC, total_quantity DESC, oi.product_name
         LIMIT 10`,
        rangeParams,
      );

      const [paymentMethods] = await connection.execute(
        `SELECT p.payment_method,
                COUNT(*) AS payment_count,
                SUM(p.amount) AS revenue,
                CASE
                  WHEN SUM(SUM(p.amount)) OVER () = 0 THEN 0
                  ELSE ROUND(SUM(p.amount) * 100 / SUM(SUM(p.amount)) OVER (), 2)
                END AS percentage
         FROM payments p
         WHERE p.paid_at >= ? AND p.paid_at < ?
         GROUP BY p.payment_method
         ORDER BY revenue DESC, p.payment_method`,
        rangeParams,
      );

      const [employees] = await connection.execute(
        `SELECT u.id AS employee_id,
                u.full_name AS employee_name,
                COUNT(*) AS paid_orders,
                SUM(p.amount) AS revenue_handled,
                AVG(p.amount) AS average_invoice_value
         FROM payments p
         JOIN users u ON u.id = p.paid_by
         WHERE p.paid_at >= ? AND p.paid_at < ?
         GROUP BY u.id, u.full_name
         ORDER BY revenue_handled DESC, paid_orders DESC, u.full_name`,
        rangeParams,
      );

      const [tables] = await connection.execute(
        `SELECT t.id AS table_id,
                t.table_number,
                COUNT(*) AS paid_orders,
                SUM(p.amount) AS revenue
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         JOIN cafe_tables t ON t.id = o.table_id
         WHERE p.paid_at >= ? AND p.paid_at < ?
         GROUP BY t.id, t.table_number
         ORDER BY revenue DESC, paid_orders DESC, t.table_number`,
        rangeParams,
      );

      return res.json({
        range: {
          date_from: dateFrom,
          date_to: dateTo,
          timezone: VIETNAM_TIMEZONE,
        },
        summary: summaryRows[0],
        daily_revenue: dailyRevenue,
        top_products_by_quantity: topProductsByQuantity,
        top_products_by_revenue: topProductsByRevenue,
        payment_methods: paymentMethods,
        employees,
        tables,
      });
    } catch (error) {
      return sendReportError(res, error);
    } finally {
      connection.release();
    }
  },
);

module.exports = router;
