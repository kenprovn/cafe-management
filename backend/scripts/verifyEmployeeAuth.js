const crypto = require("crypto");
const db = require("../db");
const { hashToken } = require("../utils/password");

const API = "http://127.0.0.1:5000/api";
const results = [];

function check(name, condition, detail = "") {
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  results.push({ name, pass: true });
}

async function api(path, { token, method = "GET", body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  return { status: response.status, data };
}

async function signIn(username, password) {
  return api("/login", { method: "POST", body: { username, password } });
}

function hasPasswordField(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasPasswordField);
  return Object.entries(value).some(([key, child]) => key.toLowerCase().includes("password") || hasPasswordField(child));
}

async function run() {
  const pool = db.promise();
  const adminLoginA = await signIn("admin", "admin123");
  const staffLogin = await signIn("nhanvien", "123456");
  check("existing admin login", adminLoginA.status === 200);
  check("existing staff login", staffLogin.status === 200);
  const admin = adminLoginA.data.user;
  const staff = staffLogin.data.user;
  const adminTokenA = adminLoginA.data.token;
  const staffToken = staffLogin.data.token;

  const [passwordAudit] = await pool.query(
    "SELECT COUNT(*) AS total, SUM(password LIKE 'scrypt$%') AS secured FROM users",
  );
  check("all stored passwords use scrypt", Number(passwordAudit[0].total) === Number(passwordAudit[0].secured));

  const restored = await api("/auth/me", { token: adminTokenA });
  check("session restoration", restored.status === 200 && restored.data.user.id === admin.id);

  const adminLoginB = await signIn("admin", "admin123");
  check("second admin session", adminLoginB.status === 200);
  const adminToken = adminLoginB.data.token;
  const logout = await api("/auth/logout", { token: adminTokenA, method: "POST" });
  const revoked = await api("/auth/me", { token: adminTokenA });
  const preserved = await api("/auth/me", { token: adminToken });
  check("logout revokes current session only", logout.status === 200 && revoked.status === 401 && preserved.status === 200);

  const invalid = await api("/auth/me", { token: "invalid-test-token" });
  check("invalid token rejected", invalid.status === 401);

  const expiredToken = crypto.randomBytes(32).toString("hex");
  const expiredHash = hashToken(expiredToken);
  await pool.execute(
    "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 MINUTE))",
    [admin.id, expiredHash],
  );
  const expired = await api("/auth/me", { token: expiredToken });
  const [expiredRows] = await pool.execute("SELECT COUNT(*) AS count FROM auth_sessions WHERE token_hash = ?", [expiredHash]);
  check("expired session rejected and removed", expired.status === 401 && expired.data.code === "SESSION_EXPIRED" && Number(expiredRows[0].count) === 0);

  const list = await api("/users", { token: adminToken });
  check("admin lists employees", list.status === 200 && Array.isArray(list.data.users) && !hasPasswordField(list.data));

  const testUsername = `kiemthu_${Date.now()}`;
  const originalPassword = `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
  const created = await api("/users", {
    token: adminToken,
    method: "POST",
    body: { username: testUsername, full_name: "Nhân viên Kiểm thử", role: "staff", password: originalPassword },
  });
  check("admin creates staff account", created.status === 201 && created.data.user.role === "staff" && !hasPasswordField(created.data));
  const testUser = created.data.user;

  const duplicate = await api("/users", {
    token: adminToken,
    method: "POST",
    body: { username: testUsername, full_name: "Tên Trùng", role: "staff", password: originalPassword },
  });
  check("duplicate username rejected", duplicate.status === 409 && duplicate.data.code === "USERNAME_EXISTS");

  const searched = await api(`/users?search=${encodeURIComponent(testUsername)}&role=staff&status=ACTIVE`, { token: adminToken });
  check("employee search and filters", searched.status === 200 && searched.data.users.length === 1 && searched.data.users[0].id === testUser.id);

  const edited = await api(`/users/${testUser.id}`, {
    token: adminToken,
    method: "PUT",
    body: { full_name: "Nhân viên Kiểm thử Đã sửa", role: "staff" },
  });
  check("admin edits full name", edited.status === 200 && edited.data.user.full_name.endsWith("Đã sửa"));

  const promoted = await api(`/users/${testUser.id}`, {
    token: adminToken,
    method: "PUT",
    body: { full_name: edited.data.user.full_name, role: "admin" },
  });
  const demoted = await api(`/users/${testUser.id}`, {
    token: adminToken,
    method: "PUT",
    body: { full_name: edited.data.user.full_name, role: "staff" },
  });
  check("admin changes role safely", promoted.status === 200 && promoted.data.user.role === "admin" && demoted.status === 200 && demoted.data.user.role === "staff");

  const newPassword = `${crypto.randomBytes(12).toString("base64url")}Bb2!`;
  const reset = await api(`/users/${testUser.id}/password`, {
    token: adminToken,
    method: "PATCH",
    body: { password: newPassword },
  });
  const oldLogin = await signIn(testUsername, originalPassword);
  const newLogin = await signIn(testUsername, newPassword);
  check("admin resets password", reset.status === 200 && oldLogin.status === 401 && newLogin.status === 200);
  check("password fields never returned", !hasPasswordField(reset.data) && !hasPasswordField(newLogin.data.user));

  const testToken = newLogin.data.token;
  const disabled = await api(`/users/${testUser.id}/status`, {
    token: adminToken,
    method: "PATCH",
    body: { status: "DISABLED" },
  });
  const disabledSession = await api("/auth/me", { token: testToken });
  const disabledLogin = await signIn(testUsername, newPassword);
  const [remainingSessions] = await pool.execute("SELECT COUNT(*) AS count FROM auth_sessions WHERE user_id = ?", [testUser.id]);
  check("disable revokes all sessions", disabled.status === 200 && disabledSession.status === 401 && Number(remainingSessions[0].count) === 0);
  check("disabled account cannot login", disabledLogin.status === 403 && disabledLogin.data.code === "ACCOUNT_DISABLED");

  const enabled = await api(`/users/${testUser.id}/status`, {
    token: adminToken,
    method: "PATCH",
    body: { status: "ACTIVE" },
  });
  const enabledLogin = await signIn(testUsername, newPassword);
  check("admin re-enables account", enabled.status === 200 && enabledLogin.status === 200);

  const selfDisable = await api(`/users/${admin.id}/status`, {
    token: adminToken,
    method: "PATCH",
    body: { status: "DISABLED" },
  });
  const selfDemote = await api(`/users/${admin.id}`, {
    token: adminToken,
    method: "PUT",
    body: { full_name: admin.full_name, role: "staff" },
  });
  const [activeAdmins] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND status = 'ACTIVE'");
  check("self-disable rejected", selfDisable.status === 409 && selfDisable.data.code === "SELF_DISABLE_FORBIDDEN");
  check("self-demotion and last-admin loss rejected", selfDemote.status === 409 && selfDemote.data.code === "SELF_DEMOTION_FORBIDDEN" && Number(activeAdmins[0].count) >= 1);

  const staffUsers = await api("/users", { token: staffToken });
  const staffProductCreate = await api("/products", { token: staffToken, method: "POST", body: { name: "Không được tạo", price: 1000 } });
  const [products] = await Promise.all([api("/products", { token: staffToken })]);
  check("staff reads products", products.status === 200 && Array.isArray(products.data) && products.data.length > 0, `status ${products.status} ${JSON.stringify(products.data)}`);
  const productId = products.data[0].id;
  const staffProductEdit = await api(`/products/${productId}`, { token: staffToken, method: "PUT", body: { name: "Không được sửa", price: 1000 } });
  const staffProductDelete = await api(`/products/${productId}`, { token: staffToken, method: "DELETE" });
  check("staff employee API forbidden", staffUsers.status === 403);
  check("staff product mutations forbidden", [staffProductCreate, staffProductEdit, staffProductDelete].every((response) => response.status === 403));

  const adminProduct = await api("/products", { token: adminToken, method: "POST", body: { name: `Món kiểm thử ${Date.now()}`, price: 12345 } });
  const adminProductEdit = await api(`/products/${adminProduct.data.id}`, { token: adminToken, method: "PUT", body: { name: "Món kiểm thử đã sửa", price: 23456 } });
  const adminProductDelete = await api(`/products/${adminProduct.data.id}`, { token: adminToken, method: "DELETE" });
  check("admin product mutations retained", adminProduct.status === 201 && adminProductEdit.status === 200 && adminProductDelete.status === 200);

  const tables = await api("/tables", { token: staffToken });
  const invoicesBefore = await api("/invoices", { token: staffToken });
  const dashboardBefore = await api("/dashboard/summary", { token: staffToken });
  check("staff reads POS resources", products.status === 200 && tables.status === 200 && invoicesBefore.status === 200 && dashboardBefore.status === 200);
  const freeTable = tables.data.find((table) => table.status === "Trống");
  const menuProduct = products.data[0];
  const opened = await api(`/tables/${freeTable.id}/orders`, {
    token: staffToken,
    method: "POST",
    body: { user_id: admin.id, note: "Kiểm thử phân quyền POS", items: [{ product_id: menuProduct.id, quantity: 1 }] },
  });
  check("staff opens order using session identity", opened.status === 201 && opened.data.order.created_by === staff.id);
  const originalUnitPrice = opened.data.order.items[0].unit_price;
  const orderItem = opened.data.order.items[0];
  const updated = await api(`/orders/${opened.data.order.id}`, {
    token: staffToken,
    method: "PUT",
    body: { note: "Kiểm thử cập nhật POS", items: [{ order_item_id: orderItem.order_item_id, product_id: menuProduct.id, quantity: 2 }] },
  });
  check("staff updates order with stable snapshot price", updated.status === 200 && updated.data.order.items[0].unit_price === originalUnitPrice && updated.data.order.items[0].quantity === 2);
  const checkedOut = await api(`/orders/${opened.data.order.id}/checkout`, {
    token: staffToken,
    method: "POST",
    body: { payment_method: "CASH", paid_by: admin.id, amount: 1 },
  });
  check("staff checkout uses locked total and session cashier", checkedOut.status === 201 && checkedOut.data.invoice.paid_by === staff.id && Number(checkedOut.data.invoice.amount) === Number(updated.data.order.total_amount));
  const invoiceDetail = await api(`/invoices/${checkedOut.data.invoice.invoice_id}`, { token: staffToken });
  const invoicesAfter = await api("/invoices", { token: staffToken });
  const dashboardAfter = await api("/dashboard/summary", { token: staffToken });
  const tablesAfter = await api("/tables", { token: staffToken });
  check("invoice history and detail retained", invoiceDetail.status === 200 && invoicesAfter.data.invoices.some((invoice) => invoice.invoice_id === checkedOut.data.invoice.invoice_id));
  check("dashboard revenue updated", Number(dashboardAfter.data.today_revenue) === Number(dashboardBefore.data.today_revenue) + Number(checkedOut.data.invoice.amount));
  check("checkout releases table", tablesAfter.data.find((table) => table.id === freeTable.id).status === "Trống");

  await api(`/users/${testUser.id}/status`, { token: adminToken, method: "PATCH", body: { status: "DISABLED" } });
  console.log(JSON.stringify({ passed: results.length, failed: 0, checks: results.map((result) => result.name) }, null, 2));
  await pool.end();
}

run().catch(async (error) => {
  console.error("Verification failed:", error.stack);
  try { await db.promise().end(); } catch {}
  process.exit(1);
});
