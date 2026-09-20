const db = require("../db");
const { hashToken } = require("../utils/password");

const pool = db.promise();

function sendUnauthorized(res, message, code = "UNAUTHORIZED") {
  return res.status(401).json({ message, code });
}

async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/);
  if (!match) return sendUnauthorized(res, "Vui lòng đăng nhập để tiếp tục", "AUTH_REQUIRED");

  const tokenHash = hashToken(match[1]);
  try {
    const [rows] = await pool.execute(
      `SELECT s.id AS session_id, s.expires_at,
              u.id, u.username, u.full_name, u.role, u.status, u.created_at
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?
       LIMIT 1`,
      [tokenHash],
    );

    if (rows.length === 0) return sendUnauthorized(res, "Phiên đăng nhập không hợp lệ", "INVALID_SESSION");
    const session = rows[0];
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await pool.execute("DELETE FROM auth_sessions WHERE id = ?", [session.session_id]);
      return sendUnauthorized(res, "Phiên đăng nhập đã hết hạn", "SESSION_EXPIRED");
    }
    if (session.status !== "ACTIVE") {
      await pool.execute("DELETE FROM auth_sessions WHERE id = ?", [session.session_id]);
      return sendUnauthorized(res, "Tài khoản đã bị vô hiệu hóa", "ACCOUNT_DISABLED");
    }

    req.authSessionId = session.session_id;
    req.user = {
      id: session.id,
      username: session.username,
      full_name: session.full_name,
      role: session.role,
      status: session.status,
      created_at: session.created_at,
    };
    return next();
  } catch (error) {
    console.error("Lỗi xác thực phiên đăng nhập:", error.message);
    return res.status(500).json({ message: "Lỗi xác thực", code: "AUTH_ERROR" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện thao tác này",
        code: "FORBIDDEN",
      });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
