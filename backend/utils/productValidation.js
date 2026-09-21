const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_PRODUCT_PRICE = 99999999.99;

function normalizeProductName(value) {
  return String(value).trim().replace(/\s+/g, " ").normalize("NFC");
}

function productNameKey(value) {
  return normalizeProductName(value).toLocaleLowerCase("vi-VN");
}

function validateProductName(value) {
  if (typeof value !== "string") return { error: "Tên món là bắt buộc" };
  const normalized = normalizeProductName(value);
  if (!normalized) return { error: "Tên món không được để trống" };
  if (normalized.length > MAX_PRODUCT_NAME_LENGTH) {
    return { error: `Tên món không được vượt quá ${MAX_PRODUCT_NAME_LENGTH} ký tự` };
  }
  return { value: normalized };
}

function validateProductPrice(value) {
  if (value === "" || value === null || value === undefined) {
    return { error: "Giá bán là bắt buộc" };
  }
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Giá bán phải là một số lớn hơn 0" };
  }
  if (price > MAX_PRODUCT_PRICE) {
    return { error: "Giá bán vượt quá giới hạn cho phép" };
  }
  if (!Number.isInteger(price * 100)) {
    return { error: "Giá bán chỉ được có tối đa 2 chữ số thập phân" };
  }
  return { value: price.toFixed(2) };
}

function parseProductId(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return { error: "Mã món không hợp lệ" };
  return { value: parsed };
}

module.exports = {
  parseProductId,
  productNameKey,
  validateProductName,
  validateProductPrice,
};
