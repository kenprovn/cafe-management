const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD"];

function validatePaymentMethod(value) {
  if (typeof value !== "string" || !PAYMENT_METHODS.includes(value)) {
    return { error: "Phương thức thanh toán không hợp lệ" };
  }
  return { value };
}

function validateDate(value, label) {
  if (value === undefined || value === "") return { value: null };
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `${label} không hợp lệ` };
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return { error: `${label} không hợp lệ` };
  }
  return { value };
}

module.exports = { PAYMENT_METHODS, validateDate, validatePaymentMethod };
