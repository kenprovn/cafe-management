const VALID_ROLES = ["admin", "staff"];
const VALID_STATUSES = ["ACTIVE", "DISABLED"];

function validateUsername(value) {
  if (typeof value !== "string" || !value.trim()) return { error: "Tên đăng nhập là bắt buộc" };
  const username = value.trim();
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
    return { error: "Tên đăng nhập phải dài 3-50 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang" };
  }
  return { value: username };
}

function validateFullName(value) {
  if (typeof value !== "string" || !value.trim()) return { error: "Họ tên là bắt buộc" };
  const fullName = value.trim().replace(/\s+/g, " ");
  if (fullName.length < 2 || fullName.length > 100) return { error: "Họ tên phải dài 2-100 ký tự" };
  return { value: fullName };
}

function validateRole(value) {
  return VALID_ROLES.includes(value) ? { value } : { error: "Vai trò không hợp lệ" };
}

function validateStatus(value) {
  return VALID_STATUSES.includes(value) ? { value } : { error: "Trạng thái tài khoản không hợp lệ" };
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    return { error: "Mật khẩu phải dài từ 8 đến 128 ký tự" };
  }
  return { value };
}

module.exports = { validateFullName, validatePassword, validateRole, validateStatus, validateUsername };
