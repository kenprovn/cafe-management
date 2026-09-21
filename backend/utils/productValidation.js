const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_PRODUCT_PRICE = 99999999.99;
const MAX_PRODUCT_IMAGE_URL_LENGTH = 255;

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

function validateProductImageUrl(value) {
  if (value === null || value === undefined || value === "") return { value: null };
  if (typeof value !== "string") return { error: "Đường dẫn ảnh không hợp lệ" };

  const normalized = value.trim();
  if (!normalized) return { value: null };
  if (normalized.length > MAX_PRODUCT_IMAGE_URL_LENGTH) {
    return { error: `Đường dẫn ảnh không được vượt quá ${MAX_PRODUCT_IMAGE_URL_LENGTH} ký tự` };
  }
  if (!normalized.startsWith("/images/products/") || normalized.includes("..")) {
    return { error: "Đường dẫn ảnh phải nằm trong /images/products/" };
  }
  return { value: normalized };
}

function parseProductId(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return { error: "Mã món không hợp lệ" };
  return { value: parsed };
}

module.exports = {
  parseProductId,
  productNameKey,
  validateProductImageUrl,
  validateProductName,
  validateProductPrice,
};
