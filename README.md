# Roast & Co. - Hệ thống quản lý quán cà phê

Roast & Co. là đồ án quản lý quán cà phê dành cho môi trường đại học, được xây dựng theo quy trình bán hàng tại quầy (POS) thực tế. Hệ thống kết hợp quản lý bàn, gọi món, thanh toán, lịch sử hóa đơn, phân quyền nhân viên và báo cáo kinh doanh trong một giao diện responsive mang phong cách quán cà phê hiện đại.

## 1. Tổng quan dự án

Sau khi đăng nhập, nhân viên có thể chọn bàn, mở đơn hàng, thêm món, lưu đơn, thanh toán và xem lại hóa đơn đã trả. Quản trị viên có thêm quyền quản lý sản phẩm, tài khoản nhân viên và xem các báo cáo vận hành.

Mục tiêu của dự án là mô phỏng trọn vẹn một quy trình phục vụ tại quán, đồng thời giữ mã nguồn đủ rõ ràng để sinh viên có thể đọc, trình bày và tiếp tục phát triển.

## 2. Chức năng chính

- Duy trì phiên đăng nhập và phân quyền ở cả frontend lẫn backend
- Quản lý sản phẩm và tài khoản nhân viên
- Theo dõi trạng thái bàn và đơn hàng đang mở
- Tìm kiếm thực đơn, thêm món, chỉnh số lượng, ghi chú và lưu giá lịch sử
- Thanh toán bằng tiền mặt, chuyển khoản hoặc thẻ
- Xem lịch sử hóa đơn đã thanh toán, chi tiết hóa đơn và bản in
- Dashboard tính doanh thu từ các giao dịch thanh toán thành công
- Báo cáo theo khoảng ngày về doanh thu, sản phẩm, phương thức thanh toán, nhân viên và bàn
- Giao diện responsive cho desktop, tablet và thiết bị di động

## 3. Phân quyền Admin / Staff

| Vai trò | Quyền truy cập |
| --- | --- |
| `admin` | Dashboard, sản phẩm, bàn/POS, thanh toán, hóa đơn, nhân viên và Reports |
| `staff` | Dashboard, bàn/POS, thanh toán và xem hóa đơn |

Các thao tác thêm, sửa, xóa sản phẩm; quản lý nhân viên; và Reports đều được bảo vệ tại backend, không chỉ đơn thuần bị ẩn trên giao diện.

## 4. Công nghệ sử dụng

- Frontend: React 19, Vite, JavaScript, CSS
- Backend: Node.js, Express 5
- Database: MySQL 8 với `mysql2`
- Authentication: session token dạng opaque; database chỉ lưu SHA-256 hash của token
- Password: Node.js scrypt với salt riêng cho từng mật khẩu

Dự án không cần thư viện biểu đồ hoặc thư viện UI bên ngoài. Reports sử dụng SVG thuần và CSS.

## 5. Cấu trúc thư mục

```text
cafe-management/
├── backend/
│   ├── database/          # Hướng dẫn thiết lập database
│   ├── middleware/        # Kiểm tra xác thực và vai trò
│   ├── migrations/        # Migration đơn hàng, thanh toán và employee/session
│   ├── routes/            # Route auth, orders, invoices, users và reports
│   ├── scripts/           # Script password, seed demo và kiểm thử
│   ├── utils/             # Hàm hỗ trợ validation và bảo mật
│   └── server.js
├── public/
├── src/
│   ├── components/        # Component UI dùng chung và theo chức năng
│   ├── pages/             # Các trang của ứng dụng
│   ├── services/api.js    # API client của frontend
│   ├── App.jsx
│   └── App.css
└── README.md
```

## 6. Yêu cầu hệ thống

- Node.js 20 trở lên
- npm
- MySQL 8.0 trở lên
- Trình duyệt hiện đại như Chrome, Edge hoặc Firefox

## 7. Cài đặt project

Clone project và chuyển vào thư mục dự án:

```bash
git clone <repository-url>
cd cafe-management
```

Cài dependency ở thư mục gốc/frontend:

```bash
npm install
```

Cài dependency cho backend:

```bash
cd backend
npm install
cd ..
```

Phần cài đặt ở thư mục gốc cung cấp `mysql2`, được dùng chung theo cấu trúc hiện tại của project. Không cần cài thêm package ngoài các dependency đã khai báo.

## 8. Cấu hình backend và `.env`

Sao chép `backend/.env.example` thành `backend/.env`, sau đó điền thông tin kết nối MySQL trên máy local:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafe_management
DB_PORT=3306
```

Không commit `backend/.env`, mật khẩu thật, token hoặc bất kỳ thông tin bí mật nào lên Git.

Nếu không cấu hình riêng, frontend dùng hostname đang mở trên trình duyệt và backend port `5000` (ví dụ `http://localhost:5000/api` hoặc `http://192.168.1.10:5000/api`). Nếu backend chạy ở địa chỉ khác, đặt biến Vite tùy chọn trước khi khởi động frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Backend mặc định lắng nghe tại port `5000`. Có thể thay đổi bằng biến môi trường `PORT`.

