const express = require("express");
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { parsePositiveId } = require("../utils/orderValidation");
const { hashPassword } = require("../utils/password");
const {
  validateFullName,
  validatePassword,
  validateRole,
  validateStatus,
  validateUsername,
} = require("../utils/userValidation");

const router = express.Router();
const pool = db.promise();

router.use("/users", requireAuth, requireRole("admin"));

function sendError(res, error) {
  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Tên đăng nhập đã tồn tại", code: "USERNAME_EXISTS" });
  }
  console.error("Lỗi quản lý nhân viên:", error.message);
  return res.status(500).json({ message: "Lỗi xử lý tài khoản nhân viên", code: "USER_ERROR" });
}

router.get("/users", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const role = typeof req.query.role === "string" ? req.query.role : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  if (search.length > 100) return res.status(400).json({ message: "Từ khóa tìm kiếm quá dài", code: "INVALID_SEARCH" });
  if (role && validateRole(role).error) return res.status(400).json({ message: "Vai trò không hợp lệ", code: "INVALID_ROLE" });
  if (status && validateStatus(status).error) return res.status(400).json({ message: "Trạng thái không hợp lệ", code: "INVALID_STATUS" });

  const conditions = [];
  const params = [];
  if (search) {
    conditions.push("(username LIKE ? OR full_name LIKE ? OR CAST(id AS CHAR) LIKE ?)");
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }
  if (role) {
    conditions.push("role = ?");
    params.push(role);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [users] = await pool.execute(
      `SELECT id, username, full_name, role, status, created_at
       FROM users ${where}
       ORDER BY status = 'ACTIVE' DESC, role = 'admin' DESC, id`,
      params,
    );
    return res.json({ users });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post("/users", async (req, res) => {
  const username = validateUsername(req.body.username);
  const fullName = validateFullName(req.body.full_name);
  const role = validateRole(req.body.role);
  const password = validatePassword(req.body.password);
  const validationError = username.error || fullName.error || role.error || password.error;
  if (validationError) return res.status(400).json({ message: validationError, code: "VALIDATION_ERROR" });

  try {
    const passwordHash = await hashPassword(password.value);
    const [result] = await pool.execute(
      "INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, 'ACTIVE')",
      [username.value, passwordHash, fullName.value, role.value],
    );
    const [rows] = await pool.execute(
      "SELECT id, username, full_name, role, status, created_at FROM users WHERE id = ?",
      [result.insertId],
    );
    return res.status(201).json({ message: "Đã thêm nhân viên", user: rows[0] });
  } catch (error) {
    return sendError(res, error);
  }
});

router.put("/users/:id", async (req, res) => {
  const parsedId = parsePositiveId(req.params.id, "Mã nhân viên");
  const fullName = validateFullName(req.body.full_name);
  const role = validateRole(req.body.role);
  const validationError = parsedId.error || fullName.error || role.error;
  if (validationError) return res.status(400).json({ message: validationError, code: "VALIDATION_ERROR" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [targets] = await connection.execute(
      "SELECT id, role, status FROM users WHERE id = ? FOR UPDATE",
      [parsedId.value],
    );
    if (targets.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy nhân viên", code: "USER_NOT_FOUND" });
    }
    const target = targets[0];
    if (target.id === req.user.id && target.role !== role.value) {
      await connection.rollback();
      return res.status(409).json({ message: "Bạn không thể tự thay đổi vai trò của mình", code: "SELF_DEMOTION_FORBIDDEN" });
    }
    if (target.role === "admin" && role.value !== "admin" && target.status === "ACTIVE") {
      const [activeAdmins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'ACTIVE' FOR UPDATE",
      );
      if (activeAdmins.length <= 1) {
        await connection.rollback();
        return res.status(409).json({ message: "Phải giữ lại ít nhất một quản trị viên đang hoạt động", code: "LAST_ADMIN" });
      }
    }

    await connection.execute("UPDATE users SET full_name = ?, role = ? WHERE id = ?", [fullName.value, role.value, target.id]);
    const [rows] = await connection.execute(
      "SELECT id, username, full_name, role, status, created_at FROM users WHERE id = ?",
      [target.id],
    );
    await connection.commit();
    return res.json({ message: "Đã cập nhật nhân viên", user: rows[0] });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

router.patch("/users/:id/password", async (req, res) => {
  const parsedId = parsePositiveId(req.params.id, "Mã nhân viên");
  const password = validatePassword(req.body.password);
  const validationError = parsedId.error || password.error;
  if (validationError) return res.status(400).json({ message: validationError, code: "VALIDATION_ERROR" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [targets] = await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [parsedId.value]);
    if (targets.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy nhân viên", code: "USER_NOT_FOUND" });
    }
    const passwordHash = await hashPassword(password.value);
    await connection.execute("UPDATE users SET password = ? WHERE id = ?", [passwordHash, parsedId.value]);
    await connection.execute("DELETE FROM auth_sessions WHERE user_id = ?", [parsedId.value]);
    await connection.commit();
    return res.json({ message: "Đã cập nhật mật khẩu và thu hồi các phiên đăng nhập cũ" });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

router.patch("/users/:id/status", async (req, res) => {
  const parsedId = parsePositiveId(req.params.id, "Mã nhân viên");
  const status = validateStatus(req.body.status);
  const validationError = parsedId.error || status.error;
  if (validationError) return res.status(400).json({ message: validationError, code: "VALIDATION_ERROR" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [targets] = await connection.execute(
      "SELECT id, role, status FROM users WHERE id = ? FOR UPDATE",
      [parsedId.value],
    );
    if (targets.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy nhân viên", code: "USER_NOT_FOUND" });
    }
    const target = targets[0];
    if (target.id === req.user.id && status.value === "DISABLED") {
      await connection.rollback();
      return res.status(409).json({ message: "Bạn không thể tự vô hiệu hóa tài khoản", code: "SELF_DISABLE_FORBIDDEN" });
    }
    if (target.role === "admin" && target.status === "ACTIVE" && status.value === "DISABLED") {
      const [activeAdmins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' AND status = 'ACTIVE' FOR UPDATE",
      );
      if (activeAdmins.length <= 1) {
        await connection.rollback();
        return res.status(409).json({ message: "Không thể vô hiệu hóa quản trị viên đang hoạt động cuối cùng", code: "LAST_ADMIN" });
      }
    }

    await connection.execute("UPDATE users SET status = ? WHERE id = ?", [status.value, target.id]);
    if (status.value === "DISABLED") {
      await connection.execute("DELETE FROM auth_sessions WHERE user_id = ?", [target.id]);
    }
    const [rows] = await connection.execute(
      "SELECT id, username, full_name, role, status, created_at FROM users WHERE id = ?",
      [target.id],
    );
    await connection.commit();
    return res.json({
      message: status.value === "ACTIVE" ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản",
      user: rows[0],
    });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

module.exports = router;
