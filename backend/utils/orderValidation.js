const MAX_QUANTITY = 999;
const MAX_NOTE_LENGTH = 500;

function parsePositiveId(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${label} không hợp lệ` };
  }
  return { value: parsed };
}

function validateNote(value) {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== "string") return { error: "Ghi chú phải là chuỗi" };
  const note = value.trim();
  if (note.length > MAX_NOTE_LENGTH) {
    return { error: `Ghi chú không được vượt quá ${MAX_NOTE_LENGTH} ký tự` };
  }
  return { value: note || null };
}

function validateItems(value, { allowExisting = false } = {}) {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: "Đơn hàng phải có ít nhất một món" };
  }

  const items = [];
  const seenItemIds = new Set();
  const seenProductIds = new Set();

  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      return { error: "Dữ liệu món không hợp lệ" };
    }

    const quantity = Number(rawItem.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { error: `Số lượng phải từ 1 đến ${MAX_QUANTITY}` };
    }

    let orderItemId = null;
    if (rawItem.order_item_id !== undefined && rawItem.order_item_id !== null) {
      if (!allowExisting) return { error: "Đơn mới không được chứa mã chi tiết cũ" };
      const parsedItemId = parsePositiveId(rawItem.order_item_id, "Mã chi tiết đơn hàng");
      if (parsedItemId.error) return parsedItemId;
      orderItemId = parsedItemId.value;
      if (seenItemIds.has(orderItemId)) return { error: "Chi tiết đơn hàng bị trùng" };
      seenItemIds.add(orderItemId);
    }

    let productId = null;
    if (rawItem.product_id !== undefined && rawItem.product_id !== null) {
      const parsedProductId = parsePositiveId(rawItem.product_id, "Mã món");
      if (parsedProductId.error) return parsedProductId;
      productId = parsedProductId.value;
    }

    if (!orderItemId && !productId) return { error: "Món mới phải có mã sản phẩm" };
    if (!orderItemId && seenProductIds.has(productId)) return { error: "Sản phẩm bị trùng trong đơn hàng" };
    if (!orderItemId) seenProductIds.add(productId);

    items.push({ orderItemId, productId, quantity });
  }

  return { value: items };
}

module.exports = { parsePositiveId, validateItems, validateNote };