## 9. Thiết lập database

Thực hiện theo tài liệu [backend/database/README.md](backend/database/README.md). Tài liệu này bao gồm:

- Tạo database và ba bảng nền tảng
- Kiểm tra dữ liệu trước migration
- Thứ tự migration bắt buộc
- Nâng cấp mật khẩu cũ sang scrypt
- Quy tắc seed dữ liệu demo
- Các câu lệnh kiểm tra tính toàn vẹn

Database nền tảng phải có các bảng `users`, `products` và `cafe_tables` trước khi chạy migration.

## 10. Chạy migrations theo đúng thứ tự

Từ thư mục gốc project, chạy lần lượt:

```bash
mysql -u root -p cafe_management -e "source backend/migrations/001_create_orders.sql"
mysql -u root -p cafe_management -e "source backend/migrations/002_create_payments.sql"
mysql -u root -p cafe_management -e "source backend/migrations/003_add_employee_auth.sql"
mysql -u root -p cafe_management -e "source backend/migrations/004_add_product_images.sql"
```

Thứ tự không được thay đổi:

1. `backend/migrations/001_create_orders.sql`
2. `backend/migrations/002_create_payments.sql`
3. `backend/migrations/003_add_employee_auth.sql`
4. `backend/migrations/004_add_product_images.sql`

Lưu ý quan trọng:

- `001_create_orders.sql` có câu lệnh đưa các bàn `Đang sử dụng` về `Trống`. Câu lệnh này chỉ được phê duyệt cho database development/demo; hãy kiểm tra kỹ trước khi dùng với dữ liệu khác.
- Trước khi chạy `003_add_employee_auth.sql`, phải bảo đảm mọi giá trị hiện có trong `users.role` chỉ là `admin` hoặc `staff`.
- `003_add_employee_auth.sql` chỉ nên chạy một lần vì có thao tác `ALTER TABLE` và tạo `auth_sessions`.
- Không chạy lại migration một cách mù quáng trên database đang có dữ liệu thật.

Sau migration, chuyển mật khẩu legacy sang scrypt bằng script idempotent:

```bash
cd backend
node scripts/hashLegacyPasswords.js
cd ..
```

Script chỉ hash những mật khẩu chưa ở định dạng scrypt mới và không hash lại mật khẩu đã được nâng cấp.

## 11. Chạy frontend và backend

Khởi động backend từ thư mục gốc project:

```bash
cd backend
node server.js
```

API sẽ có tại `http://localhost:5000` nếu chưa cấu hình `PORT`.

Trong terminal thứ hai, từ thư mục gốc project, chạy frontend:

```bash
npm run dev
```

Mở URL local do Vite hiển thị, thông thường là `http://localhost:5173`.

## Truy cập từ máy khác trong cùng Wi-Fi

### Trên máy chủ

Đảm bảo MySQL đang chạy, sau đó khởi động backend và frontend trong hai terminal:

```bash
cd backend
node server.js
```

```bash
npm run dev
```

Chạy `ipconfig` để tìm địa chỉ IPv4 của máy chủ, ví dụ `IPv4 Address: 192.168.1.10`.

### Trên máy thành viên khác

Kết nối cùng Wi-Fi/LAN và mở `http://<IP-MAY-CHU>:5173`, ví dụ `http://192.168.1.10:5173`. Máy chủ phải tiếp tục chạy MySQL, backend và frontend; máy thành viên không cần Node.js, MySQL hoặc source code.

Windows Firewall có thể yêu cầu cấp quyền cho Node.js. Chỉ cho phép trên **Private networks**. Nếu không kết nối được, kiểm tra Node.js đã được phép trên mạng riêng. Không mở hoặc chuyển tiếp port `5173` hay `5000` qua router/public internet.

### Ảnh sản phẩm

Đặt file ảnh thật trong `public/images/products/` và lưu đường dẫn dạng `/images/products/tiramisu.jpg` cho sản phẩm. Nếu đường dẫn trống hoặc ảnh tải lỗi, giao diện tự hiển thị icon mặc định.

Để kiểm tra bản build production:

```bash
npm run lint
npm run build
```

## 12. Tài khoản demo / hướng dẫn tạo tài khoản

README không lưu mật khẩu demo và trang đăng nhập không hiển thị thông tin đăng nhập mẫu. Khi thuyết trình, chỉ sử dụng tài khoản `admin` và `staff` đang hoạt động trong database trình diễn. Nhận thông tin đăng nhập đã được phê duyệt từ chủ project ngay trước buổi demo.

