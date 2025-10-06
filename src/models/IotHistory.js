const connection = require("../config/connectDB");
const dayjs = require("dayjs");

const getLastHis = async () => {
  try {
    const [rows] = await connection.query(
      `SELECT HistoryID 
       FROM iot.history 
       ORDER BY CAST(SUBSTRING(HistoryID,4) AS UNSIGNED) DESC 
       LIMIT 1;`
    );

    if (!rows || rows.length === 0) {
      console.log("Không có dữ liệu trong bảng → Bắt đầu từ H001");
      return "HIS001";
    }

    const lastID = rows[0][0];
    console.log("lastID >>>", lastID);

    const numericPart = parseInt(lastID.replace("HIS", ""), 10);
    console.log("numericPart >>>", numericPart);

    const nextID = `HIS${String(numericPart + 1).padStart(3, "0")}`;
    return nextID;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu cuối cùng:", error);
    throw error;
  }
};

const insertDBhistory = async (hisID, device, value) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO iot.history (HistoryID, Subject, Status, UserID, RequestID)
       VALUES (?, ?, ?, "U001", "REQ001");`,
      [hisID, device, value]
    );
    return result;
  } catch (error) {
    console.error("Lỗi khi insert vào History:", error);
    throw error;
  }
};

const getAllHistory = async () => {
  try {
    const [result] = await connection.query(
      `SELECT HistoryID,Subject,status,time FROM iot.history ORDER BY HistoryID DESC`
    );
    return result;
  } catch (error) {
    console.log("Lỗi lấy dữ liệu: ", error);
    throw error;
  }
};

const dropdown = async (device, key, status) => {
  try {
    device = (device || "all").trim();
    status = (status || "all").trim().toUpperCase();
    key = (key || "").trim();

    const dayjs = require("dayjs");
    const customParseFormat = require("dayjs/plugin/customParseFormat");
    dayjs.extend(customParseFormat);

    if (!key || key.toLowerCase() === "all") {
      const sql = `
        SELECT HistoryID, Subject, status, time
        FROM iot.history
        WHERE (? = 'all' OR Subject = ?)
          AND (? = 'all' OR status = ?)
        ORDER BY HistoryID DESC;
      `;
      const [result] = await connection.query(sql, [
        device,
        device,
        status,
        status,
      ]);
      return result;
    }

    let start = null;
    let end = null;

    const timeOnlyRegex = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/;
    const match = key.match(timeOnlyRegex);
    if (match) {
      const hh = String(Number(match[1])).padStart(2, "0");
      const mm = match[2] ? String(Number(match[2])).padStart(2, "0") : "00";
      const ss = match[3] ? String(Number(match[3])).padStart(2, "0") : "00";

      if (match[3]) {
        start = `${hh}:${mm}:${ss}`;
        end = start;
      } else if (match[2]) {
        start = `${hh}:${mm}:00`;
        end = `${hh}:${mm}:59`;
      } else {
        start = `${hh}:00:00`;
        end = `${hh}:59:59`;
      }

      const sql = `
        SELECT HistoryID, Subject, status, time
        FROM iot.history
        WHERE (? = 'all' OR Subject = ?)
          AND (? = 'all' OR status = ?)
          AND TIME(time) BETWEEN ? AND ?
        ORDER BY HistoryID DESC;
      `;
      const [result] = await connection.query(sql, [
        device,
        device,
        status,
        status,
        start,
        end,
      ]);
      return result;
    }

    const formatsToTry = [
      "DD/MM/YYYY HH:mm:ss",
      "DD/MM/YYYY HH:mm",
      "DD/MM/YYYY HH",
      "DD/MM/YYYY",
      "YYYY-MM-DD HH:mm:ss",
      "YYYY-MM-DD HH:mm",
      "YYYY-MM-DD HH",
      "YYYY-MM-DD",
    ];

    for (const fmt of formatsToTry) {
      const parsed = dayjs(key, fmt, true);
      if (parsed.isValid() && parsed.isValid()) {
        if (fmt.endsWith("ss")) {
          start = parsed.startOf("second").format("YYYY-MM-DD HH:mm:ss");
          end = parsed.endOf("second").format("YYYY-MM-DD HH:mm:ss");
        } else if (fmt.endsWith("mm")) {
          start = parsed.startOf("minute").format("YYYY-MM-DD HH:mm:ss");
          end = parsed.endOf("minute").format("YYYY-MM-DD HH:mm:ss");
        } else if (fmt.endsWith("HH")) {
          start = parsed.startOf("hour").format("YYYY-MM-DD HH:mm:ss");
          end = parsed.endOf("hour").format("YYYY-MM-DD HH:mm:ss");
        } else {
          start = parsed.startOf("day").format("YYYY-MM-DD HH:mm:ss");
          end = parsed.endOf("day").format("YYYY-MM-DD HH:mm:ss");
        }
        break;
      }
    }

    if (start && end) {
      const sql = `
        SELECT HistoryID, Subject, status, time
        FROM iot.history
        WHERE (? = 'all' OR Subject = ?)
          AND (? = 'all' OR status = ?)
          AND time BETWEEN ? AND ?
        ORDER BY HistoryID DESC;
      `;
      const [result] = await connection.query(sql, [
        device,
        device,
        status,
        status,
        start,
        end,
      ]);
      return result;
    }

    const likeKey = `%${key}%`;
    const sql = `
      SELECT HistoryID, Subject, status, time
      FROM iot.history
      WHERE (? = 'all' OR Subject = ?)
        AND (? = 'all' OR status = ?)
        AND DATE_FORMAT(time, '%d/%m/%Y %H:%i:%s') LIKE ?
      ORDER BY HistoryID DESC;
    `;
    const [result] = await connection.query(sql, [
      device,
      device,
      status,
      status,
      likeKey,
    ]);
    return result;
  } catch (err) {
    console.error("Lỗi dropdown:", err);
  }
};

module.exports = {
  getLastHis,
  getAllHistory,
  insertDBhistory,
  dropdown,
};
