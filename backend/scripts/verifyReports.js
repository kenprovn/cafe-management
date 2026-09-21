const crypto = require("crypto");
const db = require("../db");
const { hashToken } = require("../utils/password");
const { setVietnamTimezone } = require("../utils/reportValidation");

const API = "http://127.0.0.1:5000/api";
const DEMO_MARKER = "[DEMO-REPORT-2026]";
const checks = [];

function check(name, condition, detail = "") {
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  checks.push(name);
}

async function api(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API}${path}`, { headers });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  return { status: response.status, data };
}

function queryRange(from, to) {
  return `/reports/overview?date_from=${from}&date_to=${to}`;
}

async function makeSession(connection, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  await connection.execute(
    "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 HOUR))",
    [userId, tokenHash],
  );
  return { token, tokenHash };
}

function comparableProducts(rows, quantityFirst) {
  return rows.map((row) => ({
    product_name: row.product_name,
    total_quantity: Number(row.total_quantity),
    revenue: Number(row.revenue),
  })).sort((a, b) => quantityFirst
    ? b.total_quantity - a.total_quantity || b.revenue - a.revenue || a.product_name.localeCompare(b.product_name)
    : b.revenue - a.revenue || b.total_quantity - a.total_quantity || a.product_name.localeCompare(b.product_name));
}

async function run() {
  const pool = db.promise();
  const connection = await pool.getConnection();
  const sessionHashes = [];

  try {
    await setVietnamTimezone(connection);
    const [users] = await connection.execute(
      "SELECT id, role FROM users WHERE status = 'ACTIVE' AND role IN ('admin', 'staff') ORDER BY id",
    );
    const admin = users.find((user) => user.role === "admin");
    const staff = users.find((user) => user.role === "staff");
    check("active admin and staff exist", Boolean(admin && staff));

    const adminSession = await makeSession(connection, admin.id);
    const staffSession = await makeSession(connection, staff.id);
    sessionHashes.push(adminSession.tokenHash, staffSession.tokenHash);

    const unauthenticated = await api(queryRange("2026-09-20", "2026-09-20"));
    const forbidden = await api(queryRange("2026-09-20", "2026-09-20"), staffSession.token);
    check("unauthenticated report request returns 401", unauthenticated.status === 401);
    check("staff report request returns 403", forbidden.status === 403);

    const rangeCases = [
      ["single-day range", "2026-09-20", "2026-09-20", 1],
      ["7-day range", "2026-09-14", "2026-09-20", 7],
      ["30-day range", "2026-08-22", "2026-09-20", 30],
      ["full demo range", "2026-08-24", "2026-09-20", 28],
    ];
    let demoReport;
    for (const [name, from, to, days] of rangeCases) {
      const response = await api(queryRange(from, to), adminSession.token);
      check(name, response.status === 200 && response.data.daily_revenue.length === days);
      check(`${name} includes zero-value calendar days`, response.data.daily_revenue.every((row) => row.date && Number(row.revenue) >= 0));
      if (name === "full demo range") demoReport = response.data;
    }

    const invalidCases = [
      ["invalid date format", queryRange("24-08-2026", "2026-09-20")],
      ["impossible calendar date", queryRange("2026-02-30", "2026-03-01")],
      ["reversed range", queryRange("2026-09-20", "2026-08-24")],
      ["range over 366 days", queryRange("2025-01-01", "2026-01-02")],
    ];
    for (const [name, path] of invalidCases) {
      const response = await api(path, adminSession.token);
      check(name, response.status === 400 && response.data.code === "INVALID_REPORT_RANGE");
    }

    const start = "2026-08-24 00:00:00";
    const end = "2026-09-21 00:00:00";
    const [allData] = await connection.execute(
      `SELECT COUNT(*) AS paid_orders, COALESCE(SUM(p.amount), 0) AS revenue,
              COALESCE(SUM(items.quantity), 0) AS quantity
       FROM payments p
       LEFT JOIN (
         SELECT order_id, SUM(quantity) AS quantity
         FROM order_items GROUP BY order_id
       ) items ON items.order_id = p.order_id
       WHERE p.paid_at >= ? AND p.paid_at < ?`,
      [start, end],
    );
    check("report summary reconciles to all payment rows", Number(demoReport.summary.paid_order_count) === Number(allData[0].paid_orders)
      && Number(demoReport.summary.total_revenue) === Number(allData[0].revenue)
      && Number(demoReport.summary.total_quantity_sold) === Number(allData[0].quantity));

    const [demoData] = await connection.execute(
      `SELECT COUNT(*) AS paid_orders, COALESCE(SUM(p.amount), 0) AS revenue,
              COALESCE(SUM(items.quantity), 0) AS quantity
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       LEFT JOIN (
         SELECT order_id, SUM(quantity) AS quantity
         FROM order_items GROUP BY order_id
       ) items ON items.order_id = p.order_id
       WHERE p.paid_at >= ? AND p.paid_at < ? AND o.note LIKE ?`,
      [start, end, `%${DEMO_MARKER}%`],
    );
    check("demo paid orders equal 75", Number(demoData[0].paid_orders) === 75);
    check("demo revenue equals 9,519,000 VND", Number(demoData[0].revenue) === 9519000);
    check("demo quantity sold equals 243", Number(demoData[0].quantity) === 243);

    const currentDayStart = "2026-09-21 00:00:00";
    const currentDayEnd = "2026-09-22 00:00:00";
    const currentDayReport = await api(queryRange("2026-09-21", "2026-09-21"), adminSession.token);
    const [currentDayPayments] = await connection.execute(
      `SELECT COUNT(*) AS paid_orders, COALESCE(SUM(amount), 0) AS revenue
       FROM payments WHERE paid_at >= ? AND paid_at < ?`,
      [currentDayStart, currentDayEnd],
    );
    const [unpaidCompleted] = await connection.execute(
      `SELECT COUNT(*) AS count
       FROM orders o LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.status = 'COMPLETED' AND p.id IS NULL
         AND o.closed_at >= ? AND o.closed_at < ?`,
      [currentDayStart, currentDayEnd],
    );
    check("completed-but-unpaid test records exist", Number(unpaidCompleted[0].count) > 0);
    check("completed-but-unpaid orders excluded from financial totals", currentDayReport.status === 200
      && Number(currentDayReport.data.summary.paid_order_count) === Number(currentDayPayments[0].paid_orders)
      && Number(currentDayReport.data.summary.total_revenue) === Number(currentDayPayments[0].revenue));

    const dashboard = await api("/dashboard/summary", staffSession.token);
    check("dashboard today uses the same Vietnam payment range", dashboard.status === 200
      && Number(dashboard.data.paid_orders_today) === Number(currentDayPayments[0].paid_orders)
      && Number(dashboard.data.today_revenue) === Number(currentDayPayments[0].revenue));

    const [snapshotProducts] = await connection.execute(
      `SELECT oi.product_name, SUM(oi.quantity) AS total_quantity, SUM(oi.subtotal) AS revenue
       FROM payments p JOIN order_items oi ON oi.order_id = p.order_id
       WHERE p.paid_at >= ? AND p.paid_at < ?
       GROUP BY oi.product_name`,
      [start, end],
    );
    const snapshotRows = comparableProducts(snapshotProducts, true);
    check("quantity ranking uses historical item snapshots", JSON.stringify(comparableProducts(demoReport.top_products_by_quantity, true)) === JSON.stringify(snapshotRows.slice(0, 10)));
    check("revenue ranking uses historical item snapshots", JSON.stringify(comparableProducts(demoReport.top_products_by_revenue, false)) === JSON.stringify(comparableProducts(snapshotProducts, false).slice(0, 10)));

    const emptyRange = await api(queryRange("2020-01-01", "2020-01-03"), adminSession.token);
    check("empty range returns zero summary and zero-value days", emptyRange.status === 200
      && Number(emptyRange.data.summary.total_revenue) === 0
      && emptyRange.data.daily_revenue.length === 3
      && emptyRange.data.daily_revenue.every((day) => Number(day.revenue) === 0));

    console.log(JSON.stringify({
      passed: checks.length,
      demo: {
        paid_orders: Number(demoData[0].paid_orders),
        revenue: Number(demoData[0].revenue),
        quantity: Number(demoData[0].quantity),
      },
      all_data_report: {
        paid_orders: Number(allData[0].paid_orders),
        revenue: Number(allData[0].revenue),
        quantity: Number(allData[0].quantity),
      },
      completed_unpaid_on_2026_09_21: Number(unpaidCompleted[0].count),
      checks,
    }, null, 2));
  } finally {
    for (const tokenHash of sessionHashes) {
      await connection.execute("DELETE FROM auth_sessions WHERE token_hash = ?", [tokenHash]);
    }
    connection.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Report verification failed:", error.message);
  process.exit(1);
});
