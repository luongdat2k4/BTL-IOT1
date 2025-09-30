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

const getAllHistory = async (sort = "DESC") => {
  try {
    sort = (sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";
    const [result] = await connection.query(
      `SELECT HistoryID,Subject,status,time FROM iot.history ORDER BY HistoryID ${sort}`
    );
    return result;
  } catch (error) {
    console.log("Lỗi lấy dữ liệu: ", error);
    throw error;
  }
};

const findHIS = async (key, sensor, sort = "DESC") => {
  try {
    sort = (sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";
    let query;
    let params;

    function convertToMysqlDate(str) {
      if (!str || typeof str !== "string") {
        throw new Error("❌ convertToMysqlDate: key không hợp lệ: " + str);
      }
      const s = str.trim();

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split("/");
        return `${y}-${m}-${d}`;
      }

      const parsed = dayjs(s);
      if (parsed.isValid && parsed.isValid()) {
        return parsed.format("YYYY-MM-DD");
      }

      const m = s.match(/^(\d{4}).*-?(\d{2})-(\d{2})$/);
      if (m) {
        const year = m[1];
        const month = m[2];
        const day = m[3];
        return `${year}-${month}-${day}`;
      }

      throw new Error(
        "❌ convertToMysqlDate: không thể parse ngày từ key: " + str
      );
    }

    const sensorNormalized = sensor?.toLowerCase();

    if (sensorNormalized === "time") {
      console.log("🔎 history key gốc:", key);

      if (!key || typeof key !== "string") {
        query = `
          SELECT HistoryID, Subject, status, time
          FROM iot.history
          ORDER BY HistoryID ${sort};
        `;
        params = [];
      } else {
        const s = key.trim();
        const timeOnlyRegex = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/;
        const timeMatch = s.match(timeOnlyRegex);
        if (timeMatch) {
          const hh = String(Number(timeMatch[1])).padStart(2, "0");
          const mm = timeMatch[2]
            ? String(Number(timeMatch[2])).padStart(2, "0")
            : null;
          const ss = timeMatch[3]
            ? String(Number(timeMatch[3])).padStart(2, "0")
            : null;
          let startTime, endTime;
          if (ss) {
            startTime = `${hh}:${mm}:${ss}`;
            endTime = startTime;
          } else if (mm) {
            startTime = `${hh}:${mm}:00`;
            endTime = `${hh}:${mm}:59`;
          } else {
            startTime = `${hh}:00:00`;
            endTime = `${hh}:59:59`;
          }

          query = `
            SELECT HistoryID, Subject, status, time
            FROM iot.history
            WHERE TIME(time) BETWEEN ? AND ?
            ORDER BY HistoryID ${sort};
          `;
          params = [startTime, endTime];
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

        let start = null;
        let end = null;
        const djs = require("dayjs");
        const customParseFormat = require("dayjs/plugin/customParseFormat");
        djs.extend(customParseFormat);

        for (const fmt of formatsToTry) {
          const parsed = djs(s, fmt, true);
          if (parsed.isValid && parsed.isValid()) {
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

        if (!start) {
          const alt = s.replace(/\//g, "-");
          const parsed = djs(alt);
          if (parsed.isValid && parsed.isValid()) {
            const parts = s.split(/\s+/);
            if (parts.length === 2 && parts[1].split(":").length === 3) {
              start = parsed.startOf("second").format("YYYY-MM-DD HH:mm:ss");
              end = parsed.endOf("second").format("YYYY-MM-DD HH:mm:ss");
            } else if (parts.length === 2 && parts[1].split(":").length === 2) {
              start = parsed.startOf("minute").format("YYYY-MM-DD HH:mm:ss");
              end = parsed.endOf("minute").format("YYYY-MM-DD HH:mm:ss");
            } else if (parts.length === 2 && parts[1].split(":").length === 1) {
              start = parsed.startOf("hour").format("YYYY-MM-DD HH:mm:ss");
              end = parsed.endOf("hour").format("YYYY-MM-DD HH:mm:ss");
            } else {
              start = parsed.startOf("day").format("YYYY-MM-DD HH:mm:ss");
              end = parsed.endOf("day").format("YYYY-MM-DD HH:mm:ss");
            }
          }
        }

        if (start && end) {
          query = `
            SELECT HistoryID, Subject, status, time
            FROM iot.history
            WHERE time BETWEEN ? AND ?
            ORDER BY HistoryID ${sort};
          `;
          params = [start, end];
        } else {
          query = `
            SELECT HistoryID, Subject, status, time
            FROM iot.history
            WHERE DATE_FORMAT(time, '%d/%m/%Y %H:%i:%s') LIKE ?
            ORDER BY HistoryID ${sort};
          `;
          params = [`%${s}%`];
        }
      }
    } else {
      query = `
        SELECT HistoryID, Subject, status, time
        FROM iot.history
        WHERE ${sensor} = ?
        ORDER BY HistoryID ${sort};
      `;
      params = [key];
    }

    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    console.error("Lỗi findHIS:", error);
    throw error;
  }
};

module.exports = {
  getLastHis,
  findHIS,
  getAllHistory,
  insertDBhistory,
};
