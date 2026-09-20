require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: false,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Kết nối MySQL thất bại:", err.message);
    return;
  }

  console.log("✅ Kết nối MySQL thành công!");
  connection.release();
});

module.exports = db;
