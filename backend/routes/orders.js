const express = require("express");
const db = require("../db");
const { requireRole } = require("../middleware/auth");
const {
  parsePositiveId,
  validateItems,
  validateNote,
} = require("../utils/orderValidation");

const router = express.Router();
const pool = db.promise();
const MAX_TOTAL_CENTS = 999999999999;

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function decimalToCents(value) {
  const normalized = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new HttpError(500, "Giá sản phẩm trong cơ sở dữ liệu không hợp lệ");
  }
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) {
    throw new HttpError(500, "Giá sản phẩm vượt quá giới hạn cho phép");
  }
  return cents;
}

function centsToDecimal(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function calculateTotal(items) {
  let totalCents = 0;
  for (const item of items) {
    item.subtotalCents = item.unitPriceCents * item.quantity;
    totalCents += item.subtotalCents;
    if (!Number.isSafeInteger(item.subtotalCents) || totalCents > MAX_TOTAL_CENTS) {
      throw new HttpError(400, "Tổng tiền đơn hàng vượt quá giới hạn cho phép");
    }
  }
  return totalCents;
}

async function loadProducts(connection, productIds) {
  if (productIds.length === 0) return new Map();
  const placeholders = productIds.map(() => "?").join(", ");
  const [rows] = await connection.execute(
    `SELECT id, name, price FROM products WHERE id IN (${placeholders}) FOR SHARE`,
    productIds,
  );
  if (rows.length !== productIds.length) {
    throw new HttpError(400, "Một hoặc nhiều sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }
  return new Map(rows.map((row) => [row.id, row]));
}

async function getOrderById(executor, orderId) {
  const [orders] = await executor.execute(
    `SELECT o.id, o.table_id, t.table_number, o.created_by,
            u.full_name AS created_by_name, o.status, o.note,
            o.total_amount, o.created_at, o.updated_at, o.closed_at
     FROM orders o
     JOIN cafe_tables t ON t.id = o.table_id
     JOIN users u ON u.id = o.created_by
     WHERE o.id = ?`,
    [orderId],
  );
  if (orders.length === 0) return null;

  const [items] = await executor.execute(
    `SELECT id AS order_item_id, product_id, product_name,
            unit_price, quantity, subtotal
     FROM order_items
     WHERE order_id = ?
     ORDER BY id`,
    [orderId],
  );

  return { ...orders[0], items };
}

function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "Bàn này đã có một đơn hàng đang mở",
      code: "ACTIVE_ORDER_EXISTS",
    });
  }
  console.error("Lỗi xử lý đơn hàng:", error);
  return res.status(500).json({ message: "Lỗi xử lý đơn hàng" });
}

