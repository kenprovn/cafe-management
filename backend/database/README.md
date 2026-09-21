# Hướng dẫn thiết lập cơ sở dữ liệu

Dự án sử dụng MySQL 8.0 trở lên. Tài liệu này hướng dẫn tạo schema nền tảng, chạy migration theo đúng thứ tự, nâng cấp mật khẩu, seed dữ liệu demo và kiểm tra tính toàn vẹn.

Các file migration hiện tại mở rộng từ cơ sở dữ liệu ban đầu của đồ án. Vì vậy, database cần có ba bảng cơ bản trước khi chạy migration:

- `users`
- `products`
- `cafe_tables`

Không đưa mật khẩu thật, token, password hash hoặc nội dung `backend/.env` vào tài liệu, log dùng chung hay Git.

## 1. Tạo database và các bảng cơ bản

Mở MySQL client và chạy nguyên khối SQL sau:

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

Nếu database hoặc các bảng này đã tồn tại, không chạy lại khối tạo schema một cách mù quáng. Trước tiên hãy kiểm tra schema và sao lưu dữ liệu cần thiết.

## 2. Cấu hình kết nối

Sao chép `backend/.env.example` thành `backend/.env` và thay các placeholder bằng thông tin MySQL local:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafe_management
DB_PORT=3306
```

`backend/.env` đã được ignore và không được commit. Chỉ `backend/.env.example` với placeholder an toàn được lưu trong repository.

## 3. Kiểm tra trước migration

Xác nhận ba bảng nền tảng tồn tại:

```sql
USE cafe_management;

SHOW TABLES;
DESCRIBE users;
DESCRIBE products;
DESCRIBE cafe_tables;
```

Trước khi đổi `users.role` từ `VARCHAR` sang `ENUM`, kiểm tra tất cả giá trị đang có:

```sql
SELECT role, COUNT(*) AS total
FROM users
GROUP BY role;
```

Chỉ tiếp tục nếu mọi giá trị `role` đều là:

- `admin`
- `staff`

Nếu xuất hiện giá trị khác, dừng migration và xử lý dữ liệu đó theo quyết định của nhóm. Không tự động đổi hoặc xóa tài khoản.

## 4. Chạy migration theo đúng thứ tự

Chạy các migration từ thư mục gốc project theo đúng thứ tự sau:

```bash
mysql -u root -p cafe_management -e "source backend/migrations/001_create_orders.sql"
mysql -u root -p cafe_management -e "source backend/migrations/002_create_payments.sql"
mysql -u root -p cafe_management -e "source backend/migrations/003_add_employee_auth.sql"
mysql -u root -p cafe_management -e "source backend/migrations/004_add_product_images.sql"
```

### 4.1. `001_create_orders.sql`

Migration này tạo:

- `orders`
- `order_items`
- Khóa ngoại tới `cafe_tables`, `users` và `products`
- Ràng buộc mỗi bàn chỉ có một đơn `OPEN`
- Snapshot `product_name`, `unit_price`, `quantity` và `subtotal`

File sử dụng `CREATE TABLE IF NOT EXISTS`, nhưng cuối file có câu lệnh:

```sql
UPDATE cafe_tables
SET status = 'Trống'
WHERE status = 'Đang sử dụng';
```

Câu lệnh reset trạng thái bàn chỉ được phê duyệt cho database development/demo hiện tại. Không dùng nguyên trạng trên production hoặc database có phiên phục vụ thật. Hãy sao lưu và xem xét bỏ câu lệnh này nếu triển khai ở môi trường khác.

### 4.2. `002_create_payments.sql`

Migration này tạo bảng `payments` với:

- Một payment duy nhất cho mỗi `order_id`
- Các phương thức `CASH`, `BANK_TRANSFER` và `CARD`
- Người xử lý thanh toán trong `paid_by`
- Thời gian thanh toán trong `paid_at`
- Khóa ngoại bảo toàn lịch sử đơn hàng và nhân viên

File dùng `CREATE TABLE IF NOT EXISTS` và không tạo payment giả cho các đơn `COMPLETED` cũ. Những đơn hoàn tất nhưng chưa có payment được giữ nguyên và không được tính vào doanh thu.

### 4.3. `003_add_employee_auth.sql`

Migration này:

- Đổi `users.role` thành `ENUM('admin', 'staff')`
- Thêm `users.status` với `ACTIVE` và `DISABLED`
- Thêm index `idx_users_role_status`
- Tạo bảng `auth_sessions`
- Chỉ lưu SHA-256 token hash trong `auth_sessions.token_hash`

Chỉ chạy file này một lần. File không dùng `IF NOT EXISTS` cho `ALTER TABLE` và `CREATE TABLE auth_sessions`; chạy lại sẽ gây lỗi do column, index hoặc table đã tồn tại.

### 4.4. `004_add_product_images.sql`

Migration này thêm cột `products.image_url VARCHAR(255) NULL` để lưu đường dẫn ảnh tùy chọn. Migration không xóa hoặc cập nhật sản phẩm, order, payment hay snapshot lịch sử. Các sản phẩm hiện có sẽ giữ `image_url` là `NULL` cho đến khi người dùng đặt file ảnh thật và chủ động nhập đường dẫn.

## 5. Kiểm tra schema sau migration

```sql
SHOW TABLES;

