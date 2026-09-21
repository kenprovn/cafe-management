# Database setup

This project uses MySQL 8.0 or newer. The migration files extend the original course database, so the database must first contain the three base tables: `users`, `products`, and `cafe_tables`.

## 1. Create the database and base tables

Open the MySQL client and run:

```sql
CREATE DATABASE cafe_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE cafe_management;

CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_products_price CHECK (price > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cafe_tables (
  id INT NOT NULL AUTO_INCREMENT,
  table_number VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('Trống', 'Đang sử dụng') NOT NULL DEFAULT 'Trống',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Create at least one administrator through the approved project setup process. Never put its password in source control. The password migration below safely upgrades legacy plaintext values.

## 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and replace the placeholders with local database values. The real `.env` file is ignored by Git.

## 3. Run migrations in order

From a MySQL session connected to `cafe_management`, run:

```sql
SOURCE backend/migrations/001_create_orders.sql;
SOURCE backend/migrations/002_create_payments.sql;
SOURCE backend/migrations/003_add_employee_auth.sql;
```

Migration notes:

1. `001_create_orders.sql` creates `orders` and `order_items`. Its final table-status reset is intended only for the approved development/demo database. Review or remove that final `UPDATE` before using it with production data.
2. `002_create_payments.sql` creates `payments` and prevents more than one payment for an order.
3. `003_add_employee_auth.sql` adds employee status, constrains roles, and creates `auth_sessions`. Run it once. Before running it, verify roles:

```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

Only `admin` and `staff` are valid. Stop and correct unexpected values before migration 003.

## 4. Upgrade legacy passwords

From the `backend` directory:

```bash
node scripts/hashLegacyPasswords.js
```

The script is idempotent: it hashes only values that are not already in the project scrypt format. It reports counts only and does not print passwords or hashes.

## 5. Optional presentation data

`scripts/seedDemoHistory.js` adds the approved deterministic reporting history:

```bash
node scripts/seedDemoHistory.js
```

Safety rules:

- Use it only on a development or presentation database.
- It requires the approved 38-product menu, 10 empty cafe tables, and two active employee accounts with IDs 1 and 2.
- It marks every generated order with `[DEMO-REPORT-2026]`.
- It aborts before inserting if that marker already exists.
- Do not remove the marker or rerun the seed unnecessarily.
- Never use this demo seed on production data.

## 6. Verify the setup

Useful database checks:

```sql
SHOW TABLES;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM cafe_tables;
SELECT role, status, COUNT(*) FROM users GROUP BY role, status;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM payments;
```

With the backend running, verification scripts are available:

```bash
node scripts/verifyReports.js
node scripts/verifyEmployeeAuth.js
```

`verifyEmployeeAuth.js` requires `VERIFY_ADMIN_USERNAME`, `VERIFY_ADMIN_PASSWORD`, `VERIFY_STAFF_USERNAME`, and `VERIFY_STAFF_PASSWORD` in the process environment. Do not save those values in a tracked file.
