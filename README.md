# Roast & Co. - Coffee Shop Management System

Roast & Co. is a university cafe-management project built around a realistic point-of-sale workflow. It combines table service, ordering, payment, invoice history, employee permissions, and management reporting in a responsive coffee-shop dashboard.

## Project overview

An employee signs in, opens a table, adds menu items, saves the order, completes checkout, and reviews the paid invoice. Administrators can additionally manage products and employees and view business reports.

## Main features

- Persistent login sessions with role-based backend authorization
- Product and employee administration
- Table availability and active-order management
- POS menu search, quantity controls, notes, and stable historical pricing
- Cash, bank-transfer, and card checkout
- Paid invoice history, detail view, and print layout
- Dashboard revenue based on successful payments
- Date-based reports for revenue, products, payment methods, employees, and tables
- Responsive desktop, tablet, and mobile interface

## User roles

| Role | Access |
| --- | --- |
| `admin` | Dashboard, products, tables/POS, checkout, invoices, employees, and reports |
| `staff` | Dashboard, tables/POS, checkout, and invoice viewing |

Product mutations, employee management, and Reports are protected on the backend and are not merely hidden in the UI.

## Tech stack

- Frontend: React 19, Vite, JavaScript, CSS
- Backend: Node.js, Express 5
- Database: MySQL 8 with `mysql2`
- Authentication: opaque session tokens; only SHA-256 token hashes are stored
- Passwords: Node.js scrypt with per-password salts

No chart or UI component library is required. Reports use native SVG and CSS.

## Project structure

```text
cafe-management/
├── backend/
│   ├── database/          # Database setup guide
│   ├── middleware/        # Authentication and role checks
│   ├── migrations/        # Orders, payments, and employee/session migrations
│   ├── routes/            # Auth, orders, invoices, users, and reports
│   ├── scripts/           # Password, demo seed, and verification scripts
│   ├── utils/             # Validation and security helpers
│   └── server.js
├── public/
├── src/
│   ├── components/        # Shared UI and feature components
│   ├── pages/             # Application pages
│   ├── services/api.js    # Frontend API client
│   ├── App.jsx
│   └── App.css
└── README.md
```

## Requirements

- Node.js 20 or newer
- npm
- MySQL 8.0 or newer

## Installation

Install root/frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

The root installation provides `mysql2`, which is shared by the current project structure.

## Environment configuration

Copy `backend/.env.example` to `backend/.env` and configure the local database connection:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafe_management
DB_PORT=3306
```

Never commit `backend/.env` or real credentials.

The frontend uses `http://localhost:5000/api` by default. To use another backend, set this optional Vite variable before starting the frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

The backend listens on port `5000` by default and accepts an optional `PORT` process variable.

## Database setup

Follow [backend/database/README.md](backend/database/README.md). It documents the base tables, migration order, password upgrade, demo seed safeguards, and verification queries.

## How to run the backend

From the project root:

```bash
cd backend
node server.js
```

The API is available at `http://localhost:5000` unless `PORT` is configured.

## How to run the frontend

In a second terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Demo accounts

No passwords are stored in this README or displayed on the login page. Use only the active administrator and staff accounts provisioned for the presentation database. Obtain approved demo credentials from the project owner immediately before the demonstration.

## Main workflow

1. Sign in as an administrator or staff member.
2. Open **Quản lý bàn**.
3. Select an empty table to create an order, or an occupied table to continue its order.
4. Search the menu, add products, adjust quantities, add a note, and save.
5. Select **Thanh toán**, choose a payment method, and confirm checkout.
6. Review or print the generated invoice.
7. As an administrator, review employees, products, and Reports.

## API overview

| Area | Main endpoints |
| --- | --- |
| Authentication | `POST /api/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Products | `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` |
| Tables and orders | `GET /api/tables`, `GET /api/tables/:tableId/active-order`, `POST /api/tables/:tableId/orders`, `PUT /api/orders/:orderId` |
| Checkout | `POST /api/orders/:orderId/checkout` |
| Invoices | `GET /api/invoices`, `GET /api/invoices/:invoiceId` |
| Employees | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, password/status patch endpoints |
| Reports | `GET /api/reports/overview?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` |

All protected requests use `Authorization: Bearer <session-token>`. Do not log or share session tokens.

## Database tables

- `users`: employee identity, role, status, and password hash
- `auth_sessions`: hashed session tokens and expiration times
- `products`: current menu names and prices
- `cafe_tables`: cafe table numbers and availability
- `orders`: table order header, status, totals, timestamps, and creator
- `order_items`: historical product-name, unit-price, quantity, and subtotal snapshots
- `payments`: one successful payment per paid order

## Reports overview

Reports are administrator-only. They use successful `payments` as the financial source of truth and Vietnam calendar time (`UTC+7`). Available metrics include summary revenue, paid invoices, average invoice value, quantity sold, daily revenue, top products, payment methods, employee transactions, and table performance.

## Screenshots

Add final submission screenshots here:

- Login and dashboard
- Table map and POS order
- Checkout and invoice print view
- Employee management
- Reports on desktop and mobile

## Known limitations

- The project is intended for a single cafe location and a university demonstration environment.
- Product categories are not persisted, so category reports are intentionally unavailable.
- The frontend uses local storage for its opaque session token; production deployments should prefer secure HTTP-only cookies and HTTPS.
- Invoice and employee lists are not paginated because the demonstration dataset is small.
- A fresh database still requires an approved initial administrator account.
- No refund, cancellation, stock, or ingredient-management workflow is included.

## Future improvements

- Persist product categories and add category reports
- Add pagination and CSV/PDF report export
- Add inventory and ingredient tracking
- Add refund and order-cancellation auditing
- Add automated API and browser test suites
- Move production authentication to secure cookies and configure restricted CORS
