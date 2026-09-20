const db = require("../db");

const MARKER = "[DEMO-REPORT-2026]";
const SEED = 20260920;

const dailyPlan = [
  ["2026-08-24", 2], ["2026-08-25", 2], ["2026-08-26", 2], ["2026-08-27", 2],
  ["2026-08-28", 2], ["2026-08-29", 4], ["2026-08-30", 4], ["2026-08-31", 2],
  ["2026-09-01", 2], ["2026-09-02", 2], ["2026-09-03", 2], ["2026-09-04", 3],
  ["2026-09-05", 4], ["2026-09-06", 4], ["2026-09-07", 2], ["2026-09-08", 2],
  ["2026-09-09", 2], ["2026-09-10", 2], ["2026-09-11", 3], ["2026-09-12", 4],
  ["2026-09-13", 4], ["2026-09-14", 2], ["2026-09-15", 2], ["2026-09-16", 2],
  ["2026-09-17", 2], ["2026-09-18", 3], ["2026-09-19", 4], ["2026-09-20", 4],
];

const categoryLineCounts = {
  coffee: 73,
  tea: 33,
  milkTea: 27,
  blended: 15,
  juice: 9,
  soda: 7,
  cake: 13,
  snack: 5,
};

const productPlan = {
  coffee: [
    ["Cà phê sữa", 10], ["Bạc xỉu", 9], ["Cà phê đen", 8], ["Latte", 7],
    ["Americano", 6], ["Cold Brew", 5], ["Cappuccino", 4], ["Cà phê dừa", 4],
    ["Espresso", 3], ["Mocha", 3],
  ],
  tea: [
    ["Trà đào cam sả", 10], ["Trà vải", 7], ["Trà chanh", 5],
    ["Trà đào VIP", 4], ["Trà tắc mật ong", 3], ["Trà sen vàng", 3],
  ],
  milkTea: [
    ["Trà sữa truyền thống", 9], ["Trà sữa trân châu đường đen", 8],
    ["Matcha Latte", 7], ["Trà sữa ô long", 6], ["Hojicha Latte", 3],
  ],
  blended: [
    ["Cà phê đá xay", 4], ["Matcha đá xay", 4],
    ["Chocolate đá xay", 3], ["Cookies & Cream đá xay", 2],
  ],
  juice: [["Nước cam ép", 4], ["Nước chanh dây", 3], ["Nước ép dứa", 2]],
  soda: [["Soda chanh", 3], ["Soda việt quất", 2], ["Soda dâu", 2]],
  cake: [["Croissant bơ", 6], ["Tiramisu", 4], ["Cheesecake chanh dây", 3], ["Brownie chocolate", 2]],
  snack: [["Bánh mì que pate", 4], ["Sandwich gà", 3], ["Khoai tây chiên", 3]],
};

