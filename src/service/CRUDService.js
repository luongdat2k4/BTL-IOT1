const connection = require("../config/connectDB");
const dayjs = require("dayjs");

const getLastSensor = async () => {
  try {
    const [rows] = await connection.query(
      `SELECT RequestID
       FROM iot.DataRequest
       ORDER BY CAST(SUBSTRING(RequestID, 4) AS UNSIGNED) DESC
       LIMIT 1;`
    );

    if (rows.length === 0) {
      console.log("Không có dữ liệu trong bảng → Bắt đầu từ REQ001");
      return "REQ001";
    }
    const lastID = rows[0][0];
    console.log("lastID >>>", lastID);
    const numericPart = parseInt(lastID.replace("REQ", ""), 10);
    console.log("numericPart >>>", numericPart);
    const nextID = `REQ${String(numericPart + 1).padStart(3, "0")}`;
    return nextID;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu cuối cùng:", error);
    throw error;
  }
};

const insertDBrequest = async (
  requestId,
  humidity,
  light,
  temperature,
  humLed,
  lightLed,
  temLed
) => {
  try {
    const [result] = await connection.query(
      `INSERT INTO iot.DataRequest 
       (RequestID, Humidity, Light, Temperature, HumidityLed, LightLed, TemperatureLed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requestId, humidity, light, temperature, humLed, lightLed, temLed]
    );

    console.log("Đã chèn dữ liệu thành công! RequestID:", requestId);
    return result;
  } catch (error) {
    console.error("Lỗi khi insert vào DataRequest:", error);
    throw error;
  }
};

const getLastDB = async () => {
  try {
    const [result] = await connection.query(
      `SELECT Humidity,Light,Temperature,Time FROM iot.datarequest
       ORDER BY RequestID DESC
      LIMIT 1`
    );
    return result;
  } catch (error) {
    console.log("Lỗi lấy dữ liệu: ", error);
    throw error; // Throw error thay vì sử dụng res
  }
};

const getAllDB = async (sort) => {
  try {
    const [result] = await connection.query(
      `SELECT Humidity,Light,Temperature,Time
      FROM iot.datarequest
      ORDER BY RequestID ${sort};`
    );
    return result;
  } catch (error) {
    console.log("Lỗi lấy dữ liệu: ", error);
    throw error; // Throw error thay vì sử dụng res
  }
};

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
    throw error; // Throw error thay vì sử dụng res
  }
};

const findREQ = async (key, sensor, sort = "DESC") => {
  try {
    // sanitize sort
    sort = (sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";

    if (["Humidity", "Light", "Temperature"].includes(sensor)) {
      // coerce key to number; if invalid, return empty
      const numKey = Number(key);
      if (Number.isNaN(numKey)) {
        return [];
      }
      const query = `
      SELECT Humidity,Light,Temperature,Time 
      FROM iot.datarequest 
      WHERE ${sensor} > ? AND ${sensor} < ?
      ORDER BY RequestID ${sort};
    `;
      const [rows] = await connection.query(query, [numKey - 1, numKey + 1]);
      return rows;
    } else if (["all"].includes(sensor)) {
      const query = `
      SELECT Humidity,Light,Temperature,Time
      FROM iot.datarequest
      ORDER BY RequestID ${sort};`;
      const [rows] = await connection.query(query);
      return rows;
    } else if ((sensor || "").toLowerCase() === "time") {
      // key is expected as a string like '19/09/2025 14:41:33' or partial '19/09/2025 14:41' etc.
      if (!key || typeof key !== "string") {
        // return all if no key
        const [rows] = await connection.query(
          `SELECT Humidity,Light,Temperature,Time FROM iot.datarequest ORDER BY RequestID ${sort}`
        );
        return rows;
      }

      const s = key.trim();
      // If user provided only time (no date), like '14:41:33' or '14:41' or '14', search across all dates by TIME(Time)
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
          endTime = startTime; // exact second
        } else if (mm) {
          startTime = `${hh}:${mm}:00`;
          endTime = `${hh}:${mm}:59`;
        } else {
          startTime = `${hh}:00:00`;
          endTime = `${hh}:59:59`;
        }

        const query = `
          SELECT Humidity,Light,Temperature,Time
          FROM iot.datarequest
          WHERE TIME(Time) BETWEEN ? AND ?
          ORDER BY RequestID ${sort};
        `;
        const [rows] = await connection.query(query, [startTime, endTime]);
        return rows;
      }
      // Try common formats using dayjs with custom parsing
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
      const dayjs = require("dayjs");
      const customParseFormat = require("dayjs/plugin/customParseFormat");
      dayjs.extend(customParseFormat);

      // Try parsing progressively: exact seconds -> minute -> hour -> date
      for (const fmt of formatsToTry) {
        const parsed = dayjs(s, fmt, true); // strict parsing
        if (parsed.isValid && parsed.isValid()) {
          if (fmt.endsWith("ss")) {
            // exact second
            start = parsed.startOf("second").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("second").format("YYYY-MM-DD HH:mm:ss");
          } else if (fmt.endsWith("mm")) {
            // minute precision -> entire minute
            start = parsed.startOf("minute").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("minute").format("YYYY-MM-DD HH:mm:ss");
          } else if (fmt.endsWith("HH")) {
            // hour precision -> entire hour
            start = parsed.startOf("hour").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("hour").format("YYYY-MM-DD HH:mm:ss");
          } else {
            // date only
            start = parsed.startOf("day").format("YYYY-MM-DD HH:mm:ss");
            end = parsed.endOf("day").format("YYYY-MM-DD HH:mm:ss");
          }
          break;
        }
      }

      // If we still don't have start/end, try forgiving parsing (replace / with - etc)
      if (!start) {
        const alt = s.replace(/\//g, "-");
        const parsed = dayjs(alt);
        if (parsed.isValid && parsed.isValid()) {
          // guess level based on how many parts provided
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
        const query = `
          SELECT Humidity,Light,Temperature,Time
          FROM iot.datarequest
          WHERE Time BETWEEN ? AND ?
          ORDER BY RequestID ${sort};
        `;
        const [rows] = await connection.query(query, [start, end]);
        return rows;
      }

      // Fallback: no parse -> try LIKE on formatted time string (DD/MM/YYYY...) using REPLACE/DATE_FORMAT in MySQL
      const likeKey = `%${s}%`;
      const query = `
        SELECT Humidity,Light,Temperature,Time
        FROM iot.datarequest
        WHERE DATE_FORMAT(Time, '%d/%m/%Y %H:%i:%s') LIKE ?
        ORDER BY RequestID ${sort};
      `;
      const [rows] = await connection.query(query, [likeKey]);
      return rows;
    }
  } catch (error) {
    console.error("Lỗi findDB:", error);
    throw error;
  }
};

const findHIS = async (key, sensor, sort = "DESC") => {
  try {
    sort = (sort || "DESC").toString().trim().toUpperCase();
    if (sort !== "ASC" && sort !== "DESC") sort = "DESC";
    let query;
    let params;

    // Hàm convert nhiều định dạng -> yyyy-MM-dd (MySQL DATE)
    function convertToMysqlDate(str) {
      if (!str || typeof str !== "string") {
        throw new Error("❌ convertToMysqlDate: key không hợp lệ: " + str);
      }
      const s = str.trim();

      // Nếu định dạng dd/MM/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split("/");
        return `${y}-${m}-${d}`;
      }

      // Thử parse bằng dayjs (ISO, RFC, hoặc 'YYYY-MM-DD HH:mm:ss')
      const parsed = dayjs(s);
      if (parsed.isValid && parsed.isValid()) {
        return parsed.format("YYYY-MM-DD");
      }

      // Fallback: một số chuỗi lạ có dạng 'YYYY hh:mm:ss-MM-DD' hoặc 'YYYY ...-MM-DD'
      // Thử lấy 3 số cuối dạng -MM-DD và năm là 4 chữ số đầu tiên
      const m = s.match(/^(\d{4}).*-?(\d{2})-(\d{2})$/);
      if (m) {
        const year = m[1];
        const month = m[2];
        const day = m[3];
        return `${year}-${month}-${day}`;
      }

      // Nếu không parse được, ném lỗi rõ hơn
      throw new Error(
        "❌ convertToMysqlDate: không thể parse ngày từ key: " + str
      );
    }

    const sensorNormalized = sensor?.toLowerCase(); // ép thường, tránh undefined

    if (sensorNormalized === "time") {
      // Support full and partial datetime searches similar to findREQ
      // key examples: '16/09/2025 16:21:02', '16/09/2025 16:21', '16/09/2025 16', '16/09/2025'
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

        // If user provided only time (no date), like '14:41:33' or '14:41' or '14',
        // search across all dates by TIME(time)
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
            endTime = startTime; // exact second
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
          // fallback LIKE on formatted time
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

// module.exports = {
//   getLastSensor,
//   insertDBrequest,
//   getLastDB,
//   getAllDB,
//   getLastHis,
//   insertDBhistory,
//   getAllHistory,
//   findREQ,
//   findHIS,
// };
