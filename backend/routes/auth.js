const crypto = require("crypto");
const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  hashPassword,
  hashToken,
  isScryptHash,
  verifyLegacyPassword,
  verifyScryptPassword,
} = require("../utils/password");

const router = express.Router();
const pool = db.promise();
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

router.post("/login", async (req, res) => {
  const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!username || !password) {
    return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu", code: "INVALID_CREDENTIALS" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, username, password, full_name, role, status, created_at FROM users WHERE username = ? LIMIT 1",
      [username],
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng", code: "INVALID_CREDENTIALS" });
    }

    const account = rows[0];
    if (account.status !== "ACTIVE") {
      return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa", code: "ACCOUNT_DISABLED" });
    }

    const passwordMatches = isScryptHash(account.password)
      ? await verifyScryptPassword(password, account.password)
      : verifyLegacyPassword(password, account.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng", code: "INVALID_CREDENTIALS" });
    }

    if (!isScryptHash(account.password)) {
      const upgradedPassword = await hashPassword(password);
      await pool.execute("UPDATE users SET password = ? WHERE id = ? AND password = ?", [upgradedPassword, account.id, account.password]);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await pool.execute("DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP");
    await pool.execute(
      "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [account.id, hashToken(token), expiresAt],
    );

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: account.id,
        username: account.username,
        full_name: account.full_name,
        role: account.role,
        status: account.status,
        created_at: account.created_at,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message);
    return res.status(500).json({ message: "Lỗi máy chủ", code: "LOGIN_ERROR" });
  }
});

router.get("/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

router.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    await pool.execute("DELETE FROM auth_sessions WHERE id = ?", [req.authSessionId]);
    return res.json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error.message);
    return res.status(500).json({ message: "Không thể đăng xuất", code: "LOGOUT_ERROR" });
  }
});

module.exports = router;