Với database mới hoàn toàn, cần tạo tài khoản quản trị viên ban đầu bằng quy trình được nhóm phê duyệt. Nếu phải khởi tạo từ dữ liệu legacy, có thể chèn một mật khẩu tạm thời bằng công cụ quản trị database, sau đó chạy ngay:

```bash
cd backend
node scripts/hashLegacyPasswords.js
```

Không ghi mật khẩu thật vào README, source code, script được commit hoặc lịch sử terminal dùng chung. Sau khi đăng nhập bằng tài khoản quản trị viên, nên tạo và quản lý các tài khoản tiếp theo qua trang **Nhân viên**.

## 13. Quy trình đặt món và thanh toán

1. Đăng nhập bằng tài khoản quản trị viên hoặc nhân viên.
2. Mở **Quản lý bàn**.
3. Chọn bàn trống để tạo đơn mới hoặc bàn đang sử dụng để tiếp tục đơn hiện có.
4. Tìm món, thêm sản phẩm, điều chỉnh số lượng, nhập ghi chú nếu cần và lưu đơn.
5. Giá hiện tại của sản phẩm được chụp vào `order_items.unit_price` khi món được thêm lần đầu. Việc đổi số lượng sau đó không làm thay đổi giá lịch sử này.
6. Chọn **Thanh toán**, chọn `CASH`, `BANK_TRANSFER` hoặc `CARD`, rồi xác nhận checkout.
7. Backend khóa đơn, dùng `orders.total_amount` làm số tiền thanh toán, tạo đúng một bản ghi `payments`, hoàn tất đơn và trả bàn về `Trống`.
8. Xem hoặc in hóa đơn được tạo.
9. Với quyền `admin`, có thể tiếp tục xem sản phẩm, nhân viên và Reports.

Frontend sử dụng `POST /api/orders/:orderId/checkout` làm luồng hoàn tất đơn thông thường. `PATCH /api/orders/:orderId/complete` chỉ được giữ để tương thích ngược và không phải thao tác thanh toán chính trên UI.

## 14. API chính

