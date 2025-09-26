require("dotenv").config();
let mysql2 = require("mysql2/promise");

var connection = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  rowsAsArray: true,
});

(async () => {
  try {
    const [rows] = await connection.query("SELECT NOW() AS now");
    console.log("Kết nối MySQL thành công!");
    console.log("Thời gian hiện tại:", rows[0][0]);
  } catch (err) {
    console.error("Lỗi kết nối MySQL:", err.message);
  }
})();

module.exports = connection;