router.get("/tables/:tableId/active-order", async (req, res) => {
  const parsedTableId = parsePositiveId(req.params.tableId, "Mã bàn");
  if (parsedTableId.error) return res.status(400).json({ message: parsedTableId.error });

  try {
    const [rows] = await pool.execute(
      "SELECT id FROM orders WHERE table_id = ? AND status = 'OPEN' LIMIT 1",
      [parsedTableId.value],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Bàn chưa có đơn hàng đang mở",
        code: "NO_ACTIVE_ORDER",
      });
    }
    return res.json({ order: await getOrderById(pool, rows[0].id) });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post("/tables/:tableId/orders", async (req, res) => {
  const parsedTableId = parsePositiveId(req.params.tableId, "Mã bàn");
  const parsedNote = validateNote(req.body.note);
  const parsedItems = validateItems(req.body.items);
  const validationError = parsedTableId.error || parsedNote.error || parsedItems.error;
  if (validationError) return res.status(400).json({ message: validationError });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [tables] = await connection.execute(
      "SELECT id, status FROM cafe_tables WHERE id = ? FOR UPDATE",
      [parsedTableId.value],
    );
    if (tables.length === 0) throw new HttpError(404, "Không tìm thấy bàn");

    const [activeOrders] = await connection.execute(
      "SELECT id FROM orders WHERE table_id = ? AND status = 'OPEN' LIMIT 1 FOR UPDATE",
      [parsedTableId.value],
    );
    if (activeOrders.length > 0) {
      throw new HttpError(409, "Bàn này đã có đơn hàng đang mở", "ACTIVE_ORDER_EXISTS");
    }

    const productIds = parsedItems.value.map((item) => item.productId);
    const products = await loadProducts(connection, productIds);
    const orderItems = parsedItems.value.map((item) => {
      const product = products.get(item.productId);
      return {
        productId: product.id,
        productName: product.name,
        unitPriceCents: decimalToCents(product.price),
        quantity: item.quantity,
      };
    });
    const totalCents = calculateTotal(orderItems);

    const [result] = await connection.execute(
      `INSERT INTO orders (table_id, created_by, note, total_amount)
       VALUES (?, ?, ?, ?)`,
      [parsedTableId.value, req.user.id, parsedNote.value, centsToDecimal(totalCents)],
    );

    for (const item of orderItems) {
      await connection.execute(
        `INSERT INTO order_items
           (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [result.insertId, item.productId, item.productName,
          centsToDecimal(item.unitPriceCents), item.quantity,
          centsToDecimal(item.subtotalCents)],
      );
    }

    await connection.execute(
      "UPDATE cafe_tables SET status = 'Đang sử dụng' WHERE id = ?",
      [parsedTableId.value],
    );
    const order = await getOrderById(connection, result.insertId);
    await connection.commit();
    return res.status(201).json({ message: "Đã mở đơn hàng", order });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

router.put("/orders/:orderId", async (req, res) => {
  const parsedOrderId = parsePositiveId(req.params.orderId, "Mã đơn hàng");
  const parsedNote = validateNote(req.body.note);
  const parsedItems = validateItems(req.body.items, { allowExisting: true });
  const validationError = parsedOrderId.error || parsedNote.error || parsedItems.error;
  if (validationError) return res.status(400).json({ message: validationError });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute(
      "SELECT id FROM orders WHERE id = ? AND status = 'OPEN' FOR UPDATE",
      [parsedOrderId.value],
    );
    if (orders.length === 0) throw new HttpError(404, "Không tìm thấy đơn hàng đang mở");

    const [existingRows] = await connection.execute(
      `SELECT id, product_id, product_name, unit_price
       FROM order_items WHERE order_id = ? FOR UPDATE`,
      [parsedOrderId.value],
    );
    const existingById = new Map(existingRows.map((row) => [row.id, row]));
    const keptItemIds = [];
    const newRequests = [];
    const finalItems = [];
    const usedProductIds = new Set();

    for (const item of parsedItems.value) {
      if (item.orderItemId) {
        const existing = existingById.get(item.orderItemId);
        if (!existing) throw new HttpError(400, "Chi tiết đơn hàng không thuộc đơn này");
        if (item.productId && existing.product_id && item.productId !== existing.product_id) {
          throw new HttpError(400, "Không thể thay đổi sản phẩm của chi tiết đã lưu");
        }
        if (existing.product_id && usedProductIds.has(existing.product_id)) {
          throw new HttpError(400, "Sản phẩm bị trùng trong đơn hàng");
        }
        if (existing.product_id) usedProductIds.add(existing.product_id);
        keptItemIds.push(existing.id);
        finalItems.push({
          orderItemId: existing.id,
          productId: existing.product_id,
          productName: existing.product_name,
          unitPriceCents: decimalToCents(existing.unit_price),
          quantity: item.quantity,
        });
      } else {
        if (usedProductIds.has(item.productId)) {
          throw new HttpError(400, "Sản phẩm bị trùng trong đơn hàng");
        }
        usedProductIds.add(item.productId);
        newRequests.push(item);
      }
    }

    const products = await loadProducts(connection, newRequests.map((item) => item.productId));
    for (const item of newRequests) {
      const product = products.get(item.productId);
      finalItems.push({
        productId: product.id,
        productName: product.name,
        unitPriceCents: decimalToCents(product.price),
        quantity: item.quantity,
      });
    }
    const totalCents = calculateTotal(finalItems);

    if (keptItemIds.length > 0) {
      const placeholders = keptItemIds.map(() => "?").join(", ");
      await connection.execute(
        `DELETE FROM order_items WHERE order_id = ? AND id NOT IN (${placeholders})`,
        [parsedOrderId.value, ...keptItemIds],
      );
    } else {
      await connection.execute("DELETE FROM order_items WHERE order_id = ?", [parsedOrderId.value]);
    }

    for (const item of finalItems) {
      if (item.orderItemId) {
        await connection.execute(
          "UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ? AND order_id = ?",
          [item.quantity, centsToDecimal(item.subtotalCents), item.orderItemId, parsedOrderId.value],
        );
      } else {
        await connection.execute(
          `INSERT INTO order_items
             (order_id, product_id, product_name, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [parsedOrderId.value, item.productId, item.productName,
            centsToDecimal(item.unitPriceCents), item.quantity,
            centsToDecimal(item.subtotalCents)],
        );
      }
    }

    await connection.execute(
      "UPDATE orders SET note = ?, total_amount = ? WHERE id = ?",
      [parsedNote.value, centsToDecimal(totalCents), parsedOrderId.value],
    );
    const order = await getOrderById(connection, parsedOrderId.value);
    await connection.commit();
    return res.json({ message: "Đã cập nhật đơn hàng", order });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

router.patch("/orders/:orderId/complete", requireRole("admin"), async (req, res) => {
  const parsedOrderId = parsePositiveId(req.params.orderId, "Mã đơn hàng");
  if (parsedOrderId.error) return res.status(400).json({ message: parsedOrderId.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute(
      "SELECT id, table_id FROM orders WHERE id = ? AND status = 'OPEN' FOR UPDATE",
      [parsedOrderId.value],
    );
    if (orders.length === 0) throw new HttpError(404, "Không tìm thấy đơn hàng đang mở");

    await connection.execute(
      "UPDATE orders SET status = 'COMPLETED', closed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [parsedOrderId.value],
    );
    await connection.execute("UPDATE cafe_tables SET status = 'Trống' WHERE id = ?", [orders[0].table_id]);
    const order = await getOrderById(connection, parsedOrderId.value);
    await connection.commit();
    return res.json({ message: "Đã hoàn tất đơn hàng và trả bàn", order });
  } catch (error) {
    await connection.rollback();
    return sendError(res, error);
  } finally {
    connection.release();
  }
});

module.exports = router;