| Khu vực | Endpoint chính |
| --- | --- |
| Xác thực | `POST /api/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Sản phẩm | `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` |
| Bàn | `GET /api/tables`, `PUT /api/tables/:id` |
| Bàn và đơn hàng | `GET /api/tables/:tableId/active-order`, `POST /api/tables/:tableId/orders`, `PUT /api/orders/:orderId` |
| Thanh toán | `POST /api/orders/:orderId/checkout` |
| Tương thích ngược | `PATCH /api/orders/:orderId/complete` |
| Hóa đơn | `GET /api/invoices`, `GET /api/invoices/:invoiceId` |
| Tổng quan | `GET /api/dashboard/summary` |
| Nhân viên | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `PATCH /api/users/:id/password`, `PATCH /api/users/:id/status` |
| Báo cáo | `GET /api/reports/overview?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` |

Mọi request được bảo vệ đều gửi `Authorization: Bearer <session-token>`. Không ghi log, commit hoặc chia sẻ session token.

## 15. Các bảng database

- `users`: định danh nhân viên, vai trò, trạng thái và password hash
- `auth_sessions`: session token đã hash và thời gian hết hạn
- `products`: tên món, giá hiện tại và đường dẫn ảnh tùy chọn trong thực đơn
- `cafe_tables`: số bàn và trạng thái bàn
- `orders`: thông tin chung của đơn theo bàn, trạng thái, tổng tiền, thời gian và người tạo
- `order_items`: snapshot lịch sử của tên món, đơn giá, số lượng và thành tiền
- `payments`: đúng một giao dịch thanh toán thành công cho mỗi đơn đã trả

Các khóa ngoại từ `orders.created_by` và `payments.paid_by` giữ lại lịch sử nhân viên. Vì vậy tài khoản nhân viên được vô hiệu hóa thay vì xóa vật lý.

## 16. Dashboard và Reports

Dashboard hiển thị tình trạng vận hành và doanh thu trong ngày. Doanh thu chỉ lấy từ các bản ghi thanh toán thành công trong `payments`; đơn có trạng thái hoàn tất nhưng không có payment không được tính là doanh thu.

Reports chỉ dành cho `admin` và hỗ trợ các preset **Hôm nay**, **7 ngày**, **30 ngày**, **Tháng này** cùng khoảng ngày tùy chọn. Tất cả phép tổng hợp được thực hiện tại backend/database, sử dụng ngày lịch Việt Nam (`UTC+7`) với điều kiện:

```text
paid_at >= date_from 00:00:00
paid_at < day-after-date_to 00:00:00
```

Các chỉ số gồm:

- Tổng doanh thu
- Số hóa đơn đã thanh toán
- Giá trị hóa đơn trung bình
- Tổng số lượng sản phẩm đã bán
- Xu hướng doanh thu theo ngày, bao gồm ngày có giá trị bằng 0
- Top sản phẩm theo số lượng và doanh thu
- Thống kê phương thức thanh toán
- Giao dịch theo nhân viên
- Hiệu quả theo bàn

Tên sản phẩm, số lượng, đơn giá và thành tiền trong báo cáo được lấy từ snapshot lịch sử của `order_items`, không phụ thuộc vào tên hoặc giá sản phẩm hiện tại.

## 17. Seed dữ liệu demo

Script `backend/scripts/seedDemoHistory.js` tạo dữ liệu lịch sử xác định trước cho mục đích trình diễn Reports:

- 75 đơn đã thanh toán trong khoảng `2026-08-24` đến `2026-09-20`
- 182 dòng `order_items`
- Tổng số lượng 243 sản phẩm
- Tổng doanh thu demo 9.519.000 VND
- Mỗi đơn có marker `[DEMO-REPORT-2026]`
- Đúng một payment cho mỗi đơn
- Sử dụng hai tài khoản nhân viên đang hoạt động, 10 bàn và 38 sản phẩm đã cấu hình

Chỉ chạy sau khi đã đọc phần cảnh báo trong [backend/database/README.md](backend/database/README.md):

```bash
cd backend
node scripts/seedDemoHistory.js
```

Script sẽ dừng trước khi chèn dữ liệu nếu marker đã tồn tại. Không chạy script này trên production hoặc database có cấu trúc/dữ liệu không đúng với bộ demo đã được phê duyệt.

## 18. Các script verify

Khởi động backend trước khi chạy các script kiểm thử API.

Kiểm tra Reports và đối soát dữ liệu demo:

```bash
cd backend
node scripts/verifyReports.js
```

Kiểm tra authentication, employee permissions và quy trình POS cần bốn biến môi trường, không lưu các giá trị thật trong file được theo dõi bởi Git:

```text
VERIFY_ADMIN_USERNAME
VERIFY_ADMIN_PASSWORD
VERIFY_STAFF_USERNAME
VERIFY_STAFF_PASSWORD
```

Sau khi đặt các biến trên trong process environment, chạy:

```bash
cd backend
node scripts/verifyEmployeeAuth.js
```

`verifyEmployeeAuth.js` thực hiện các thao tác ghi để kiểm tra tạo/vô hiệu hóa tài khoản và một quy trình POS/checkout. Chỉ chạy trên database development/demo, không chạy trên production.

Các kiểm tra chất lượng mã nguồn:

```bash
npm run lint
npm run build
git diff --check
```

## 19. Hạn chế hiện tại

- Project được thiết kế cho một chi nhánh quán cà phê và môi trường trình diễn đại học.
- Danh mục sản phẩm chưa được lưu trong database nên chưa có báo cáo theo danh mục.
- Frontend lưu opaque session token trong local storage; hệ thống production nên dùng secure HTTP-only cookie và HTTPS.
- Danh sách hóa đơn và nhân viên chưa phân trang vì dữ liệu demo còn nhỏ.
- Database mới hoàn toàn vẫn cần một tài khoản quản trị viên ban đầu đã được phê duyệt.
- Chưa có quy trình hoàn tiền, hủy đơn có audit, quản lý tồn kho hoặc nguyên liệu.
- Migration hiện được chạy thủ công và cần backup/kiểm tra trước khi dùng ngoài môi trường demo.
- Chưa có test suite tự động hoàn chỉnh cho API và trình duyệt.

## 20. Hướng phát triển

- Lưu category sản phẩm và bổ sung báo cáo theo category
- Thêm pagination và xuất báo cáo CSV/PDF
- Quản lý tồn kho và định lượng nguyên liệu
- Bổ sung hoàn tiền và audit việc hủy đơn
- Xây dựng test suite tự động cho API và trình duyệt
- Chuyển authentication production sang secure cookie và giới hạn CORS
- Bổ sung backup, restore và quy trình triển khai database

## 21. Ảnh chụp màn hình

Thêm ảnh chụp hoàn thiện của đồ án vào đây trước khi nộp:

- Login và Dashboard
- Sơ đồ bàn và màn hình POS
- Checkout và bản in hóa đơn
- Quản lý nhân viên
- Reports trên desktop
- Reports hoặc POS trên mobile/tablet

Ví dụ cấu trúc có thể dùng sau khi thêm ảnh vào thư mục phù hợp:

```markdown
![Dashboard](docs/screenshots/dashboard.png)
![POS](docs/screenshots/pos.png)
![Reports](docs/screenshots/reports.png)
```