DESCRIBE users;
DESCRIBE auth_sessions;
DESCRIBE products;
DESCRIBE orders;
DESCRIBE order_items;
DESCRIBE payments;

SHOW CREATE TABLE orders;
SHOW CREATE TABLE order_items;
SHOW CREATE TABLE payments;
SHOW CREATE TABLE auth_sessions;
```

Sau khi hoàn tất, database phải có bảy bảng nghiệp vụ:

- `users`
- `auth_sessions`
- `products`
- `cafe_tables`
- `orders`
- `order_items`
- `payments`

## 6. Nâng cấp mật khẩu legacy sang scrypt

Các tài khoản cũ có thể vẫn chứa mật khẩu plaintext. Sau khi cấu hình `backend/.env`, chạy từ thư mục `backend`:

```bash
node scripts/hashLegacyPasswords.js
```

Script này có tính idempotent:

- Chỉ hash mật khẩu chưa ở định dạng scrypt mới
- Không hash lại mật khẩu đã được nâng cấp
- Không in plaintext password
- Không in password hash
- Giữ nguyên tài khoản hiện có để tránh khóa người dùng khỏi hệ thống

Có thể chạy lại script để kiểm tra mà không làm hỏng password hash đã có.

## 7. Tài khoản quản trị viên ban đầu

Database mới hoàn toàn cần ít nhất một tài khoản `admin` ở trạng thái `ACTIVE`. Dùng quy trình khởi tạo đã được nhóm phê duyệt và mật khẩu tạm thời an toàn, sau đó chạy ngay `node scripts/hashLegacyPasswords.js` trước khi cho phép đăng nhập.

Không đặt mật khẩu thật trong migration, README hoặc source code. Sau khi hệ thống hoạt động, tạo và quản lý tài khoản tiếp theo qua trang **Nhân viên**.

## 8. Seed dữ liệu demo cho Reports

`scripts/seedDemoHistory.js` tạo bộ dữ liệu xác định trước để trình diễn dashboard và Reports:

- Khoảng ngày: `2026-08-24` đến `2026-09-20`
- 75 bản ghi `orders` ở trạng thái đã thanh toán
- 182 bản ghi `order_items`
- Tổng số lượng 243 sản phẩm
- 75 bản ghi `payments`
- Tổng doanh thu demo 9.519.000 VND
- Marker trên mọi đơn: `[DEMO-REPORT-2026]`

Script yêu cầu chính xác:

- Hai tài khoản có `id` 1 và 2 đang `ACTIVE`
- 10 bàn có `id` từ 1 đến 10 và đều ở trạng thái `Trống`
- 38 sản phẩm duy nhất theo catalog demo đã cấu hình

Script dùng seed cố định, snapshot tên/giá hiện tại của sản phẩm, tính `subtotal` và tổng tiền từ giá database, đồng thời tạo đúng một payment cho mỗi đơn.

Chạy từ thư mục `backend`:

```bash
node scripts/seedDemoHistory.js
```

Các cơ chế an toàn:

- Dừng trước khi insert nếu marker `[DEMO-REPORT-2026]` đã tồn tại
- Không sửa hoặc xóa order, order item, payment, product, user hay table hiện có
- Kiểm tra số lượng record trước và sau transaction
- Hoàn tác toàn bộ transaction nếu phân phối hoặc kiểm tra toàn vẹn không đúng
- Đảm bảo không có payment trùng, `order_items` mồ côi, `payments` mồ côi hoặc bàn còn bị chiếm

Chỉ chạy seed trên database development/demo đã được chuẩn bị đúng điều kiện. Không chạy trên production.

## 9. Kiểm tra Reports

Khởi động backend trước, sau đó chạy từ thư mục `backend`:

```bash
node scripts/verifyReports.js
```

Script kiểm tra:

- Request không đăng nhập nhận `401`
- `staff` gọi Reports nhận `403`
- Khoảng một ngày, 7 ngày, 30 ngày và toàn bộ demo
- Ngày sai định dạng, ngày không tồn tại, khoảng đảo ngược và khoảng quá 366 ngày
- Ngày không có doanh thu vẫn xuất hiện với giá trị 0
- Nguồn doanh thu chỉ đến từ `payments`
- Đơn `COMPLETED` nhưng chưa thanh toán không được tính
- Snapshot sản phẩm lịch sử không bị ảnh hưởng bởi dữ liệu sản phẩm hiện tại
- Đối soát 75 đơn, 9.519.000 VND và 243 sản phẩm của bộ demo

Phiên kiểm thử tạm thời được xóa sau khi script hoàn tất.

## 10. Kiểm tra authentication, phân quyền và POS

`scripts/verifyEmployeeAuth.js` cần bốn biến môi trường trong process đang chạy:

```text
VERIFY_ADMIN_USERNAME
VERIFY_ADMIN_PASSWORD
VERIFY_STAFF_USERNAME
VERIFY_STAFF_PASSWORD
```

Không lưu giá trị thật của các biến này trong repository hoặc file được commit.

Sau khi khởi động backend và đặt biến môi trường, chạy từ thư mục `backend`:

```bash
node scripts/verifyEmployeeAuth.js
```

Script kiểm tra login, session restore, logout, session hết hạn, password scrypt, employee API, duplicate username, đổi role/password/status, bảo vệ admin cuối cùng, staff permissions, POS, checkout, invoice và dashboard.

Lưu ý: script thực hiện các thao tác ghi. Do chính sách không xóa vật lý nhân viên, tài khoản kiểm thử được tạo có thể được giữ lại ở trạng thái `DISABLED`. Script cũng tạo một giao dịch POS/checkout để kiểm tra. Chỉ chạy trên database development/demo.

## 11. Các câu lệnh kiểm tra toàn vẹn hữu ích

Kiểm tra payment trùng theo order:

```sql
SELECT order_id, COUNT(*) AS total
FROM payments
GROUP BY order_id
HAVING COUNT(*) > 1;
```

Kiểm tra `order_items` không có order tương ứng:

```sql
SELECT oi.id
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;
```

Kiểm tra `payments` không có order tương ứng:

```sql
SELECT p.id
FROM payments p
LEFT JOIN orders o ON o.id = p.order_id
WHERE o.id IS NULL;
```

Kiểm tra bàn còn bị chiếm:

```sql
SELECT id, table_number, status
FROM cafe_tables
WHERE status <> 'Trống';
```

Kiểm tra tổng đơn không khớp payment:

```sql
SELECT o.id, o.total_amount, p.amount
FROM orders o
JOIN payments p ON p.order_id = o.id
WHERE o.total_amount <> p.amount;
```

## 12. Quy tắc bảo toàn dữ liệu

- Không sửa hoặc xóa các invoice lịch sử chỉ để làm đẹp dữ liệu demo.
- Không backfill payment giả cho đơn hoàn tất cũ.
- Không cập nhật `order_items.unit_price` khi giá trong `products` thay đổi.
- Không xóa vật lý nhân viên vì `orders.created_by` và `payments.paid_by` cần giữ lịch sử.
- Luôn sao lưu database trước khi chạy migration hoặc seed ở môi trường không phải demo.
- Không chạy lại migration `003_add_employee_auth.sql` khi schema đã có `status` và `auth_sessions`.
- Không chạy seed nếu marker demo đã tồn tại.