function randomGenerator(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function expand(distribution) {
  return distribution.flatMap(([value, count]) => Array.from({ length: count }, () => value));
}

function chooseWeighted(candidates, getWeight, random) {
  const total = candidates.reduce((sum, candidate) => sum + getWeight(candidate), 0);
  let roll = random() * total;
  for (const candidate of candidates) {
    roll -= getWeight(candidate);
    if (roll < 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

function decimalToCents(value) {
  const [whole, fraction = ""] = String(value).split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

function centsToDecimal(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function addMinutes(date, time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${date} ${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00`;
}

function timeSlots(count) {
  if (count === 2) return ["08:10", "18:15"];
  if (count === 3) return ["08:05", "12:20", "18:45"];
  return ["07:45", "10:30", "15:10", "19:20"];
}

async function tableCount(connection, table) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return Number(rows[0].count);
}

async function run() {
  const pool = db.promise();
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    const [markerRows] = await connection.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE note LIKE ?",
      [`${MARKER}%`],
    );
    if (Number(markerRows[0].count) > 0) {
      console.error(`Seed blocked: marker already exists on ${markerRows[0].count} orders. No data inserted.`);
      process.exitCode = 2;
      return;
    }

    const before = {
      orders: await tableCount(connection, "orders"),
      orderItems: await tableCount(connection, "order_items"),
      payments: await tableCount(connection, "payments"),
      products: await tableCount(connection, "products"),
      users: await tableCount(connection, "users"),
      tables: await tableCount(connection, "cafe_tables"),
    };

    const [employees] = await connection.execute(
      "SELECT id FROM users WHERE id IN (1, 2) AND status = 'ACTIVE' ORDER BY id",
    );
    if (employees.length !== 2 || employees[0].id !== 1 || employees[1].id !== 2) {
      throw new Error("The two approved active employee accounts are not available");
    }

    const [tables] = await connection.execute("SELECT id, status FROM cafe_tables ORDER BY id");
    if (tables.length !== 10 || tables.some((table, index) => table.id !== index + 1 || table.status !== "Trống")) {
      throw new Error("Expected all 10 approved cafe tables to exist and be Trống before seeding");
    }

    const configuredNames = Object.values(productPlan).flat().map(([name]) => name);
    const [products] = await connection.execute("SELECT id, name, price FROM products ORDER BY id");
    const productByName = new Map(products.map((product) => [product.name, product]));
    if (products.length !== 38 || configuredNames.length !== 38 || new Set(configuredNames).size !== 38) {
      throw new Error("Expected exactly 38 configured unique products");
    }
    const missingProducts = configuredNames.filter((name) => !productByName.has(name));
    if (missingProducts.length) throw new Error(`Missing configured products: ${missingProducts.join(", ")}`);

    const random = randomGenerator(SEED);
    const orderDates = dailyPlan.flatMap(([date, count]) => timeSlots(count).map((time) => ({ date, time })));
    const lineCounts = shuffle(expand([[1, 15], [2, 28], [3, 20], [4, 9], [5, 3]]), random);
    const quantities = shuffle(expand([[1, 130], [2, 43], [3, 9]]), random);
    const employeeIds = shuffle(expand([[1, 30], [2, 45]]), random);
    const tableIds = shuffle(expand([[1, 9], [2, 8], [3, 8], [4, 8], [5, 8], [6, 7], [7, 7], [8, 7], [9, 7], [10, 6]]), random);
    const methods = shuffle(expand([["CASH", 30], ["BANK_TRANSFER", 34], ["CARD", 11]]), random);
    const remainingCategories = { ...categoryLineCounts };
    let quantityIndex = 0;
    const generatedOrders = [];

    for (let orderIndex = 0; orderIndex < 75; orderIndex += 1) {
      const usedProductNames = new Set();
      const categoryUsage = {};
      const items = [];

      for (let lineIndex = 0; lineIndex < lineCounts[orderIndex]; lineIndex += 1) {
        const eligibleCategories = Object.keys(remainingCategories).filter((category) => (
          remainingCategories[category] > 0
          && (categoryUsage[category] || 0) < productPlan[category].length
        ));
        const category = chooseWeighted(eligibleCategories, (candidate) => remainingCategories[candidate], random);
        remainingCategories[category] -= 1;
        categoryUsage[category] = (categoryUsage[category] || 0) + 1;

        const candidates = productPlan[category].filter(([name]) => !usedProductNames.has(name));
        const selected = chooseWeighted(candidates, ([, weight]) => weight, random);
        const product = productByName.get(selected[0]);
        const quantity = quantities[quantityIndex];
        quantityIndex += 1;
        usedProductNames.add(product.name);
        const unitPriceCents = decimalToCents(product.price);
        items.push({
          productId: product.id,
          productName: product.name,
          unitPriceCents,
          quantity,
          subtotalCents: unitPriceCents * quantity,
        });
      }

      const created = `${orderDates[orderIndex].date} ${orderDates[orderIndex].time}:00`;
      const closed = addMinutes(orderDates[orderIndex].date, orderDates[orderIndex].time, 25 + Math.floor(random() * 66));
      generatedOrders.push({
        tableId: tableIds[orderIndex],
        employeeId: employeeIds[orderIndex],
        paymentMethod: methods[orderIndex],
        created,
        closed,
        items,
        totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
      });
    }

    if (orderDates.length !== 75 || lineCounts.reduce((sum, count) => sum + count, 0) !== 182 || quantityIndex !== 182) {
      throw new Error("Generated distribution does not match the approved order and line counts");
    }
    if (Object.values(remainingCategories).some((count) => count !== 0)) {
      throw new Error("Generated category distribution is incomplete");
    }

    await connection.beginTransaction();
    transactionStarted = true;
    for (let index = 0; index < generatedOrders.length; index += 1) {
      const order = generatedOrders[index];
      const [orderResult] = await connection.execute(
        `INSERT INTO orders
           (table_id, created_by, status, note, total_amount, created_at, updated_at, closed_at)
         VALUES (?, ?, 'COMPLETED', ?, ?, ?, ?, ?)`,
        [order.tableId, order.employeeId, `${MARKER} Đơn trình diễn ${String(index + 1).padStart(3, "0")}`,
          centsToDecimal(order.totalCents), order.created, order.closed, order.closed],
      );

      for (const item of order.items) {
        await connection.execute(
          `INSERT INTO order_items
             (order_id, product_id, product_name, unit_price, quantity, subtotal, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderResult.insertId, item.productId, item.productName, centsToDecimal(item.unitPriceCents),
            item.quantity, centsToDecimal(item.subtotalCents), order.created, order.closed],
        );
      }

      await connection.execute(
        `INSERT INTO payments (order_id, amount, payment_method, paid_by, paid_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, centsToDecimal(order.totalCents), order.paymentMethod,
          order.employeeId, order.closed, order.closed],
      );
    }

    const [verification] = await connection.execute(
      `SELECT COUNT(DISTINCT o.id) AS order_count,
              COUNT(DISTINCT p.id) AS payment_count,
              COUNT(oi.id) AS line_count,
              COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
              COALESCE(SUM(oi.subtotal), 0) AS item_revenue
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN payments p ON p.order_id = o.id
       WHERE o.note LIKE ?`,
      [`${MARKER}%`],
    );
    const summary = verification[0];
    if (Number(summary.order_count) !== 75 || Number(summary.payment_count) !== 75
        || Number(summary.line_count) !== 182 || Number(summary.quantity_sold) !== 243) {
      throw new Error("Post-insert demo counts do not match the approved plan");
    }

    const [integrity] = await connection.execute(
      `SELECT
         (SELECT COUNT(*) FROM payments p JOIN orders o ON o.id = p.order_id
          WHERE o.note LIKE ? GROUP BY p.order_id HAVING COUNT(*) > 1) AS duplicate_payment_probe,
         (SELECT COUNT(*) FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE o.id IS NULL) AS orphan_items,
         (SELECT COUNT(*) FROM payments p LEFT JOIN orders o ON o.id = p.order_id WHERE o.id IS NULL) AS orphan_payments,
         (SELECT COUNT(*) FROM cafe_tables WHERE status <> 'Trống') AS occupied_tables,
         (SELECT COUNT(*) FROM orders o JOIN payments p ON p.order_id = o.id
          WHERE o.note LIKE ? AND o.total_amount <> p.amount) AS payment_mismatches,
         (SELECT COUNT(*) FROM orders o JOIN
            (SELECT order_id, SUM(subtotal) AS item_total FROM order_items GROUP BY order_id) totals
            ON totals.order_id = o.id
          WHERE o.note LIKE ? AND o.total_amount <> totals.item_total) AS total_mismatches`,
      [`${MARKER}%`, `${MARKER}%`, `${MARKER}%`],
    );
    if (integrity[0].duplicate_payment_probe !== null || Number(integrity[0].orphan_items) !== 0
        || Number(integrity[0].orphan_payments) !== 0 || Number(integrity[0].occupied_tables) !== 0
        || Number(integrity[0].payment_mismatches) !== 0 || Number(integrity[0].total_mismatches) !== 0) {
      throw new Error("Post-insert integrity verification failed");
    }

    const after = {
      orders: await tableCount(connection, "orders"),
      orderItems: await tableCount(connection, "order_items"),
      payments: await tableCount(connection, "payments"),
      products: await tableCount(connection, "products"),
      users: await tableCount(connection, "users"),
      tables: await tableCount(connection, "cafe_tables"),
    };
    if (after.orders !== before.orders + 75 || after.orderItems !== before.orderItems + 182
        || after.payments !== before.payments + 75 || after.products !== before.products
        || after.users !== before.users || after.tables !== before.tables) {
      throw new Error("Existing record preservation check failed");
    }

    await connection.commit();
    transactionStarted = false;
    console.log(JSON.stringify({
      marker: MARKER,
      seed: SEED,
      inserted: { orders: 75, order_items: 182, payments: 75, quantity: 243 },
      preservedCounts: { products: after.products, users: after.users, tables: after.tables },
      errors: [],
    }, null, 2));
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

run();
